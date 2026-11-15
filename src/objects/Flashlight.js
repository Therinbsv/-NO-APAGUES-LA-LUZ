// =====================================================================
//  Es la mecánica central del juego: la criatura se detiene cuando está
//  dentro del cono de luz. Para saberlo se comprueba:
//    1) distancia ≤ alcance,
//    2) ángulo dentro de la semiapertura del cono,
//    3) que ningún mueble tape el haz (línea de visión sobre la cuadrícula).
//  No hace falta iluminación dinámica compleja para lograr el efecto.
// =====================================================================
import Phaser from 'phaser';
import { FLASHLIGHT } from '../config/constants.js';
import { SFX } from '../audio/audioKeys.js';

export default class Flashlight extends Phaser.Events.EventEmitter {
  constructor(audio, collision) {
    super();
    this.audio = audio;
    this.collision = collision;
    this.owned = false; // se activa al recoger la linterna
    this.on = false;
    this.battery = FLASHLIGHT.START_BATTERY;
    this.angle = 0; // rad, dirección del haz
    this.flickerOff = false; // parpadeo con batería baja
    this.flickerTimer = 0;
  }

  /** ¿La luz está realmente emitiendo? (encendida y sin parpadeo apagado). */
  get emitting() {
    return this.owned && this.on && !this.flickerOff;
  }

  get ratio() {
    return this.battery / FLASHLIGHT.MAX_BATTERY;
  }

  get isLow() {
    return this.battery > 0 && this.battery <= FLASHLIGHT.LOW_LEVEL;
  }

  pickUp() {
    this.owned = true;
  }

  /** Enciende o apaga. Devuelve true si cambió el estado. */
  toggle() {
    if (!this.owned) return false;
    if (this.on) {
      this.on = false;
      this.audio.playSfx(SFX.FLASH_CLICK, { volume: 0.6 });
      this.emit('toggle', false);
      return true;
    }
    if (this.battery <= 0) {
      this.audio.playSfx(SFX.ERROR, { volume: 0.4 });
      this.emit('empty-attempt');
      return false;
    }
    this.on = true;
    this.audio.playSfx(SFX.FLASH_CLICK, { volume: 0.6, rate: 1.1 });
    this.emit('toggle', true);
    return true;
  }

  addBattery(amount) {
    this.battery = Math.min(FLASHLIGHT.MAX_BATTERY, this.battery + amount);
  }

  /** Gira suavemente el haz hacia un ángulo objetivo. */
  turnToward(targetAngle) {
    this.angle = Phaser.Math.Angle.RotateTo(this.angle, targetAngle, FLASHLIGHT.TURN_SPEED);
  }

  setAngleImmediate(a) {
    this.angle = a;
  }

  /** Consumo de batería y parpadeo. dt en segundos. */
  update(dt) {
    if (!this.owned) return;
    if (this.on) {
      this.battery -= FLASHLIGHT.DRAIN_PER_SEC * dt;
      if (this.battery <= 0) {
        this.battery = 0;
        this.on = false;
        this.flickerOff = false;
        this.audio.playSfx(SFX.FLASH_CLICK, { volume: 0.5, rate: 0.7 });
        this.emit('empty');
      }
    }
    // Parpadeo cuando la batería está baja
    if (this.on && this.isLow) {
      this.flickerTimer -= dt;
      if (this.flickerTimer <= 0) {
        this.flickerOff = !this.flickerOff && Math.random() < 0.5;
        this.flickerTimer = this.flickerOff ? 0.06 + Math.random() * 0.08 : 0.2 + Math.random() * 0.9;
      }
    } else {
      this.flickerOff = false;
    }
  }

  /**
   * ¿El punto (px,py) está iluminado por el haz?
   * @param {{x:number,y:number}} origin punto de origen de la luz (jugador)
   * @param {number} px,py posición del objetivo
   * @param {number} radius radio del objetivo (da tolerancia angular)
   */
  isPointLit(origin, px, py, radius = 18) {
    if (!this.emitting) return false;
    const dx = px - origin.x;
    const dy = py - origin.y;
    const dist = Math.hypot(dx, dy);
    if (dist > FLASHLIGHT.RANGE + radius) return false;
    if (dist < 26) return true; // pegado al jugador: siempre dentro del haz
    const ang = Math.atan2(dy, dx);
    const diff = Math.abs(Phaser.Math.Angle.Wrap(ang - this.angle));
    const slack = Math.asin(Math.min(1, radius / dist));
    if (diff > FLASHLIGHT.HALF_ANGLE + slack) return false;
    // Línea de visión: los muebles bloquean la luz. Se mira hasta cerca del objetivo.
    const k = Math.max(0, dist - 14) / dist;
    return !this.collision.isLightBlocked(origin.x, origin.y, origin.x + dx * k, origin.y + dy * k);
  }

  snapshot() {
    return { owned: this.owned, battery: this.battery };
  }

  restore(s) {
    this.owned = !!s?.owned;
    this.battery = s?.battery ?? FLASHLIGHT.START_BATTERY;
    this.on = false;
  }
}
