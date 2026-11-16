// =====================================================================
//  KeypadUI.js — Candado de tres diales (acertijo de la caja de música).
//  Responsable: Integrante 3.
//
//  Teclado: ← → cambia de dial · ↑ ↓ ajusta · 0-9 escribe · Enter prueba · Esc cierra.
//  Ratón/táctil: flechas (mantener pulsado repite) y botones.
//  La comprobación la hace StoryManager (callback onSubmit).
// =====================================================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants.js';
import { makeText, drawPanel } from './UIHelpers.js';
import Button from './Button.js';
import { SFX } from '../audio/audioKeys.js';

const P = { w: 560, h: 330 };
P.x = (GAME_WIDTH - P.w) / 2;
P.y = (GAME_HEIGHT - P.h) / 2;
const LABELS = ['DÍA', 'MES', 'AÑO'];

export default class KeypadUI extends Phaser.GameObjects.Container {
  constructor(scene, audio) {
    super(scene, 0, 0);
    this.audio = audio;
    this.isOpen = false;
    this.values = [0, 0, 0];
    this.active = 0;
    this.locked = false;
    this.onSubmit = null;
    this.onSolved = null;

    const blocker = scene.add.zone(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0, 0).setInteractive();
    const dim = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72).setOrigin(0, 0);
    this.panelG = scene.add.graphics();
    drawPanel(this.panelG, P.x, P.y, P.w, P.h, { alpha: 0.97, radius: 14 });
    const title = makeText(scene, GAME_WIDTH / 2, P.y + 20, 'CAJA DE MÚSICA CON CANDADO', { size: 20, style: 'bold', color: COLORS.GOLD, originX: 0.5, strokeThickness: 2 });
    const sub = makeText(scene, GAME_WIDTH / 2, P.y + 50, 'Introduce la fecha del día que lo cambió todo', { size: 14, color: COLORS.TEXT_DIM, originX: 0.5 });
    this.msg = makeText(scene, GAME_WIDTH / 2, P.y + 256, '', { size: 15, originX: 0.5, align: 'center', wrap: P.w - 40 });
    this.dialG = scene.add.graphics();

    this.add([blocker, dim, this.panelG, title, sub, this.dialG, this.msg]);

