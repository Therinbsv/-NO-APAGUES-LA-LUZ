// =====================================================================
//  ScoreManager.js — Sistema de puntaje.
//  Guarda el total y un registro de motivos (para el resumen final).
// =====================================================================
import Phaser from 'phaser';

export default class ScoreManager extends Phaser.Events.EventEmitter {
  constructor() {
    super();
    this.score = 0;
    this.log = [];
  }

  /** Suma puntos y avisa a la interfaz (evento 'change'). */
  add(points, reason = '') {
    this.score += points;
    this.log.push({ points, reason });
    this.emit('change', this.score, points, reason);
  }

  reset() {
    this.score = 0;
    this.log = [];
    this.emit('change', 0, 0, '');
  }

  snapshot() {
    return { score: this.score, log: this.log };
  }

  restore(data) {
    this.score = data?.score ?? 0;
    this.log = data?.log ?? [];
    this.emit('change', this.score, 0, '');
  }
}
