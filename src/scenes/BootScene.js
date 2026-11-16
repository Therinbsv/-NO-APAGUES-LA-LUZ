// =====================================================================
//  BootScene.js — Primera escena. Crea los servicios globales
//  (almacenamiento, audio y máquina de estados) y pasa a la precarga.
// =====================================================================
import Phaser from 'phaser';
import { SCENES } from '../config/constants.js';
import StorageManager from '../managers/StorageManager.js';
import AudioManager from '../managers/AudioManager.js';
import GameStateManager from '../managers/GameStateManager.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  create() {
    const storage = new StorageManager();
    const audio = new AudioManager(this.game, storage);
    const state = new GameStateManager(this.game.events);

    // El registro es global: cualquier escena puede leer estos servicios.
    this.registry.set('storage', storage);
    this.registry.set('audio', audio);
    this.registry.set('state', state);

    this.scene.start(SCENES.PRELOAD);
  }
}
