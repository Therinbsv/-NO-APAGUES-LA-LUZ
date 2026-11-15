// =====================================================================
//  levelLayout.js — Plano de la habitación (datos puros, sin Phaser).
//  Al ser datos planos se puede verificar desde Node (tools/check_layout.mjs)
//  que todo objeto sea alcanzable por el jugador.
//  Coordenadas en píxeles del mundo (1280 x 960). x,y = esquina superior izq.
// =====================================================================

// Paredes invisibles (el dibujo de las paredes está en la textura del fondo).
export const WALLS = [
  { id: 'wall_top', x: 0, y: 0, w: 1280, h: 128 },
  { id: 'wall_left', x: 0, y: 0, w: 64, h: 960 },
  { id: 'wall_right', x: 1216, y: 0, w: 64, h: 960 },
  { id: 'wall_bottom', x: 0, y: 896, w: 1280, h: 64 }
];

// Muebles sólidos. "texture" es la clave generada en TextureFactory.
export const FURNITURE = [
  { id: 'bed', texture: 'furn_bed', x: 96, y: 136, w: 160, h: 200 },
  { id: 'nightstand', texture: 'furn_nightstand', x: 264, y: 136, w: 56, h: 56 },
  { id: 'desk', texture: 'furn_desk', x: 568, y: 136, w: 232, h: 80 },
  { id: 'wardrobe', texture: 'furn_wardrobe', x: 856, y: 136, w: 168, h: 88 },
  { id: 'bookshelf', texture: 'furn_bookshelf', x: 1136, y: 300, w: 80, h: 220 },
  { id: 'dresser', texture: 'furn_dresser', x: 64, y: 500, w: 72, h: 130 },
  { id: 'sofa', texture: 'furn_sofa', x: 360, y: 600, w: 150, h: 90 },
  { id: 'table', texture: 'furn_table', x: 112, y: 704, w: 128, h: 72 },
  { id: 'crates', texture: 'furn_crates', x: 480, y: 740, w: 96, h: 88 },
  { id: 'chest', texture: 'furn_chest', x: 936, y: 744, w: 120, h: 72 },
  { id: 'generator', texture: 'furn_generator', x: 1096, y: 784, w: 120, h: 112 }
];

export const PLAYER_START = { x: 340, y: 262 };

// Puntos donde puede aparecer la criatura (se elige el más lejano al jugador).
export const MONSTER_SPAWNS = [
  { x: 1150, y: 640 },
  { x: 640, y: 860 },
  { x: 190, y: 640 }
];

// Zonas "trigger": no bloquean, solo disparan un evento al solaparse.
export const TRIGGER_ZONES = [
  { id: 'window', x: 440, y: 190, w: 150, h: 110 },
  { id: 'door', x: 1104, y: 190, w: 140, h: 100 },
  { id: 'generator', x: 1130, y: 745, w: 170, h: 90 }
];

// Decoración fija pintada en el fondo (se usa para dibujar el fondo y la lluvia).
export const DECOR = {
  window: { x: 380, y: 16, w: 120, h: 84 },
  door: { x: 1056, y: 8, w: 96, h: 120 },
  calendar: { x: 498, y: 40, w: 44, h: 58 },
  clock: { x: 690, y: 64, r: 26 },
  rug: { x: 560, y: 420, w: 240, h: 180 }
};
