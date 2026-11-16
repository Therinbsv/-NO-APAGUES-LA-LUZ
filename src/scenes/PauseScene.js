// =====================================================================
//  PauseScene.js — Menú de pausa superpuesto (GameScene y UIScene quedan
//  congeladas debajo). Reanudar / Reiniciar / Volver al menú.
// =====================================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, GAME_STATES } from '../config/constants.js';
import Button, { ButtonList } from '../ui/Button.js';
import { makeText, drawPanel, dimmer, FONT_TITLE } from '../ui/UIHelpers.js';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PAUSE);
  }

  create() {
    this.audio = this.registry.get('audio');
    this.state = this.registry.get('state');
    dimmer(this, 0.72);
    drawPanel(this.add.graphics(), GAME_WIDTH / 2 - 190, 90, 380, 360, { alpha: 0.96, radius: 16 });
    makeText(this, GAME_WIDTH / 2, 138, 'PAUSA', { size: 40, font: FONT_TITLE, style: 'bold', color: '#ffe9a0', originX: 0.5, originY: 0.5, strokeThickness: 5 });
    makeText(this, GAME_WIDTH / 2, 178, 'La sombra también espera…', { size: 14, style: 'italic', color: '#b9aecb', originX: 0.5, originY: 0.5 });

    const resume = new Button(this, GAME_WIDTH / 2, 240, 'REANUDAR', () => this.resume(), { width: 280 });
    const restart = new Button(this, GAME_WIDTH / 2, 300, 'REINICIAR PARTIDA', () => this.restart(), { width: 280 });
    const mute = new Button(this, GAME_WIDTH / 2, 360, '', () => {
      this.audio.toggleMute();
      mute.setLabel(this.audio.isMuted() ? 'SONIDO: NO' : 'SONIDO: SÍ');
    }, { width: 280 });
    mute.setLabel(this.audio.isMuted() ? 'SONIDO: NO' : 'SONIDO: SÍ');
    const menu = new Button(this, GAME_WIDTH / 2, 420, 'VOLVER AL MENÚ', () => this.toMenu(), { width: 280 });
    this.list = new ButtonList(this, [resume, restart, mute, menu]);

    this.input.keyboard.on('keydown-ESC', () => this.resume());
    this.input.keyboard.on('keydown-P', () => this.resume());
  }

  resume() {
    this.state.set(GAME_STATES.PLAYING);
    this.audio.resumeAll();
    this.scene.resume(SCENES.GAME);
    this.scene.resume(SCENES.UI);
    this.scene.stop();
  }

  stopGame() {
    this.scene.stop(SCENES.UI);
    this.scene.stop(SCENES.GAME);
    this.scene.stop();
    this.audio.resumeAll();
    this.audio.stopAllLoops();
  }

  restart() {
    this.state.set(GAME_STATES.PLAYING);
    this.registry.get('storage').clearProgress();
    this.stopGame();
    this.scene.start(SCENES.GAME, { mode: 'new' });
  }

  toMenu() {
    this.state.set(GAME_STATES.MENU);
    this.stopGame();
    this.scene.start(SCENES.MENU);
  }
}
