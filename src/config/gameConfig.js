// =====================================================================
//  gameConfig.js — Configuración de Phaser: tamaño, escalado responsivo,
//  Arcade Physics y lista de escenas.
// =====================================================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import MenuScene from '../scenes/MenuScene.js';

export default {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#050308',
  pixelArt: false,
  roundPixels: true,
  fps: { target: 60, smoothStep: true },
  scale: {
    mode: Phaser.Scale.FIT, // se adapta a cualquier ventana manteniendo 16:9
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: { activePointers: 3 },
  scene: [MenuScene]
};
