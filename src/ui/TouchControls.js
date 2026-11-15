// =====================================================================
//  TouchControls.js — Controles táctiles equivalentes al teclado.
//  Responsable: Integrante 1 (controles táctiles).
//
//  · Joystick izquierdo  → mover.
//  · Joystick derecho    → apuntar la linterna.
//  · Botón ACTUAR        → equivalente a E (mantener para el generador).
//  · Botón LUZ           → equivalente a F.
//  Soporta multitoque (se sigue cada dedo por su pointer.id).
// =====================================================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DEPTH } from '../config/constants.js';
import { TEX } from '../assets/TextureFactory.js';
import { makeText } from './UIHelpers.js';

const R = 62; // recorrido máximo del pulgar (px)
const DEAD = 0.14;

export default class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.enabled = true;

    this.moveX = 0;
    this.moveY = 0;
    this.aimActive = false;
    this.aimAngle = 0;
    this.interactHeld = false;
    this._interactEdge = false;
    this._flashEdge = false;

    this.pointers = { move: null, aim: null };
    this.objects = [];

    // Posiciones fijas de los controles (en coordenadas del juego 960x540)
    this.sticks = {
      move: { x: 130, y: 410, thumb: null, base: null },
      aim: { x: 830, y: 420, thumb: null, base: null }
    };

    for (const key of ['move', 'aim']) {
      const s = this.sticks[key];
      s.base = scene.add.image(s.x, s.y, TEX.JOY_BASE).setAlpha(0.7);
      s.thumb = scene.add.image(s.x, s.y, TEX.JOY_THUMB).setAlpha(0.85);
      s.zone = scene.add.zone(s.x - 110, s.y - 110, 220, 220).setOrigin(0, 0).setInteractive();
      s.zone.on('pointerdown', (p) => this.startStick(key, p));
      this.objects.push(s.base, s.thumb, s.zone);
    }
    const aimLabel = makeText(scene, this.sticks.aim.x, this.sticks.aim.y + 84, 'APUNTAR', { size: 11, color: '#cfc6dc', originX: 0.5, style: 'bold' });
    const moveLabel = makeText(scene, this.sticks.move.x, this.sticks.move.y + 84, 'MOVER', { size: 11, color: '#cfc6dc', originX: 0.5, style: 'bold' });
    this.objects.push(aimLabel, moveLabel);

    // Botones
    this.btnInteract = this.makeButton(900, 316, 'E', 'ACTUAR', () => {
      this.interactHeld = true;
      this._interactEdge = true;
    }, () => {
      this.interactHeld = false;
    });
    this.btnFlash = this.makeButton(770, 316, null, 'LUZ', () => {
      this._flashEdge = true;
    }, () => {}, TEX.ICON_LIGHT);

    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
    scene.events.once('shutdown', () => {
      scene.input.off('pointermove', this.onMove, this);
      scene.input.off('pointerup', this.onUp, this);
      scene.input.off('pointerupoutside', this.onUp, this);
    });

    this.setVisible(false);
  }

  makeButton(x, y, letter, caption, onDown, onUp, iconKey) {
    const s = this.scene;
    const img = s.add.image(x, y, TEX.BTN_ROUND).setAlpha(0.9).setInteractive();
    const parts = [img];
    if (iconKey) parts.push(s.add.image(x, y, iconKey).setDisplaySize(40, 36));
    else parts.push(makeText(s, x, y, letter, { size: 30, style: 'bold', originX: 0.5, originY: 0.5, color: '#fff1c4', strokeThickness: 3 }));
    parts.push(makeText(s, x, y + 54, caption, { size: 11, color: '#cfc6dc', originX: 0.5, style: 'bold' }));
    img.on('pointerdown', () => {
      img.setScale(0.92);
      onDown();
    });
    const release = () => {
      img.setScale(1);
      onUp();
    };
    img.on('pointerup', release);
    img.on('pointerout', release);
    this.objects.push(...parts);
    return img;
  }

  startStick(key, pointer) {
    if (!this.visible || !this.enabled || this.pointers[key] !== null) return;
    this.pointers[key] = pointer.id;
    this.updateStick(key, pointer);
  }

  onMove(pointer) {
    for (const key of ['move', 'aim']) {
      if (this.pointers[key] === pointer.id) this.updateStick(key, pointer);
    }
  }

  onUp(pointer) {
    for (const key of ['move', 'aim']) {
      if (this.pointers[key] === pointer.id) this.releaseStick(key);
    }
  }

  updateStick(key, pointer) {
    const s = this.sticks[key];
    let dx = pointer.x - s.x;
    let dy = pointer.y - s.y;
    const len = Math.hypot(dx, dy);
    if (len > R) {
      dx = (dx / len) * R;
      dy = (dy / len) * R;
    }
    s.thumb.setPosition(s.x + dx, s.y + dy);
    const nx = dx / R;
    const ny = dy / R;
    const mag = Math.hypot(nx, ny);
    if (key === 'move') {
      this.moveX = mag > DEAD ? nx : 0;
      this.moveY = mag > DEAD ? ny : 0;
    } else {
      this.aimActive = mag > 0.25;
      if (this.aimActive) this.aimAngle = Math.atan2(ny, nx);
    }
  }

  releaseStick(key) {
    const s = this.sticks[key];
    this.pointers[key] = null;
    s.thumb.setPosition(s.x, s.y);
    if (key === 'move') {
      this.moveX = 0;
      this.moveY = 0;
    } else this.aimActive = false;
  }

  consumeInteract() {
    const v = this._interactEdge;
    this._interactEdge = false;
    return v;
  }

  consumeFlash() {
    const v = this._flashEdge;
    this._flashEdge = false;
    return v;
  }

  /** Muestra u oculta todos los controles. */
  setVisible(v) {
    this.visible = v;
    this.objects.forEach((o) => o.setVisible(v));
    this.objects.forEach((o) => o.setDepth(20));
    if (!v) {
      this.releaseStick('move');
      this.releaseStick('aim');
      this.interactHeld = false;
    }
  }

  /** Desactiva temporalmente la entrada (mientras hay un diálogo abierto). */
  setEnabled(e) {
    this.enabled = e;
    if (!e) {
      this.releaseStick('move');
      this.releaseStick('aim');
      this.interactHeld = false;
    }
    this.objects.forEach((o) => {
      if (o.input) o.input.enabled = e;
    });
  }
}
