// =====================================================================
//  DialogueBox.js — Cuadro de diálogo con efecto máquina de escribir.
//  Responsable: Integrante 3/4.
//
//  Se avanza con E, Espacio, Enter o clic/toque. Esc salta todo el diálogo.
//  Mientras está abierto el tiempo del juego se detiene (lo comprueba GameScene).
// =====================================================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { makeText, drawPanel, speakerColor } from './UIHelpers.js';
import { SFX } from '../audio/audioKeys.js';

const BOX = { w: 880, h: 148, x: (GAME_WIDTH - 880) / 2, y: GAME_HEIGHT - 148 - 14 };
const CHAR_DELAY = 16; // ms por carácter

export default class DialogueBox extends Phaser.GameObjects.Container {
  constructor(scene, audio) {
    super(scene, 0, 0);
    this.audio = audio;
    this.isOpen = false;
    this.lines = [];
    this.index = 0;
    this.typing = false;
    this.onClose = null;

    // Bloqueador de clics (cubre toda la pantalla, transparente)
    this.blocker = scene.add.zone(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0, 0).setInteractive();
    this.panel = drawPanel(scene.add.graphics(), BOX.x, BOX.y, BOX.w, BOX.h, { fill: 0x0d0914, alpha: 0.94, radius: 12 });
    this.nameText = makeText(scene, BOX.x + 22, BOX.y + 12, '', { size: 18, style: 'bold', strokeThickness: 2 });
    this.bodyText = makeText(scene, BOX.x + 22, BOX.y + 42, '', { size: 19, wrap: BOX.w - 44, lineSpacing: 5 });
    this.hint = makeText(scene, BOX.x + BOX.w - 18, BOX.y + BOX.h - 12, '▼  E / clic', {
      size: 13,
      color: '#b9aecb',
      originX: 1,
      originY: 1
    });
    this.add([this.blocker, this.panel, this.nameText, this.bodyText, this.hint]);
    this.setDepth(100).setVisible(false);
    scene.add.existing(this);

    this.blocker.on('pointerup', () => this.advance());
    scene.tweens.add({ targets: this.hint, alpha: 0.35, duration: 600, yoyo: true, repeat: -1 });

    this._key = (e) => {
      if (!this.isOpen) return;
      if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') this.advance();
      else if (e.code === 'Escape') this.close();
    };
    scene.input.keyboard.on('keydown', this._key);
    scene.events.once('shutdown', () => scene.input.keyboard?.off('keydown', this._key));
  }

  /**
   * Abre el diálogo.
   * @param {{speaker:string,text:string}[]} lines
   * @param {Function} [onClose] se llama al terminar
   */
  open(lines, onClose) {
    if (!lines || !lines.length) {
      onClose?.();
      return;
    }
    this.lines = lines;
    this.index = 0;
    this.onClose = onClose;
    this.isOpen = true;
    this.openedAt = this.scene.time.now;
    this.setVisible(true);
    this.showLine();
  }

  showLine() {
    const line = this.lines[this.index];
    this.nameText.setText(line.speaker || '').setColor(speakerColor(line.speaker));
    this.bodyText.setText('');
    this.hint.setText(this.index < this.lines.length - 1 ? '▼  E / clic' : '■  E / clic');
    this.typing = true;
    this.chars = 0;
    this.full = line.text;
    if (this.timer) this.timer.remove(false);
    this.timer = this.scene.time.addEvent({
      delay: CHAR_DELAY,
      loop: true,
      callback: () => {
        this.chars += 1;
        this.bodyText.setText(this.full.slice(0, this.chars));
        if (this.chars % 4 === 0) this.audio.playSfx(SFX.BLIP, { volume: 0.12 });
        if (this.chars >= this.full.length) this.finishTyping();
      }
    });
  }

  finishTyping() {
    if (this.timer) this.timer.remove(false);
    this.timer = null;
    this.typing = false;
    this.bodyText.setText(this.full);
  }

  /** Muestra la línea completa o pasa a la siguiente. */
  advance() {
    if (!this.isOpen) return;
    if (this.scene.time.now - this.openedAt < 120) return; // evita que la misma pulsación lo cierre
    if (this.typing) {
      this.finishTyping();
      return;
    }
    if (this.index < this.lines.length - 1) {
      this.index += 1;
      this.showLine();
    } else this.close();
  }

  close() {
    if (!this.isOpen) return;
    if (this.timer) this.timer.remove(false);
    this.timer = null;
    this.isOpen = false;
    this.setVisible(false);
    const cb = this.onClose;
    this.onClose = null;
    cb?.();
  }
}
