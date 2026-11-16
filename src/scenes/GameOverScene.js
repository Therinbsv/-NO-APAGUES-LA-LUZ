// =====================================================================
//  GameOverScene.js — Derrota (final malo). Muestra puntuación, récord y
//  permite reintentar desde el último capítulo guardado o volver al menú.
// =====================================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, GAME_STATES, ENDINGS, TOTAL_LEVELS } from '../config/constants.js';
import { TEX } from '../assets/TextureFactory.js';
import Button, { ButtonList } from '../ui/Button.js';
import { makeText, FONT_TITLE } from '../ui/UIHelpers.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME_OVER);
  }

  create(data) {
    const storage = this.registry.get('storage');
    this.registry.get('audio').stopAllLoops();
    const state = this.registry.get('state');
    state.set(GAME_STATES.DEFEAT);
    const texts = this.cache.json.get('story').endings.bad;
    const score = data?.score ?? 0;
    const prev = storage.getHighScore();
    const record = score > prev;
    storage.submitScore(score);
    storage.unlockEnding(ENDINGS.BAD);
    storage.submitLevel(data?.level ?? 1);

    this.cameras.main.setBackgroundColor(0x050204);
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEX.VIGNETTE).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    makeText(this, GAME_WIDTH / 2, 62, texts.title, { size: 18, color: '#c24a4a', originX: 0.5, originY: 0.5, style: 'bold' });
    const t = makeText(this, GAME_WIDTH / 2, 108, texts.subtitle, { size: 54, font: FONT_TITLE, style: 'bold', color: '#e8dcc8', originX: 0.5, originY: 0.5, strokeThickness: 6 });
    t.setShadow(0, 0, '#a01010', 20, true, true);

    const cause = data?.cause === 'battery' ? texts.batteryOut : texts.lines[0];
    makeText(this, GAME_WIDTH / 2, 180, [cause, ...texts.lines.slice(1)].join('\n'), {
      size: 17, style: 'italic', color: '#cfc6dc', originX: 0.5, originY: 0, wrap: 640, align: 'center', lineSpacing: 6
    });

    makeText(this, GAME_WIDTH / 2, 320, `Puntuación: ${score}      Récord: ${Math.max(prev, score)}${record ? '  ¡NUEVO RÉCORD!' : ''}`, {
      size: 20, style: 'bold', color: record ? '#ffd45e' : '#fff1c4', originX: 0.5, originY: 0.5, strokeThickness: 3
    });
    makeText(this, GAME_WIDTH / 2, 350, `Capítulo alcanzado: ${data?.level ?? 1}/${TOTAL_LEVELS}`, { size: 15, color: '#b9aecb', originX: 0.5, originY: 0.5 });

    const hasSave = storage.hasProgress();
    const retry = new Button(this, GAME_WIDTH / 2, 410, hasSave ? 'REINTENTAR (último capítulo)' : 'REINTENTAR', () => this.go(hasSave ? 'continue' : 'new'), { width: 360 });
    const menu = new Button(this, GAME_WIDTH / 2, 470, 'VOLVER AL MENÚ', () => {
      state.set(GAME_STATES.MENU);
      this.scene.start(SCENES.MENU);
    }, { width: 360 });
    this.list = new ButtonList(this, [retry, menu]);
  }

  go(mode) {
    this.registry.get('state').set(GAME_STATES.PLAYING);
    this.scene.start(SCENES.GAME, { mode });
  }
}
