// =====================================================================
//  HUD.js — Interfaz de juego (batería, puntos, objetivo, inventario…).
//  Responsable: Integrante 4.
//
//  Recibe un objeto "estado" cada frame (setState) y solo redibuja lo que
//  cambió, para no gastar rendimiento. Colores con contraste alto sobre
//  paneles oscuros (accesibilidad).
// =====================================================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, TOTAL_LEVELS } from '../config/constants.js';
import { TEX } from '../assets/TextureFactory.js';
import { makeText, drawPanel, FONT_TITLE } from './UIHelpers.js';

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this.prev = {};
    this.toastTween = null;
    this.build();
  }

  build() {
    const s = this.scene;

    // ---- Viñeta roja de peligro (cuando la criatura está cerca)
    this.vignette = s.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEX.VIGNETTE).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setAlpha(0).setDepth(5);

    // ---- Panel de objetivo (arriba a la izquierda)
    this.objPanel = s.add.graphics().setDepth(10);
    this.chapterText = makeText(s, 26, 17, '', { size: 12, color: COLORS.GOLD, style: 'bold' }).setDepth(11);
    this.objText = makeText(s, 26, 36, '', { size: 14, wrap: 380, lineSpacing: 3 }).setDepth(11);

    // ---- Puntaje (arriba a la derecha)
    this.scoreLabel = makeText(s, GAME_WIDTH - 16, 12, 'PUNTOS', { size: 11, color: COLORS.TEXT_DIM, originX: 1, style: 'bold' }).setDepth(11);
    this.scoreText = makeText(s, GAME_WIDTH - 16, 24, '0', { size: 28, style: 'bold', color: COLORS.GOLD, originX: 1, strokeThickness: 4 }).setDepth(11);
    this.highText = makeText(s, GAME_WIDTH - 16, 62, 'RÉCORD 0', { size: 12, color: COLORS.TEXT_DIM, originX: 1 }).setDepth(11);

    // ---- Batería de la linterna (abajo a la izquierda)
    this.batG = s.add.graphics().setDepth(10);
    this.batIcon = s.add.image(34, 508, TEX.ICON_BATTERY).setDisplaySize(26, 21).setDepth(11);
    this.batLabel = makeText(s, 56, 487, 'LINTERNA [F]', { size: 11, color: COLORS.TEXT_DIM, style: 'bold' }).setDepth(11);
    this.batText = makeText(s, 222, 508, '', { size: 13, originY: 0.5, style: 'bold' }).setDepth(11);

    // ---- Contadores de inventario
    this.counters = {};
    const defs = [
      ['photos', TEX.ICON_PHOTO, 306, '0/4'],
      ['notes', TEX.ICON_NOTE, 380, '0/4']
    ];
    for (const [key, tex, x, label] of defs) {
      const icon = s.add.image(x, 508, tex).setDisplaySize(24, 24).setDepth(11);
      const txt = makeText(s, x + 16, 508, label, { size: 14, originY: 0.5, style: 'bold' }).setDepth(11);
      this.counters[key] = { icon, txt };
    }
    this.tapeIcon = s.add.image(466, 508, TEX.ITEM_TAPE).setDisplaySize(26, 17).setDepth(11).setAlpha(0.2);
    this.keyIcon = s.add.image(510, 508, TEX.ITEM_KEY).setDisplaySize(27, 13).setDepth(11).setAlpha(0.2);

    // ---- Ayuda permanente de controles (instrucciones siempre visibles)
    this.help = makeText(s, GAME_WIDTH / 2, GAME_HEIGHT - 4, 'WASD/Flechas mover · E actuar · F linterna · ratón apunta · ESPACIO fija el haz · I mochila · P pausa · M sonido', {
      size: 10.5,
      color: '#9d92b3',
      originX: 0.5,
      originY: 1
    }).setDepth(11);

    // ---- Aviso (toast)
    this.toastG = s.add.graphics().setDepth(60);
    this.toastText = makeText(s, GAME_WIDTH / 2, 118, '', { size: 16, originX: 0.5, originY: 0.5, align: 'center', wrap: 520, strokeThickness: 3 }).setDepth(61);
    this.toastG.setAlpha(0);
    this.toastText.setAlpha(0);

    // ---- Tarjeta de capítulo
    this.chapterBig = makeText(s, GAME_WIDTH / 2, 250, '', {
      size: 30,
      font: FONT_TITLE,
      style: 'bold',
      color: '#fff1c4',
      originX: 0.5,
      originY: 0.5,
      align: 'center',
      strokeThickness: 6
    }).setDepth(62).setAlpha(0);
    this.chapterSub = makeText(s, GAME_WIDTH / 2, 292, '', { size: 16, color: COLORS.GOLD, originX: 0.5, originY: 0.5, align: 'center', strokeThickness: 3 }).setDepth(62).setAlpha(0);
  }

  /** Muestra/oculta la ayuda de teclado (se oculta con controles táctiles). */
  setTouchMode(on) {
    this.help.setVisible(!on);
  }

  /** Actualiza solo lo que cambió respecto al frame anterior. */
  setState(st) {
    const p = this.prev;

    if (st.objective !== p.objective || st.level !== p.level) {
      this.chapterText.setText(`CAPÍTULO ${st.level}/${TOTAL_LEVELS} · ${st.chapterTitle.toUpperCase()}`);
      this.objText.setText(st.objective);
      const h = 40 + this.objText.height;
      this.objPanel.clear();
      drawPanel(this.objPanel, 12, 10, 408, h, { alpha: 0.82, radius: 10 });
    }

    if (st.score !== p.score) {
      this.scoreText.setText(String(st.score));
      if (p.score !== undefined) {
        this.scene.tweens.add({ targets: this.scoreText, scale: { from: 1.3, to: 1 }, duration: 250 });
      }
    }
    if (st.high !== p.high || st.score !== p.score) this.highText.setText(`RÉCORD ${Math.max(st.high, st.score)}`);

    this.drawBattery(st);

    if (st.photos !== p.photos) this.counters.photos.txt.setText(`${st.photos}/4`);
    if (st.notes !== p.notes) this.counters.notes.txt.setText(`${st.notes}/4`);
    if (st.tape !== p.tape) this.tapeIcon.setAlpha(st.tape ? 1 : 0.2);
    if (st.key !== p.key) this.keyIcon.setAlpha(st.key ? 1 : 0.2);

    // Peligro: viñeta roja que late
    const pulse = 0.65 + 0.35 * Math.sin(this.scene.time.now * 0.012);
    this.vignette.setAlpha(st.danger > 0 ? Math.min(0.85, st.danger * pulse) : 0);

    this.prev = { ...st };
  }

  drawBattery(st) {
    const g = this.batG;
    const changed = st.battery !== this.prev.battery || st.owned !== this.prev.owned || st.on !== this.prev.on;
    // Parpadeo cuando la batería es baja y la linterna está encendida
    const blink = st.owned && st.low && st.on ? (Math.floor(this.scene.time.now / 250) % 2 === 0 ? 1 : 0.35) : 1;
    if (!changed && blink === this.lastBlink) return;
    this.lastBlink = blink;

    g.clear();
    drawPanel(g, 52, 498, 160, 20, { radius: 5, alpha: 0.85, lineWidth: 1.5 });
    const ratio = st.owned ? st.battery / 100 : 0;
    const color = ratio > 0.5 ? 0x7be0a0 : ratio > 0.25 ? 0xf0cf7a : 0xff5a5a;
    g.fillStyle(color, blink);
    g.fillRoundedRect(55, 501, Math.max(0, 154 * ratio), 14, 3);
    if (st.on) {
      g.fillStyle(0xfff2b8, 1);
      g.fillCircle(206 + 0, 488, 0); // (reservado)
    }
    this.batIcon.setTint(color).setAlpha(st.owned ? 1 : 0.35);
    this.batText.setText(st.owned ? `${Math.ceil(st.battery)}%${st.on ? ' ON' : ''}` : 'Sin linterna');
    this.batText.setColor(st.owned ? (ratio > 0.25 ? COLORS.TEXT : COLORS.DANGER) : COLORS.TEXT_DIM);
  }

  /** Aviso breve en pantalla. */
  toast(text, { color = COLORS.TEXT, duration = 3200 } = {}) {
    this.toastText.setText(text).setColor(color);
    const w = this.toastText.width + 36;
    const h = this.toastText.height + 18;
    this.toastG.clear();
    drawPanel(this.toastG, GAME_WIDTH / 2 - w / 2, 118 - h / 2, w, h, { radius: 10, alpha: 0.9 });
    this.scene.tweens.killTweensOf([this.toastG, this.toastText]);
    this.toastG.setAlpha(1);
    this.toastText.setAlpha(1);
    this.scene.tweens.add({
      targets: [this.toastG, this.toastText],
      alpha: 0,
      delay: duration,
      duration: 500
    });
  }

  /** Tarjeta grande al cambiar de capítulo. */
  chapterCard(level, title) {
    this.chapterBig.setText(title.toUpperCase());
    this.chapterSub.setText(`Capítulo ${level} de ${TOTAL_LEVELS}`);
    this.scene.tweens.killTweensOf([this.chapterBig, this.chapterSub]);
    this.chapterBig.setAlpha(0);
    this.chapterSub.setAlpha(0);
    this.scene.tweens.add({
      targets: [this.chapterBig, this.chapterSub],
      alpha: { from: 0, to: 1 },
      duration: 500,
      yoyo: true,
      hold: 1700
    });
  }
}
