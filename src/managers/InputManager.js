// =====================================================================
//  InputManager.js — Unifica teclado + ratón + controles táctiles.
//  Responsable: Integrante 1/4.
//
//  El resto del juego solo pregunta "¿hacia dónde se mueve?", "¿pulsó
//  interactuar?", "¿hacia dónde apunta la linterna?". Así los controles
//  táctiles son equivalentes a los del teclado sin duplicar lógica.
// =====================================================================
import Phaser from 'phaser';
import { EVENTS } from '../config/constants.js';

const JustDown = Phaser.Input.Keyboard.JustDown;

export default class InputManager {
  /**
   * @param {Phaser.Scene} scene escena que recibe el teclado (GameScene)
   * @param {() => object|null} getTouch devuelve los TouchControls (de UIScene) si existen
   */
  constructor(scene, getTouch) {
    this.scene = scene;
    this.getTouch = getTouch;
    this.keys = scene.input.keyboard.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D',
      upA: 'UP', downA: 'DOWN', leftA: 'LEFT', rightA: 'RIGHT',
      interact: 'E', flash: 'F', pause: 'P', esc: 'ESC', mute: 'M', inv: 'I',
      lock: 'SPACE', lock2: 'SHIFT', fps: 'F3', nav: 'F4'
    });

    this.move = new Phaser.Math.Vector2();
    this.interactHeld = false;
    this.interactJust = false;
    this.flashJust = false;
    this.pauseJust = false;
    this.muteJust = false;
    this.invJust = false;
    this.fpsJust = false;
    this.navJust = false;
    this.lockAim = false;

    this.lastMouseMove = -99999;
    this.clickQueued = false;

    this._onMove = (p) => {
      if (!p.wasTouch) this.lastMouseMove = scene.time.now;
    };
    this._onClick = () => {
      this.clickQueued = true;
    };
    scene.input.on('pointermove', this._onMove);
    scene.game.events.on(EVENTS.PLAYFIELD_CLICK, this._onClick);
  }

  destroy() {
    this.scene.input.off('pointermove', this._onMove);
    this.scene.game.events.off(EVENTS.PLAYFIELD_CLICK, this._onClick);
  }

  /** Debe llamarse una vez por frame, ANTES de la lógica del juego. */
  update() {
    const k = this.keys;
    const t = this.getTouch ? this.getTouch() : null;
    const touchOn = t && t.visible;

    let x = (k.left.isDown || k.leftA.isDown ? -1 : 0) + (k.right.isDown || k.rightA.isDown ? 1 : 0);
    let y = (k.up.isDown || k.upA.isDown ? -1 : 0) + (k.down.isDown || k.downA.isDown ? 1 : 0);
    if (touchOn) {
      x += t.moveX;
      y += t.moveY;
    }
    this.move.set(x, y);
    if (this.move.lengthSq() > 1) this.move.normalize();

    this.interactHeld = k.interact.isDown || (touchOn && t.interactHeld);
    this.interactJust = JustDown(k.interact) || (touchOn && t.consumeInteract());
    this.flashJust = JustDown(k.flash) || (touchOn && t.consumeFlash()) || this.clickQueued;
    this.clickQueued = false;
    this.pauseJust = JustDown(k.pause) || JustDown(k.esc);
    this.muteJust = JustDown(k.mute);
    this.invJust = JustDown(k.inv);
    this.fpsJust = JustDown(k.fps);
    this.navJust = JustDown(k.nav);
    this.lockAim = k.lock.isDown || k.lock2.isDown;
  }

  /**
   * Ángulo hacia el que apunta la linterna.
   *  1) Stick táctil derecho, 2) ratón (si se movió hace poco),
   *  3) dirección del último movimiento. Con ESPACIO/SHIFT se fija el haz.
   */
  getAimAngle(origin, currentAim, camera, facingAngle) {
    const t = this.getTouch ? this.getTouch() : null;
    if (t && t.visible && t.aimActive) return t.aimAngle;
    if (this.lockAim) return currentAim;
    if (this.scene.time.now - this.lastMouseMove < 3500) {
      const p = this.scene.input.activePointer;
      const w = camera.getWorldPoint(p.x, p.y);
      return Math.atan2(w.y - origin.y, w.x - origin.x);
    }
    return facingAngle;
  }
}
