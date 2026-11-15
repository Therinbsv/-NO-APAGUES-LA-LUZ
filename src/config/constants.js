// =====================================================================
//  constants.js — Valores compartidos por todo el proyecto.
//  Centralizar los números "mágicos" permite balancear el juego desde
//  un único archivo y que los cuatro integrantes usen los mismos nombres.
// =====================================================================

// Resolución lógica del juego (se escala con Phaser.Scale.FIT).
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// Mundo: una sola habitación detallada.
export const WORLD = {
  width: 1280,
  height: 960,
  // Zona caminable (el resto son paredes).
  floor: { x: 64, y: 128, w: 1152, h: 768 },
  cellSize: 32 // tamaño de celda de la cuadrícula de pathfinding
};

// Claves de escenas.
export const SCENES = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MENU: 'MenuScene',
  INSTRUCTIONS: 'InstructionsScene',
  SETTINGS: 'SettingsScene',
  GAME: 'GameScene',
  UI: 'UIScene',
  PAUSE: 'PauseScene',
  GAME_OVER: 'GameOverScene',
  ENDING: 'EndingScene'
};

// Estados globales del juego (máquina de estados, ver GameStateManager).
export const GAME_STATES = {
  BOOT: 'BOOT',
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  DIALOGUE: 'DIALOGUE',
  PAUSED: 'PAUSED',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT'
};

// Orden de dibujado (depth). Los objetos con "y-sorting" usan su propia y.
export const DEPTH = {
  FLOOR: 0,
  DECOR: 1,
  ITEM_FLOOR: 3,
  ITEM_TOP: 4000,
  DARKNESS: 5000,
  GLINT: 5100,
  EYES: 5150,
  PROMPT: 5200,
  FX: 5300
};

export const COLORS = {
  BG: 0x05030a,
  PANEL: 0x120d1a,
  PANEL_STROKE: 0xd9b45a,
  GOLD: '#f0cf7a',
  TEXT: '#f4ecd8',
  TEXT_DIM: '#b9aecb',
  DANGER: '#ff5a5a',
  OK: '#7be0a0',
  SOFIA: '#ffd86b',
  MATEO: '#8fc3ff'
};

export const PLAYER = {
  SPEED: 150,
  FRAME_W: 40,
  FRAME_H: 56
};

export const FLASHLIGHT = {
  RANGE: 330, // alcance del haz (px)
  HALF_ANGLE: 0.58, // semiapertura del cono (rad, ≈33°)
  MAX_BATTERY: 100,
  START_BATTERY: 70,
  DRAIN_PER_SEC: 1.6, // consumo mientras está encendida
  BATTERY_PICKUP: 35, // carga que da cada pila
  TURN_SPEED: 0.32, // suavizado al rotar el haz
  LOW_LEVEL: 25 // por debajo de esto el haz parpadea
};

export const MONSTER = {
  BASE_SPEED: 72,
  SPEED_PER_LEVEL: 6,
  CATCH_DISTANCE: 30, // distancia de contacto (px)
  REPATH_MS: 300, // cada cuánto recalcula el camino
  RETREAT_AFTER: 3.2, // segundos de luz continua antes de que retroceda
  RETREAT_TIME: 2.2,
  RETREAT_SPEED: 62,
  SPAWN_GRACE: 1.6, // segundos quieta tras aparecer
  DIFFICULTY: { easy: 0.8, normal: 1, hard: 1.2 }
};

// Sistema de puntaje.
export const SCORE = {
  photo: 10,
  note: 10,
  puzzle: 20,
  recording: 20,
  battery: 5,
  generator: 15,
  escape: 30,
  secret: 50
};

// Claves de localStorage. Las tres primeras son las que exige la rúbrica.
export const STORAGE_KEYS = {
  highScore: 'highScore',
  levelReached: 'nivelAlcanzado',
  audioMuted: 'audioMuted',
  settings: 'nal_settings',
  progress: 'nal_progress',
  endings: 'nal_endings'
};

export const ENDINGS = { BAD: 'bad', NORMAL: 'normal', SECRET: 'secret' };

// Eventos globales (se emiten en game.events).
export const EVENTS = {
  MUTE_CHANGED: 'nal:muteChanged',
  SETTINGS_CHANGED: 'nal:settingsChanged',
  STATE_CHANGED: 'nal:stateChanged',
  PLAYFIELD_CLICK: 'nal:playfieldClick' // clic de ratón sobre el campo de juego (alterna la linterna)
};

export const TOTAL_LEVELS = 5;
