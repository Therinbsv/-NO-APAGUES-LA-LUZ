// =====================================================================
//  EndingScene.js — Pantalla de victoria / final (normal o secreto).
//  Texto con efecto máquina de escribir, resumen de puntuación y récord.
// =====================================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, GAME_STATES, ENDINGS } from '../config/constants.js';
import { MUSIC } from '../audio/audioKeys.js';
import Button, { ButtonList } from '../ui/Button.js';
import { makeText, FONT_TITLE } from '../ui/UIHelpers.js';

export default class EndingScene extends Phaser.Scene {
  constructor() {
    super(SCENES.ENDING);
  }

  create(data) {
    const storage = this.registry.get('storage');
    const audio = this.registry.get('audio');
    const state = this.registry.get('state');
    const secret = data.ending === ENDINGS.SECRET;
    const texts = this.cache.json.get('story').endings[data.ending];
    const prev = storage.getHighScore();
    const record = data.score > prev;
    storage.submitScore(data.score);

    audio.stopAllLoops();
    audio.playMusic(MUSIC.ENDING, 1.2);
    this.cameras.main.setBackgroundColor(secret ? 0x1a1426 : 0x0b0a14);
    this.cameras.main.fadeIn(900, 0, 0, 0);

    // Resplandor cálido de fondo
    const glow = this.add.graphics();
    for (let i = 8; i > 0; i--) glow.fillStyle(secret ? 0xffe9a0 : 0xffc86a, 0.035).fillCircle(GAME_WIDTH / 2, 150, i * 55);

    makeText(this, GAME_WIDTH / 2, 48, texts.title, { size: 17, color: '#ffd45e', originX: 0.5, originY: 0.5, style: 'bold' });
    makeText(this, GAME_WIDTH / 2, 96, texts.subtitle, { size: 44, font: FONT_TITLE, style: 'bold', color: '#fff1c4', originX: 0.5, originY: 0.5, strokeThickness: 6 });

    const body = makeText(this, GAME_WIDTH / 2, 150, '', { size: 17, color: '#e6dcf2', originX: 0.5, originY: 0, wrap: 680, align: 'center', lineSpacing: 6, style: 'italic' });
    const full = texts.lines.join('\n') + (data.ending === ENDINGS.NORMAL && texts.hint ? `\n\n${texts.hint}` : '');
    let i = 0;
    this.time.addEvent({ delay: 24, repeat: full.length - 1, callback: () => body.setText(full.slice(0, ++i)) });
    this.input.once('pointerdown', () => { i = full.length; body.setText(full); });

    const unlocked = storage.getEndings().length;
    makeText(this, GAME_WIDTH / 2, 372, `Puntuación: ${data.score}   ·   Récord: ${Math.max(prev, data.score)}${record ? '  ¡NUEVO RÉCORD!' : ''}`, {
      size: 20, style: 'bold', color: record ? '#ffd45e' : '#fff1c4', originX: 0.5, originY: 0.5, strokeThickness: 3
    });
    makeText(this, GAME_WIDTH / 2, 400, `Fotos: ${data.photos}/4   ·   Notas: ${data.notes}/4   ·   Finales descubiertos: ${unlocked}/3`, { size: 14, color: '#b9aecb', originX: 0.5, originY: 0.5 });

    const again = new Button(this, GAME_WIDTH / 2 - 160, 468, 'JUGAR DE NUEVO', () => {
      state.set(GAME_STATES.PLAYING);
      this.scene.start(SCENES.GAME, { mode: 'new' });
    }, { width: 290 });
    const menu = new Button(this, GAME_WIDTH / 2 + 160, 468, 'MENÚ PRINCIPAL', () => {
      state.set(GAME_STATES.MENU);
      this.scene.start(SCENES.MENU);
    }, { width: 290 });
    this.list = new ButtonList(this, [again, menu]);
  }
}
