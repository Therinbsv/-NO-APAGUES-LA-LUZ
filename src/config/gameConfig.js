// =====================================================================
//  gameConfig.js — Configuración de Phaser: tamaño, escalado responsivo,
//  Arcade Physics y lista de escenas.
// =====================================================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import BootScene from '../scenes/BootScene.js';
import PreloadScene from '../scenes/PreloadScene.js';
import MenuScene from '../scenes/MenuScene.js';
import InstructionsScene from '../scenes/InstructionsScene.js';
import SettingsScene from '../scenes/SettingsScene.js';
import GameScene from '../scenes/GameScene.js';
import UIScene from '../scenes/UIScene.js';
import PauseScene from '../scenes/PauseScene.js';
import GameOverScene from '../scenes/GameOverScene.js';
import EndingScene from '../scenes/EndingScene.js';

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
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false }
  },
  scene: [BootScene, PreloadScene, MenuScene, InstructionsScene, SettingsScene, GameScene, UIScene, PauseScene, GameOverScene, EndingScene]
};
