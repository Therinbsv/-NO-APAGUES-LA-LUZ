// =====================================================================
//  Button.js — Botón de texto, botón con icono y navegación con teclado.
//  Responsable: Integrante 4 (interfaz).
//  Accesible: contraste alto, estado de foco visible y manejo con
//  teclado (↑ ↓ Enter) además del ratón/táctil.
// =====================================================================
import Phaser from 'phaser';
import { makeText, uiClick } from './UIHelpers.js';

export default class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, label, onClick, { width = 300, height = 46, size = 20 } = {}) {
    super(scene, x, y);
    this.onClick = onClick;
    this.w = width;
    this.h = height;
    this.focused = false;
    this.enabled = true;
    this._pressed = false;

    this.bg = scene.add.graphics();
    this.label = makeText(scene, 0, 0, label, { size, originX: 0.5, originY: 0.5, color: '#f4ecd8', strokeThickness: 2 });
    this.add([this.bg, this.label]);
    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', () => this.emit('hover', this));
    this.on('pointerdown', () => {
      if (!this.enabled) return;
      this._pressed = true;
    });
    this.on('pointerout', () => {
      this._pressed = false;
    });
    this.on('pointerup', () => {
      if (this.enabled && this._pressed) {
        this._pressed = false;
        this.activate();
      }
    });
    this.draw();
    scene.add.existing(this);
  }

  /** Ejecuta la acción del botón (clic o tecla Enter). */
  activate() {
    if (!this.enabled) return;
    uiClick(this.scene);
    this.onClick?.();
  }

  setLabel(text) {
    this.label.setText(text);
    return this;
  }

  setFocused(f) {
    if (this.focused !== f) {
      this.focused = f;
      this.draw();
    }
    return this;
  }

  setEnabled(e) {
    this.enabled = e;
    this.setAlpha(e ? 1 : 0.4);
    return this;
  }

  draw() {
    const g = this.bg;
    g.clear();
    const f = this.focused;
    g.fillStyle(f ? 0x2d2140 : 0x14101c, 0.92);
    g.fillRoundedRect(-this.w / 2, -this.h / 2, this.w, this.h, 10);
    g.lineStyle(f ? 3 : 2, f ? 0xffe9a0 : 0xd9b45a, f ? 1 : 0.75);
    g.strokeRoundedRect(-this.w / 2, -this.h / 2, this.w, this.h, 10);
    this.label.setColor(f ? '#fff6d0' : '#f4ecd8');
  }
}

/** Botón redondo con un icono (HUD: pausa, mute, mochila). */
export class IconButton extends Phaser.GameObjects.Container {
  constructor(scene, x, y, iconKey, onClick, radius = 19) {
    super(scene, x, y);
    this.radius = radius;
    this.onClick = onClick;
    this.bg = scene.add.graphics();
    this.icon = scene.add.image(0, 0, iconKey).setDisplaySize(radius * 1.15, radius * 1.15);
    this.add([this.bg, this.icon]);
    this.setSize(radius * 2, radius * 2);
    this.setInteractive({ useHandCursor: true });
    this._draw(false);
    this.on('pointerover', () => this._draw(true));
    this.on('pointerout', () => this._draw(false));
    this.on('pointerup', () => {
      uiClick(scene);
      this.onClick?.();
    });
    scene.add.existing(this);
  }

  setIcon(key) {
    this.icon.setTexture(key);
    this.icon.setDisplaySize(this.radius * 1.15, this.radius * 1.15);
  }

  _draw(hover) {
    this.bg.clear();
    this.bg.fillStyle(hover ? 0x2d2140 : 0x14101c, 0.85);
    this.bg.fillCircle(0, 0, this.radius);
    this.bg.lineStyle(2, hover ? 0xffe9a0 : 0xd9b45a, 0.9);
    this.bg.strokeCircle(0, 0, this.radius);
  }
}

/**
 * Navegación con teclado para una lista vertical de botones:
 * ↑/↓ (o W/S) mueven el foco, Enter/Espacio activan.
 */
export class ButtonList {
  constructor(scene, buttons) {
    this.scene = scene;
    this.buttons = buttons.filter(Boolean);
    this.index = 0;
    this.buttons.forEach((b, i) => b.on('hover', () => this.focus(i)));
    this.focus(0);

    const kb = scene.input.keyboard;
    this.handlers = {
      keydown: (e) => {
        const k = e.code;
        if (k === 'ArrowDown' || k === 'KeyS') this.focus(this.index + 1);
        else if (k === 'ArrowUp' || k === 'KeyW') this.focus(this.index - 1);
        else if (k === 'Enter' || k === 'Space' || k === 'NumpadEnter') this.buttons[this.index]?.activate();
      }
    };
    kb.on('keydown', this.handlers.keydown);
    scene.events.once('shutdown', () => this.destroy());
  }

  focus(i) {
    if (!this.buttons.length) return;
    const n = this.buttons.length;
    this.index = ((i % n) + n) % n;
    this.buttons.forEach((b, k) => b.setFocused(k === this.index));
  }

  destroy() {
    this.scene.input.keyboard?.off('keydown', this.handlers.keydown);
  }
}
