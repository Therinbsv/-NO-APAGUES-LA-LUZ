// =====================================================================
//  InteractionPrompt.js — Cartel flotante "E · Examinar fotografía".
//  Vive en el mundo (por encima de la oscuridad) y sigue al objeto cercano.
//  Incluye una barra de progreso para acciones que se mantienen pulsadas.
// =====================================================================
import Phaser from 'phaser';
import { DEPTH } from '../config/constants.js';
import { makeText, drawPanel } from './UIHelpers.js';

export default class InteractionPrompt extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    this.bg = scene.add.graphics();
    this.keyText = makeText(scene, 0, 0, 'E', { size: 15, style: 'bold', color: '#1a1020', originX: 0.5, originY: 0.5 });
    this.keyBg = scene.add.graphics();
    this.text = makeText(scene, 0, 0, '', { size: 15, originX: 0, originY: 0.5, strokeThickness: 2 });
    this.bar = scene.add.graphics();
    this.add([this.bg, this.keyBg, this.keyText, this.text, this.bar]);
    this.setDepth(DEPTH.PROMPT).setVisible(false);
    this.progress = 0;
    scene.add.existing(this);
  }

  /**
   * @param {number} x,y posición del mundo (centro, sobre el objeto)
   * @param {string} label texto de la acción
   * @param {string} keyLabel letra o texto de la tecla ("E", "ACTUAR")
   * @param {number} progress 0-1 para acciones de mantener pulsado (0 = sin barra)
   */
  show(x, y, label, keyLabel = 'E', progress = 0) {
    this.text.setText(label);
    this.keyText.setText(keyLabel);
    const keyW = Math.max(24, this.keyText.width + 12);
    const w = keyW + this.text.width + 30;
    const h = 30;
    this.bg.clear();
    drawPanel(this.bg, -w / 2, -h / 2, w, h, { radius: 8, alpha: 0.92, lineWidth: 1.5 });
    this.keyBg.clear();
    this.keyBg.fillStyle(0xf0cf7a, 1);
    this.keyBg.fillRoundedRect(-w / 2 + 6, -11, keyW, 22, 5);
    this.keyText.setPosition(-w / 2 + 6 + keyW / 2, 0);
    this.text.setPosition(-w / 2 + keyW + 14, 0);

    this.bar.clear();
    if (progress > 0) {
      this.bar.fillStyle(0x000000, 0.7);
      this.bar.fillRect(-w / 2, h / 2 + 4, w, 7);
      this.bar.fillStyle(0xf0cf7a, 1);
      this.bar.fillRect(-w / 2, h / 2 + 4, w * Phaser.Math.Clamp(progress, 0, 1), 7);
    }
    this.setPosition(Math.round(x), Math.round(y));
    this.setVisible(true);
  }

  hide() {
    this.setVisible(false);
  }
}
