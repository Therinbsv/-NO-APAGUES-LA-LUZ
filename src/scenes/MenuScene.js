// =====================================================================
//  MenuScene.js — Menú principal.
//  Fondo: la habitación a oscuras con una linterna que barre la pared y
//  deja ver, a ratos, a la criatura. Navegable con ratón, táctil y teclado.
// =====================================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, GAME_STATES, COLORS, DEPTH, TOTAL_LEVELS } from '../config/constants.js';
import { TEX } from '../assets/TextureFactory.js';
import { MUSIC } from '../audio/audioKeys.js';
import DarknessLayer from '../objects/DarknessLayer.js';
import Button, { IconButton, ButtonList } from '../ui/Button.js';
import { makeText, FONT_TITLE } from '../ui/UIHelpers.js';
import { EVENTS } from '../config/constants.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }

  create() {
    this.storage = this.registry.get('storage');
    this.audio = this.registry.get('audio');
    this.registry.get('state').set(GAME_STATES.MENU);
    this.audio.playMusic(MUSIC.MENU, 0.9);
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // ---- Fondo: habitación + oscuridad con linterna que barre
    this.add.image(0, 0, TEX.ROOM_BG).setOrigin(0, 0);
    this.monster = this.add.sprite(790, 430, TEX.MONSTER, 'm0').setOrigin(0.5, 0.92).setDepth(3).play('monster-idle');
    this.eyes = this.add.image(790, 362, TEX.GLOW_EYE).setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
    this.darkness = new DarknessLayer(this, { depth: 5 });
    this.sweep = 0;

    // ---- Título
    this.add.image(GAME_WIDTH / 2, 40, 'logo').setDisplaySize(58, 58).setDepth(10);
    this.title1 = makeText(this, GAME_WIDTH / 2, 100, 'NO APAGUES', {
      size: 50, font: FONT_TITLE, style: 'bold', color: '#f4ecd8', originX: 0.5, originY: 0.5, strokeThickness: 6
    }).setDepth(10);
    this.title2 = makeText(this, GAME_WIDTH / 2, 162, 'LA LUZ', {
      size: 76, font: FONT_TITLE, style: 'bold', color: '#ffe9a0', originX: 0.5, originY: 0.5, strokeThickness: 8
    }).setDepth(10);
    this.title2.setShadow(0, 0, '#ffcf6a', 22, true, true);
    this.add
      .text(GAME_WIDTH / 2, 208, 'Terror psicológico · Exploración · Supervivencia', {
        fontFamily: 'Georgia, serif', fontSize: '15px', color: '#b9aecb', resolution: 2
      })
      .setOrigin(0.5)
      .setDepth(10);

    // El título parpadea como una bombilla defectuosa
    this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        if (Math.random() < 0.12) {
          this.title2.setAlpha(0.35);
          this.time.delayedCall(60 + Math.random() * 90, () => this.title2.setAlpha(1));
        }
      }
    });

    // ---- Botones
    const hasSave = this.storage.hasProgress();
    const save = hasSave ? this.storage.loadProgress() : null;
    const buttons = [];
    let y = hasSave ? 262 : 280;
    const step = 54;
    if (hasSave) {
      const lv = Math.min(TOTAL_LEVELS, save?.story?.level ?? 1);
      buttons.push(new Button(this, GAME_WIDTH / 2, y, `CONTINUAR (Cap. ${lv})`, () => this.startGame('continue')));
      y += step;
    }
    buttons.push(new Button(this, GAME_WIDTH / 2, y, hasSave ? 'NUEVA PARTIDA' : 'JUGAR', () => this.startGame('new')));
    y += step;
    buttons.push(new Button(this, GAME_WIDTH / 2, y, 'INSTRUCCIONES', () => this.go(SCENES.INSTRUCTIONS)));
    y += step;
    buttons.push(new Button(this, GAME_WIDTH / 2, y, 'CONFIGURACIÓN', () => this.go(SCENES.SETTINGS)));
    buttons.forEach((b) => b.setDepth(10));
    this.list = new ButtonList(this, buttons);

    // ---- Pie: récord, nivel, finales
    const endings = this.storage.getEndings().length;
    makeText(
      this, 16, GAME_HEIGHT - 14,
      `Récord: ${this.storage.getHighScore()}   ·   Capítulo máximo: ${Math.max(1, this.storage.getLevelReached())}/${TOTAL_LEVELS}   ·   Finales: ${endings}/3`,
      { size: 13, color: '#cfc6dc', originY: 1, strokeThickness: 3 }
    ).setDepth(10);
    makeText(this, GAME_WIDTH - 70, GAME_HEIGHT - 14, 'Aplicaciones Web · EPN · Phaser 3', { size: 11, color: '#8d82a3', originX: 1, originY: 1 }).setDepth(10);

    // ---- Botón mute
    this.muteBtn = new IconButton(this, GAME_WIDTH - 36, GAME_HEIGHT - 36, this.audio.isMuted() ? TEX.ICON_SOUND_OFF : TEX.ICON_SOUND_ON, () => this.audio.toggleMute());
    this.muteBtn.setDepth(10);
    this._onMute = (m) => this.muteBtn.setIcon(m ? TEX.ICON_SOUND_OFF : TEX.ICON_SOUND_ON);
    this.game.events.on(EVENTS.MUTE_CHANGED, this._onMute);
    this.events.once('shutdown', () => this.game.events.off(EVENTS.MUTE_CHANGED, this._onMute));
    this.input.keyboard.on('keydown-M', () => this.audio.toggleMute());
  }

  update(time, delta) {
    // Linterna de fondo que barre la habitación
    this.sweep += delta * 0.00045;
    const angle = -0.75 + Math.sin(this.sweep * 2.2) * 0.95;
    const ox = 130;
    const oy = 470;
    this.darkness.render(
      0.9,
      [{ x: ox, y: oy, radius: 90, strength: 0.7 }],
      { x: ox, y: oy, angle, range: 760, intensity: 0.9 }
    );
    this.eyes.setAlpha(0.55 + 0.45 * Math.sin(time * 0.003)).setVisible(Math.sin(time * 0.0009) > -0.6);
  }

  go(scene) {
    this.scene.start(scene);
  }

  startGame(mode) {
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENES.GAME, { mode }));
  }
}
