// =====================================================================
//  Player.js — Protagonista (Mateo).
//  Responsable: Integrante 1 (movimiento, personaje y físicas).
//
//  Sprite con cuerpo Arcade Physics. El cuerpo es una cajita en los pies
//  para que el personaje pueda "pasar por detrás" de los muebles (vista
//  top-down con y-sorting).
// =====================================================================
import Phaser from 'phaser';
import { PLAYER, DEPTH } from '../config/constants.js';
import { TEX } from '../assets/TextureFactory.js';
import { SFX } from '../audio/audioKeys.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, audio) {
    super(scene, x, y, TEX.PLAYER, 'down_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.audio = audio;

    this.setOrigin(0.5, 0.9);
    this.body.setSize(20, 14).setOffset(10, 36);
    this.setCollideWorldBounds(true);

    this.facing = 'down';
    this.lastMoveAngle = Math.PI / 2; // mirando hacia abajo
    this.stepTimer = 0;
    this.play('player-idle-down');
  }

  /** Posición de los pies (centro del cuerpo físico). */
  get feet() {
    return this.body.center;
  }

  /** Punto desde el que sale la luz de la linterna. */
  get lightOrigin() {
    return { x: this.body.center.x, y: this.body.center.y - 8 };
  }

  /**
   * Mueve al jugador.
   * @param {{x:number,y:number}} dir vector de dirección (ya normalizado)
   * @param {number} dt segundos desde el último frame
   */
  moveWith(dir, dt) {
    const moving = dir.x !== 0 || dir.y !== 0;
    this.setVelocity(dir.x * PLAYER.SPEED, dir.y * PLAYER.SPEED);

    if (moving) {
      this.lastMoveAngle = Math.atan2(dir.y, dir.x);
      this.facing = Math.abs(dir.x) > Math.abs(dir.y) ? (dir.x < 0 ? 'left' : 'right') : dir.y < 0 ? 'up' : 'down';
      this.play(`player-walk-${this.facing}`, true);
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.36;
        this.audio.playSfx(SFX.FOOTSTEP, { volume: 0.35, rate: 0.9 + Math.random() * 0.25 });
      }
    } else {
      this.play(`player-idle-${this.facing}`, true);
      this.stepTimer = 0;
    }
    this.setDepth(this.y); // y-sorting: quien está más abajo se dibuja delante
  }

  /** Detiene al jugador (diálogos, pausa…). */
  halt() {
    this.setVelocity(0, 0);
    this.play(`player-idle-${this.facing}`, true);
  }

  /** Coloca al jugador y reinicia su estado de movimiento. */
  teleport(x, y) {
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.setDepth(y);
  }
}
