// =====================================================================
//  PreloadScene.js — Loader de assets con barra de progreso.
//  Carga audio (.wav), la historia (JSON) y el logo (SVG). Después genera
//  las texturas procedurales y las animaciones.
// =====================================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants.js';
import { AUDIO_FILES } from '../audio/audioKeys.js';
import { generateAllTextures, createAnimations } from '../assets/TextureFactory.js';
import { makeText, FONT_TITLE } from '../ui/UIHelpers.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload() {
    this.cameras.main.setBackgroundColor(COLORS.BG);
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    makeText(this, cx, cy - 70, 'NO APAGUES LA LUZ', { size: 34, font: FONT_TITLE, style: 'bold', color: '#f4ecd8', originX: 0.5, originY: 0.5, strokeThickness: 4 });
    const barBg = this.add.graphics();
    barBg.fillStyle(0x1a1424, 1).fillRoundedRect(cx - 210, cy - 10, 420, 22, 8);
    barBg.lineStyle(2, 0xd9b45a, 0.8).strokeRoundedRect(cx - 210, cy - 10, 420, 22, 8);
    const bar = this.add.graphics();
    const status = makeText(this, cx, cy + 40, 'Cargando… 0%', { size: 15, color: COLORS.TEXT_DIM, originX: 0.5 });
    makeText(this, cx, GAME_HEIGHT - 30, 'Consejo: la criatura se detiene cuando la iluminas.', { size: 13, color: '#8d82a3', originX: 0.5 });

    this.load.on('progress', (v) => {
      bar.clear();
      bar.fillStyle(0xf0cf7a, 1).fillRoundedRect(cx - 207, cy - 7, 414 * v, 16, 6);
      status.setText(`Cargando… ${Math.round(v * 100)}%`);
    });
    this.load.on('loaderror', (file) => {
      console.warn('[Loader] no se pudo cargar', file.key);
    });

    // Todas las rutas son relativas a public/assets/
    this.load.setPath('assets/');
    for (const [key, file] of Object.entries(AUDIO_FILES)) this.load.audio(key, file);
    this.load.json('story', 'data/story.json');
    this.load.svg('logo', 'images/ui/logo.svg', { width: 128, height: 128 });
  }

  create() {
    // Arte procedural + animaciones (ver TextureFactory.js)
    generateAllTextures(this);
    createAnimations(this);
    this.scene.start(SCENES.MENU);
  }
}
