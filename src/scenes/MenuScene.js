// =====================================================================
//  MenuScene.js — Prototipo estático de la pantalla de inicio.
// =====================================================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, WORLD } from '../config/constants.js';
import { TEX, generateMenuBackground } from '../assets/TextureFactory.js';
import { makeText, FONT_TITLE } from '../ui/UIHelpers.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    this.load.svg('logo', 'assets/images/ui/logo.svg', { width: 128, height: 128 });
  }

  create() {
    generateMenuBackground(this);
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEX.ROOM_BG)
      .setDisplaySize(GAME_WIDTH, GAME_WIDTH * WORLD.height / WORLD.width);

    // ---- Título
    this.add.image(GAME_WIDTH / 2, 40, 'logo').setDisplaySize(58, 58).setDepth(10);
    this.title1 = makeText(this, GAME_WIDTH / 2, 100, 'NO APAGUES', {
      size: 50, font: FONT_TITLE, style: 'bold', color: '#f4ecd8', originX: 0.5, originY: 0.5, strokeThickness: 6
    }).setDepth(10);
    this.title2 = makeText(this, GAME_WIDTH / 2, 162, 'LA LUZ', {
      size: 76, font: FONT_TITLE, style: 'bold', color: '#ffe9a0', originX: 0.5, originY: 0.5, strokeThickness: 8
    }).setDepth(10);
    this.title2.setShadow(0, 0, '#ffcf6a', 22, true, true);

    // Elementos visuales estaticos; aun no inician otras pantallas.
    ['JUGAR', 'INSTRUCCIONES', 'CONFIGURACIÓN'].forEach((label, index) => {
      const y = 280 + index * 54;
      const button = this.add.graphics().setDepth(10);
      button.fillStyle(0x14101c, 0.92).fillRoundedRect(GAME_WIDTH / 2 - 150, y - 23, 300, 46, 10);
      button.lineStyle(2, 0xd9b45a, 0.75).strokeRoundedRect(GAME_WIDTH / 2 - 150, y - 23, 300, 46, 10);
      makeText(this, GAME_WIDTH / 2, y, label, { size: 20, originX: 0.5, originY: 0.5, strokeThickness: 2 }).setDepth(10);
    });
  }
}