    // Tres diales
    this.valueTexts = [];
    this.dialX = [0, 1, 2].map((i) => GAME_WIDTH / 2 + (i - 1) * 150);
    for (let i = 0; i < 3; i++) {
      const x = this.dialX[i];
      const up = this.makeArrow(x, P.y + 100, -1, i);
      const down = this.makeArrow(x, P.y + 208, 1, i);
      const txt = makeText(scene, x, P.y + 154, '00', { size: 46, style: 'bold', font: 'Georgia, serif', originX: 0.5, originY: 0.5, strokeThickness: 3 });
      const label = makeText(scene, x, P.y + 232, LABELS[i], { size: 12, color: COLORS.TEXT_DIM, originX: 0.5, style: 'bold' });
      const hit = scene.add.zone(x - 55, P.y + 124, 110, 60).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => this.setActive(i));
      this.valueTexts.push(txt);
      this.add([up, down, txt, label, hit]);
    }
    this.tryBtn = new Button(scene, GAME_WIDTH / 2 - 100, P.y + P.h - 36, 'Probar', () => this.submit(), { width: 170, height: 40, size: 18 });
    this.closeBtn = new Button(scene, GAME_WIDTH / 2 + 100, P.y + P.h - 36, 'Cerrar', () => this.close(), { width: 170, height: 40, size: 18 });
    this.add([this.tryBtn, this.closeBtn]);

    this.setDepth(110).setVisible(false);
    scene.add.existing(this);

    this._key = (e) => {
      if (!this.isOpen || this.locked) return;
      if (e.code === 'Escape') this.close();
      else if (e.code === 'Enter' || e.code === 'NumpadEnter') this.submit();
      else if (e.code === 'ArrowLeft') this.setActive(this.active - 1);
      else if (e.code === 'ArrowRight') this.setActive(this.active + 1);
      else if (e.code === 'ArrowUp') this.change(this.active, 1);
      else if (e.code === 'ArrowDown') this.change(this.active, -1);
      else if (/^(Digit|Numpad)\d$/.test(e.code)) {
        const d = Number(e.code.slice(-1));
        this.values[this.active] = ((this.values[this.active] % 10) * 10 + d) % 100;
        this.refresh();
      }
    };
    scene.input.keyboard.on('keydown', this._key);
    scene.events.once('shutdown', () => scene.input.keyboard?.off('keydown', this._key));
  }

  /** Flecha arriba/abajo con repetición al mantener pulsado. */
  makeArrow(x, y, dir, dialIndex) {
    const s = this.scene;
    const g = s.add.graphics();
    const draw = (hover) => {
      g.clear();
      g.fillStyle(hover ? 0xffe9a0 : 0xd9b45a, 1);
      g.fillTriangle(x - 18, y + (dir < 0 ? 10 : -10), x + 18, y + (dir < 0 ? 10 : -10), x, y + (dir < 0 ? -12 : 12));
    };
    draw(false);
    const zone = s.add.zone(x - 30, y - 24, 60, 48).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    let timer = null;
    const stop = () => {
      if (timer) timer.remove(false);
      timer = null;
    };
    zone.on('pointerover', () => draw(true));
    zone.on('pointerout', () => {
      draw(false);
      stop();
    });
    zone.on('pointerdown', () => {
      this.setActive(dialIndex);
      this.change(dialIndex, -dir); // flecha arriba (dir<0) suma
      stop();
      timer = s.time.addEvent({
        delay: 350,
        callback: () => {
          stop();
          timer = s.time.addEvent({ delay: 80, loop: true, callback: () => this.change(dialIndex, -dir) });
        }
      });
    });
    zone.on('pointerup', stop);
    const c = s.add.container(0, 0, [g, zone]);
    return c;
  }

  open({ onSubmit, onSolved, onClose } = {}) {
    this.onSubmit = onSubmit;
    this.onSolved = onSolved;
    this.onCloseCb = onClose;
    this.values = [0, 0, 0];
    this.active = 0;
    this.locked = false;
    this.isOpen = true;
    this.msg.setText('Mantén pulsadas las flechas o escribe los números con el teclado.').setColor(COLORS.TEXT_DIM);
    this.setVisible(true);
    this.refresh();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.setVisible(false);
    const cb = this.onCloseCb;
    this.onCloseCb = null;
    cb?.();
  }

  setActive(i) {
    this.active = ((i % 3) + 3) % 3;
    this.refresh();
  }

  change(i, delta) {
    if (this.locked) return;
    this.values[i] = (((this.values[i] + delta) % 100) + 100) % 100;
    this.refresh();
    this.audio.playSfx(SFX.CLICK, { volume: 0.35, rate: 1.4 });
  }

  refresh() {
    const g = this.dialG;
    g.clear();
    for (let i = 0; i < 3; i++) {
      const x = this.dialX[i];
      const a = i === this.active;
      g.fillStyle(0x0b0810, 1);
      g.fillRoundedRect(x - 55, P.y + 122, 110, 64, 10);
      g.lineStyle(a ? 3 : 1.5, a ? 0xffe9a0 : 0x6a5a80, 1);
      g.strokeRoundedRect(x - 55, P.y + 122, 110, 64, 10);
      this.valueTexts[i].setText(String(this.values[i]).padStart(2, '0')).setColor(a ? '#fff1c4' : '#d8cfe6');
      if (i < 2) {
        g.fillStyle(0xd9b45a, 1);
        g.fillRect(x + 66, P.y + 152, 18, 4); // guion entre diales
      }
    }
  }

  submit() {
    if (this.locked) return;
    const res = this.onSubmit ? this.onSubmit([...this.values]) : { correct: false };
    if (res.correct) {
      this.locked = true;
      this.audio.playSfx(SFX.SUCCESS);
      this.msg.setText('¡Clic! El candado se abre.').setColor(COLORS.OK);
      this.scene.time.delayedCall(900, () => {
        this.isOpen = false;
        this.setVisible(false);
        this.onSolved?.(res);
        this.onCloseCb?.();
        this.onCloseCb = null;
      });
    } else {
      this.audio.playSfx(SFX.ERROR);
      this.msg.setText(res.hint ? `La combinación es incorrecta.\n${res.hint}` : 'La combinación es incorrecta.').setColor(COLORS.DANGER);
      this.scene.tweens.add({ targets: this.valueTexts, x: '+=6', duration: 50, yoyo: true, repeat: 3 });
    }
  }
}
