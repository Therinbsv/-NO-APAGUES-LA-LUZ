// =====================================================================
//  TextureFactory.js — Arte 100 % original generado por código.
//  En vez de depender de sprites externos, cada textura (habitación,
//  muebles, objetos, personaje, criatura, luces e iconos) se dibuja con
//  la API Canvas 2D y se registra en el Texture Manager de Phaser.
//  Así el proyecto es autosuficiente y se puede reemplazar cualquier
//  textura por un PNG (p. ej. de kenney.nl) sin tocar el resto del código:
//  basta con cargar un PNG con la misma clave en PreloadScene.
// =====================================================================
import { WORLD, PLAYER, FLASHLIGHT } from '../config/constants.js';
import { DECOR } from '../config/levelLayout.js';

export const TEX = {
  PIXEL: 'pixel',
  ROOM_BG: 'room_bg',
  RAIN: 'rain',
  PLAYER: 'player',
  MONSTER: 'monster',
  ITEM_FLASHLIGHT: 'item_flashlight',
  ITEM_BATTERY: 'item_battery',
  ITEM_PHOTO: 'item_photo',
  ITEM_NOTE: 'item_note',
  ITEM_CLIPPING: 'item_clipping',
  ITEM_DRAWING: 'item_drawing',
  ITEM_PHONE: 'item_phone',
  ITEM_BOX: 'item_box',
  ITEM_TAPE: 'item_tape',
  ITEM_KEY: 'item_key',
  GENERATOR_ON: 'furn_generator_on',
  GLOW_SOFT: 'glow_soft',
  GLOW_EYE: 'glow_eye',
  CONE: 'cone_light',
  AMBIENT: 'ambient_light',
  JOY_BASE: 'joy_base',
  JOY_THUMB: 'joy_thumb',
  BTN_ROUND: 'btn_round',
  ICON_PAUSE: 'icon_pause',
  ICON_SOUND_ON: 'icon_sound_on',
  ICON_SOUND_OFF: 'icon_sound_off',
  ICON_BAG: 'icon_bag',
  ICON_LIGHT: 'icon_light',
  ICON_BATTERY: 'icon_battery',
  ICON_PHOTO: 'icon_photo',
  ICON_NOTE: 'icon_note',
  VIGNETTE: 'vignette_red'
};

export const CONE_SIZE = { w: FLASHLIGHT.RANGE, h: 420 };

// ---------------------------------------------------------------- utilidades
/** Generador pseudoaleatorio determinista (para que el arte sea siempre igual). */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Crea una textura de lienzo, la dibuja con drawFn y la registra. */
function canvasTexture(scene, key, w, h, drawFn) {
  if (scene.textures.exists(key)) return scene.textures.get(key);
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  drawFn(ctx, w, h, tex);
  tex.refresh();
  return tex;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function fillRR(ctx, x, y, w, h, r, fill, stroke, lw = 1) {
  roundRectPath(ctx, x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function line(ctx, x1, y1, x2, y2, color, lw = 1, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function radial(ctx, cx, cy, r, stops) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ---------------------------------------------------------------- habitación
function drawRoom(ctx, W, H) {
  const rnd = mulberry32(11);
  const F = WORLD.floor;

  // ---- Suelo de madera (tablones verticales)
  ctx.fillStyle = '#241911';
  ctx.fillRect(0, 0, W, H);
  const plankColors = ['#4a3623', '#51391f', '#443020', '#4f3a27', '#47331f'];
  for (let x = F.x; x < F.x + F.w; x += 48) {
    ctx.fillStyle = plankColors[Math.floor(rnd() * plankColors.length)];
    ctx.fillRect(x, F.y, 47, F.h);
    // betas de la madera
    for (let k = 0; k < 16; k++) {
      const gx = x + 3 + rnd() * 41;
      const gy = F.y + rnd() * F.h;
      line(ctx, gx, gy, gx + (rnd() - 0.5) * 3, gy + 20 + rnd() * 80, '#2a1c10', 1, 0.28);
    }
    // juntas transversales
    let y = F.y + rnd() * 140;
    while (y < F.y + F.h) {
      line(ctx, x, y, x + 47, y, '#1c130c', 2, 0.8);
      y += 150 + rnd() * 170;
    }
    // separación entre tablones
    line(ctx, x + 47.5, F.y, x + 47.5, F.y + F.h, '#150e08', 2, 0.9);
  }
  // manchas de suciedad / humedad
  for (let i = 0; i < 26; i++) {
    const cx = F.x + rnd() * F.w;
    const cy = F.y + rnd() * F.h;
    ctx.fillStyle = radial(ctx, cx, cy, 40 + rnd() * 70, [
      [0, 'rgba(10,6,3,0.22)'],
      [1, 'rgba(10,6,3,0)']
    ]);
    ctx.fillRect(cx - 120, cy - 120, 240, 240);
  }
  // hollín cerca del generador (insinúa el incendio)
  ctx.fillStyle = radial(ctx, 1090, 800, 130, [
    [0, 'rgba(0,0,0,0.5)'],
    [1, 'rgba(0,0,0,0)']
  ]);
  ctx.fillRect(950, 660, 300, 300);

  // ---- Alfombra
  const R = DECOR.rug;
  fillRR(ctx, R.x - 2, R.y - 2, R.w + 4, R.h + 4, 6, 'rgba(0,0,0,0.35)');
  fillRR(ctx, R.x, R.y, R.w, R.h, 5, '#4b2232');
  fillRR(ctx, R.x + 10, R.y + 10, R.w - 20, R.h - 20, 3, null, '#a07a42', 3);
  fillRR(ctx, R.x + 22, R.y + 22, R.w - 44, R.h - 44, 2, '#3a1a28', '#7a5a34', 1.5);
  ctx.save();
  ctx.translate(R.x + R.w / 2, R.y + R.h / 2);
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = '#a07a42';
  ctx.lineWidth = 2;
  ctx.strokeRect(-34, -34, 68, 68);
  ctx.strokeRect(-18, -18, 36, 36);
  ctx.restore();
  for (let y = R.y + 4; y < R.y + R.h; y += 7) {
    line(ctx, R.x - 7, y, R.x, y, '#b9a27a', 1.5, 0.8);
    line(ctx, R.x + R.w, y, R.x + R.w + 7, y, '#b9a27a', 1.5, 0.8);
  }

  // ---- Pared superior (papel tapiz + zócalo de madera)
  ctx.fillStyle = '#3b2e42';
  ctx.fillRect(0, 0, W, F.y);
  for (let x = 0; x < W; x += 32) {
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    ctx.fillRect(x, 0, 16, F.y);
    for (let y = 14; y < 90; y += 28) {
      ctx.fillStyle = 'rgba(210,180,120,0.10)';
      ctx.beginPath();
      ctx.arc(x + 8, y + ((x / 32) % 2) * 14, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#2b1e16'; // zócalo
  ctx.fillRect(0, 88, W, F.y - 88);
  for (let x = 0; x < W; x += 64) {
    fillRR(ctx, x + 6, 96, 52, 26, 2, '#33241a', '#1a110b', 1.5);
  }
  ctx.fillStyle = '#4a3324'; // moldura superior del zócalo
  ctx.fillRect(0, 84, W, 6);
  ctx.fillStyle = '#1b120c'; // rodapié
  ctx.fillRect(0, F.y - 8, W, 8);
  ctx.fillStyle = '#4a3324'; // moldura de corona
  ctx.fillRect(0, 0, W, 8);

  // ---- Paredes laterales e inferior (borde oscuro)
  ctx.fillStyle = '#2d2434';
  ctx.fillRect(0, F.y, F.x, H - F.y);
  ctx.fillRect(F.x + F.w, F.y, W - F.x - F.w, H - F.y);
  ctx.fillRect(0, F.y + F.h, W, H - F.y - F.h);
  ctx.fillStyle = '#1b120c';
  ctx.fillRect(F.x - 8, F.y, 8, F.h);
  ctx.fillRect(F.x + F.w, F.y, 8, F.h);
  ctx.fillRect(F.x - 8, F.y + F.h, F.w + 16, 8);
  for (let y = F.y; y < H; y += 32) {
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    ctx.fillRect(0, y, F.x - 8, 16);
    ctx.fillRect(F.x + F.w + 8, y, W - F.x - F.w - 8, 16);
  }

  // ---- Sombra interior en los bordes del suelo
  const edge = (x0, y0, x1, y1, rx, ry, rw, rh) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(rx, ry, rw, rh);
  };
  edge(0, F.y, 0, F.y + 36, F.x, F.y, F.w, 36);
  edge(F.x, 0, F.x + 30, 0, F.x, F.y, 30, F.h);
  edge(F.x + F.w, 0, F.x + F.w - 30, 0, F.x + F.w - 30, F.y, 30, F.h);
  edge(0, F.y + F.h, 0, F.y + F.h - 30, F.x, F.y + F.h - 30, F.w, 30);

  // ---- Ventana (con cortinas)
  const Wd = DECOR.window;
  fillRR(ctx, Wd.x - 6, Wd.y - 6, Wd.w + 12, Wd.h + 12, 3, '#1b130e');
  const sky = ctx.createLinearGradient(0, Wd.y, 0, Wd.y + Wd.h);
  sky.addColorStop(0, '#22385c');
  sky.addColorStop(1, '#0b1424');
  ctx.fillStyle = sky;
  ctx.fillRect(Wd.x, Wd.y, Wd.w, Wd.h);
  ctx.fillStyle = '#1b130e';
  ctx.fillRect(Wd.x + Wd.w / 2 - 3, Wd.y, 6, Wd.h);
  ctx.fillRect(Wd.x, Wd.y + Wd.h / 2 - 3, Wd.w, 6);
  ctx.fillStyle = '#6a4d36'; // alféizar
  ctx.fillRect(Wd.x - 10, Wd.y + Wd.h + 4, Wd.w + 20, 8);
  for (const side of [-1, 1]) {
    const cx = side < 0 ? Wd.x - 18 : Wd.x + Wd.w + 4;
    ctx.fillStyle = '#5b2233';
    ctx.fillRect(cx, Wd.y - 12, 16, Wd.h + 28);
    for (let k = 3; k < 16; k += 5) line(ctx, cx + k, Wd.y - 12, cx + k, Wd.y + Wd.h + 16, '#3a1521', 2, 0.7);
  }

  // ---- Calendario (agosto 2021, el 12 marcado)
  const C = DECOR.calendar;
  fillRR(ctx, C.x, C.y, C.w, C.h, 2, '#e8e0cc', '#8a7f60');
  ctx.fillStyle = '#a32b2b';
  ctx.fillRect(C.x, C.y, C.w, 12);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 8px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AGO 2021', C.x + C.w / 2, C.y + 9);
  ctx.fillStyle = '#4a4636';
  ctx.font = '6px Arial, sans-serif';
  let n = 1;
  let circle = null;
  for (let r = 0; r < 5 && n <= 31; r++) {
    for (let c = 0; c < 7 && n <= 31; c++) {
      if (r === 0 && c < 6) continue; // el 1 de agosto de 2021 fue domingo
      const px = C.x + 6 + c * 5.3;
      const py = C.y + 22 + r * 7;
      ctx.fillText(String(n), px, py);
      if (n === 12) circle = { px, py };
      n++;
    }
  }
  if (circle) {
    ctx.strokeStyle = '#d02020';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(circle.px, circle.py - 2, 5, 4.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ---- Reloj de pared detenido a las 12:08
  const K = DECOR.clock;
  ctx.fillStyle = '#1b130e';
  ctx.beginPath();
  ctx.arc(K.x, K.y, K.r + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9d3bf';
  ctx.beginPath();
  ctx.arc(K.x, K.y, K.r, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    line(ctx, K.x + Math.sin(a) * (K.r - 6), K.y - Math.cos(a) * (K.r - 6), K.x + Math.sin(a) * (K.r - 2), K.y - Math.cos(a) * (K.r - 2), '#2a1d16', 2);
  }
  const hand = (deg, len, lw) => {
    const a = (deg * Math.PI) / 180;
    line(ctx, K.x, K.y, K.x + Math.sin(a) * len, K.y - Math.cos(a) * len, '#1a1410', lw);
  };
  hand(4, 13, 3); // hora: 12 y 8 min
  hand(48, 20, 2); // minutos: 8
  ctx.fillStyle = '#a32b2b';
  ctx.beginPath();
  ctx.arc(K.x, K.y, 2.5, 0, Math.PI * 2);
  ctx.fill();
  line(ctx, K.x - 8, K.y - 12, K.x + 3, K.y + 4, '#8a8470', 1, 0.9); // grieta del cristal
  line(ctx, K.x + 3, K.y + 4, K.x + 12, K.y + 3, '#8a8470', 1, 0.9);

  // ---- Puerta
  const D = DECOR.door;
  ctx.fillStyle = '#120c08';
  ctx.fillRect(D.x - 8, D.y - 4, D.w + 16, D.h + 4);
  ctx.fillStyle = '#4f3622';
  ctx.fillRect(D.x, D.y, D.w, D.h);
  fillRR(ctx, D.x + 8, D.y + 8, 36, 44, 2, '#5d412a', '#2e1e12', 2);
  fillRR(ctx, D.x + 52, D.y + 8, 36, 44, 2, '#5d412a', '#2e1e12', 2);
  fillRR(ctx, D.x + 8, D.y + 60, 36, 50, 2, '#5d412a', '#2e1e12', 2);
  fillRR(ctx, D.x + 52, D.y + 60, 36, 50, 2, '#5d412a', '#2e1e12', 2);
  ctx.fillStyle = '#c9a44a'; // manija
  ctx.beginPath();
  ctx.arc(D.x + D.w - 10, D.y + 62, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b02020'; // cerrojo eléctrico (LED rojo)
  ctx.beginPath();
  ctx.arc(D.x + D.w - 10, D.y + 48, 3, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------- muebles
const WOOD = { dark: '#3a2418', mid: '#5a3d2a', light: '#7a5538' };

function drawBed(ctx, w, h) {
  fillRR(ctx, 0, 0, w, h, 8, '#3a2418', '#1a0f08', 2);
  fillRR(ctx, 8, 10, w - 16, h - 18, 6, '#8d95aa');
  fillRR(ctx, 18, 14, w - 36, 40, 10, '#d9d5c9', '#a8a395', 1.5); // almohada
  line(ctx, 30, 30, w - 30, 30, '#bfbaa9', 1, 0.7);
  fillRR(ctx, 8, 72, w - 16, h - 80, 6, '#3f4f7a'); // manta
  for (let y = 96; y < h - 8; y += 20) line(ctx, 10, y, w - 10, y, '#4d5f90', 6, 0.7);
  fillRR(ctx, 8, 72, w - 16, 18, 5, '#5a6c9c');
  line(ctx, 30, 120, 80, 150, '#2f3d63', 1.5, 0.6);
  line(ctx, 90, 135, 130, 170, '#2f3d63', 1.5, 0.6);
}

function drawNightstand(ctx, w, h) {
  fillRR(ctx, 0, 0, w, h, 4, WOOD.mid, '#1a0f08', 2);
  fillRR(ctx, 4, 4, w - 8, h - 8, 3, '#6a4a33');
  line(ctx, 4, h / 2 + 6, w - 4, h / 2 + 6, '#2a1a10', 2);
  ctx.fillStyle = '#c9a44a';
  ctx.beginPath();
  ctx.arc(w / 2, h - 12, 3, 0, Math.PI * 2);
  ctx.fill();
  // lámpara de luna rota (apagada)
  ctx.fillStyle = '#b8b28a';
  ctx.beginPath();
  ctx.arc(18, 18, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6a4a33';
  ctx.beginPath();
  ctx.arc(22, 16, 8, 0, Math.PI * 2);
  ctx.fill();
  line(ctx, 14, 12, 20, 24, '#3a2e1e', 1.2);
}

function drawDesk(ctx, w, h) {
  fillRR(ctx, 0, 0, w, h - 14, 4, '#6e4d35', '#1f130b', 2);
  fillRR(ctx, 0, h - 16, w, 16, 3, '#3f2b1e', '#1f130b', 2);
  line(ctx, 4, 4, w - 4, 4, '#8b6446', 2, 0.7);
  // objetos del escritorio
  ctx.save();
  ctx.translate(40, 30);
  ctx.rotate(-0.12);
  fillRR(ctx, -22, -14, 44, 28, 1, '#d6d0bd');
  for (let i = 0; i < 4; i++) line(ctx, -18, -8 + i * 6, 18, -8 + i * 6, '#8a8470', 1);
  ctx.restore();
  ctx.fillStyle = '#2a2a30'; // portalápices
  ctx.beginPath();
  ctx.arc(w - 26, 24, 9, 0, Math.PI * 2);
  ctx.fill();
  for (const dx of [-4, 0, 4]) line(ctx, w - 26 + dx, 24, w - 26 + dx * 1.6, 12, ['#d33', '#36c', '#3a3'][dx / 4 + 1], 2);
  fillRR(ctx, 78, 14, 34, 40, 2, '#7a3a2a', '#2a140e', 1.5); // libro
}

function drawWardrobe(ctx, w, h) {
  fillRR(ctx, 0, 0, w, h, 4, '#4a3224', '#150d07', 2);
  fillRR(ctx, 0, 0, w, 12, 3, '#5c3f2d', '#150d07', 1.5);
  for (const x of [8, 88]) {
    fillRR(ctx, x, 18, 72, h - 26, 2, '#553a29', '#2a1a10', 2);
    fillRR(ctx, x + 8, 26, 56, h - 42, 2, null, '#3a2616', 2);
  }
  ctx.fillStyle = '#c9a44a';
  for (const x of [72, 96]) {
    ctx.beginPath();
    ctx.arc(x, 56, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  line(ctx, w / 2, 14, w / 2, h - 6, '#150d07', 2);
}

function drawBookshelf(ctx, w, h) {
  fillRR(ctx, 0, 0, w, h, 4, '#4a3224', '#150d07', 2);
  fillRR(ctx, 7, 7, w - 14, h - 14, 2, '#22170f');
  const rnd = mulberry32(5);
  const colors = ['#7a2e2e', '#2e4a7a', '#2e6a4a', '#8a6a2e', '#5a2e6a', '#6a6a6a', '#9a4a2a'];
  const shelfH = (h - 14) / 4;
  for (let s = 0; s < 4; s++) {
    const y0 = 7 + s * shelfH;
    let x = 10;
    while (x < w - 16) {
      const bw = 5 + rnd() * 6;
      const bh = shelfH - 8 - rnd() * 12;
      ctx.fillStyle = colors[Math.floor(rnd() * colors.length)];
      ctx.fillRect(x, y0 + shelfH - 4 - bh, bw, bh);
      line(ctx, x + 1, y0 + shelfH - 4 - bh + 3, x + 1, y0 + shelfH - 8, 'rgba(255,255,255,0.18)', 1);
      x += bw + 0.6;
    }
    ctx.fillStyle = '#5c3f2d';
    ctx.fillRect(7, y0 + shelfH - 4, w - 14, 4);
  }
}

function drawDresser(ctx, w, h) {
  fillRR(ctx, 0, 0, w, h, 4, '#5b3e2b', '#150d07', 2);
  fillRR(ctx, 6, 6, w - 12, h - 12, 3, '#6a4a33');
  ctx.fillStyle = '#d9d3bf'; // mantelito
  ctx.beginPath();
  ctx.arc(w / 2 + 4, 34, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8e2d0'; // vela apagada (detalle de la historia)
  ctx.fillRect(w / 2, 24, 8, 18);
  line(ctx, w / 2 + 4, 24, w / 2 + 4, 19, '#111', 1.5);
  fillRR(ctx, 14, 74, 44, 40, 2, '#c9b27a', '#2a1a10', 3); // marco
  fillRR(ctx, 20, 80, 32, 28, 1, '#5a6a5a');
}

function drawSofa(ctx, w, h) {
  fillRR(ctx, 0, 0, w, h, 8, '#274238', '#0f1c17', 2);
  fillRR(ctx, 0, 0, w, 26, 8, '#2c4a40', '#0f1c17', 2);
  fillRR(ctx, 12, 28, 62, h - 36, 6, '#35574a', '#1c3028', 1.5);
  fillRR(ctx, 76, 28, 62, h - 36, 6, '#35574a', '#1c3028', 1.5);
  fillRR(ctx, 0, 14, 14, h - 14, 6, '#274238', '#0f1c17', 2);
  fillRR(ctx, w - 14, 14, 14, h - 14, 6, '#274238', '#0f1c17', 2);
  ctx.fillStyle = '#c9a44a';
  for (const [x, y] of [[43, 54], [107, 54]]) {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTable(ctx, w, h) {
  fillRR(ctx, 0, 0, w, h, 6, '#6b4a33', '#1a0f08', 2);
  fillRR(ctx, 8, 8, w - 16, h - 16, 4, '#d8d2bf', '#a39d88', 1.5);
  for (let x = 14; x < w - 12; x += 10) line(ctx, x, 12, x, h - 12, 'rgba(120,110,90,0.25)', 1);
  ctx.fillStyle = '#5a3a24'; // florero seco
  ctx.beginPath();
  ctx.arc(w - 26, h / 2, 8, 0, Math.PI * 2);
  ctx.fill();
  line(ctx, w - 26, h / 2, w - 20, h / 2 - 14, '#6a5a2a', 1.5);
  line(ctx, w - 26, h / 2, w - 32, h / 2 - 12, '#6a5a2a', 1.5);
}

function drawCrates(ctx, w, h) {
  const box = (x, y, bw, bh) => {
    fillRR(ctx, x, y, bw, bh, 2, '#7a5a3a', '#2a1a0e', 2);
    for (let yy = y + 12; yy < y + bh - 4; yy += 14) line(ctx, x + 2, yy, x + bw - 2, yy, '#4a331f', 2);
    line(ctx, x + 4, y + 4, x + bw - 4, y + bh - 4, '#4a331f', 2, 0.6);
    line(ctx, x + bw - 4, y + 4, x + 4, y + bh - 4, '#4a331f', 2, 0.6);
    ctx.fillStyle = '#2a1a0e';
    for (const [nx, ny] of [[x + 5, y + 5], [x + bw - 5, y + 5], [x + 5, y + bh - 5], [x + bw - 5, y + bh - 5]]) ctx.fillRect(nx - 1, ny - 1, 3, 3);
  };
  box(0, 26, w, h - 26);
  box(10, 0, 62, 44);
  ctx.fillStyle = '#8a1f1f';
  ctx.font = 'bold 9px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FRÁGIL', w / 2, h - 14);
}

function drawChest(ctx, w, h) {
  fillRR(ctx, 0, 0, w, h, 6, '#6e4026', '#1a0f08', 2);
  fillRR(ctx, 4, 4, w - 8, h - 20, 4, '#7d4a2e');
  ctx.fillStyle = '#3a3a42';
  ctx.fillRect(18, 0, 12, h);
  ctx.fillRect(w - 30, 0, 12, h);
  fillRR(ctx, w / 2 - 9, h / 2 - 12, 18, 18, 3, '#c9a44a', '#6a5320', 1.5);
  ctx.fillStyle = '#2a2a30';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2 - 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // pegatinas infantiles
  ctx.fillStyle = '#e8c13a';
  ctx.beginPath();
  ctx.arc(46, 18, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d04a6a';
  ctx.beginPath();
  ctx.arc(80, 52, 5, 0, Math.PI * 2);
  ctx.fill();
  fillRR(ctx, 2, h - 14, w - 4, 12, 3, '#4a2a18'); // frente
}

function drawGenerator(on) {
  return (ctx, w, h) => {
    fillRR(ctx, 0, 14, w, h - 14, 6, '#4e5a3c', '#1a2012', 2);
    fillRR(ctx, 6, 20, w - 12, 30, 3, '#3a4430');
    for (let x = 12; x < w - 12; x += 8) line(ctx, x, 24, x, 46, '#232a1b', 3);
    fillRR(ctx, 6, 56, 54, 46, 4, '#8a2a22', '#3a0f0c', 2); // tanque de combustible
    ctx.fillStyle = '#d9d3bf';
    ctx.font = 'bold 8px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAS', 33, 83);
    fillRR(ctx, 64, 56, 50, 46, 3, '#2d3524', '#11160c', 2); // panel de control
    ctx.fillStyle = '#d9d3bf';
    ctx.beginPath();
    ctx.arc(80, 72, 9, 0, Math.PI * 2);
    ctx.fill(); // dial
    line(ctx, 80, 72, 86, 66, '#222', 2);
    ctx.fillStyle = on ? '#5fff8f' : '#2a3a2a';
    ctx.beginPath();
    ctx.arc(102, 66, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = on ? '#3a3a20' : '#7a1f1f';
    ctx.beginPath();
    ctx.arc(102, 80, 4, 0, Math.PI * 2);
    ctx.fill();
    if (!on) {
      fillRR(ctx, 70, 90, 16, 12, 2, '#c9a44a', '#6a5320', 1.5); // candado
      line(ctx, 74, 90, 74, 84, '#c9a44a', 2);
      line(ctx, 82, 90, 82, 84, '#c9a44a', 2);
    }
    fillRR(ctx, 84, 0, 14, 18, 3, '#2a2a30', '#111', 1.5); // escape
    if (on) {
      ctx.fillStyle = radial(ctx, 91, 4, 14, [[0, 'rgba(255,230,150,0.9)'], [1, 'rgba(255,230,150,0)']]);
      ctx.fillRect(70, 0, 40, 24);
    }
  };
}

// ---------------------------------------------------------------- objetos pequeños
function drawFlashlight(ctx) {
  fillRR(ctx, 2, 6, 24, 9, 3, '#1e1e24', '#0b0b0e', 1);
  ctx.fillStyle = '#c0c4cc';
  ctx.beginPath();
  ctx.moveTo(24, 4);
  ctx.lineTo(32, 1);
  ctx.lineTo(32, 20);
  ctx.lineTo(24, 17);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff2b8';
  ctx.fillRect(30, 4, 2, 13);
  ctx.fillStyle = '#d33';
  ctx.fillRect(10, 8, 5, 2);
  line(ctx, 4, 8, 22, 8, 'rgba(255,255,255,0.25)', 1);
}

function drawBattery(ctx) {
  fillRR(ctx, 1, 5, 16, 22, 3, '#2f8f52', '#145030', 1.5);
  fillRR(ctx, 6, 0, 6, 6, 1, '#b7bcc4');
  ctx.fillStyle = '#e8c13a';
  ctx.fillRect(1, 17, 16, 4);
  ctx.fillStyle = '#fff';
  ctx.fillRect(8, 9, 2, 6);
  ctx.fillRect(6, 11, 6, 2);
}

function drawPhoto(ctx) {
  fillRR(ctx, 0, 0, 30, 26, 2, '#f2eee2', '#9a9482', 1);
  ctx.fillStyle = '#8fb3d9';
  ctx.fillRect(3, 3, 24, 12);
  ctx.fillStyle = '#6f9a5a';
  ctx.fillRect(3, 15, 24, 6);
  ctx.fillStyle = '#d6a27a';
  for (const [x, y] of [[10, 12], [16, 11], [21, 13]]) {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#c85a5a';
  ctx.fillRect(9, 14, 3, 5);
  ctx.fillStyle = '#e8c13a';
  ctx.fillRect(15, 14, 3, 5);
}

function drawNote(ctx) {
  fillRR(ctx, 0, 0, 24, 28, 2, '#e8dfc0', '#8a7f60', 1);
  for (let y = 7; y < 24; y += 4) line(ctx, 4, y, 20, y, '#8a7f60', 1, 0.8);
  ctx.fillStyle = '#c9bf9c';
  ctx.beginPath();
  ctx.moveTo(24, 20);
  ctx.lineTo(16, 28);
  ctx.lineTo(24, 28);
  ctx.closePath();
  ctx.fill();
}

function drawClipping(ctx) {
  fillRR(ctx, 0, 0, 28, 32, 1, '#cfcab8', '#7a7566', 1);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(3, 3, 22, 5);
  for (let y = 11; y < 29; y += 3) line(ctx, 3, y, 25, y, '#5a574c', 1);
  ctx.fillStyle = '#8a8470';
  ctx.fillRect(3, 11, 9, 8);
}

function drawDrawing(ctx) {
  fillRR(ctx, 0, 0, 36, 30, 1, '#f6f2e6', '#b3ad98', 1);
  line(ctx, 8, 9, 8, 19, '#3a6ad9', 2); // niño
  ctx.fillStyle = '#e8c13a';
  ctx.fillRect(10, 12, 6, 2); // linterna
  ctx.fillStyle = '#e8c13a'; // niña de amarillo
  ctx.beginPath();
  ctx.moveTo(28, 10);
  ctx.lineTo(24, 20);
  ctx.lineTo(32, 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#222'; // sombra grande
  ctx.beginPath();
  ctx.ellipse(18, 18, 6, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  line(ctx, 15, 14, 21, 14, '#f6f2e6', 1);
  ctx.strokeStyle = '#f6f2e6';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(18, 19, 3, 0.1, Math.PI - 0.1);
  ctx.stroke();
}

function drawPhone(ctx) {
  fillRR(ctx, 0, 0, 18, 32, 3, '#15151a', '#000', 1);
  fillRR(ctx, 2, 3, 14, 24, 1, '#3c6cb0');
  line(ctx, 4, 8, 14, 8, 'rgba(255,255,255,0.8)', 1.5);
  line(ctx, 4, 12, 12, 12, 'rgba(255,255,255,0.5)', 1.5);
  line(ctx, 4, 16, 13, 16, 'rgba(255,255,255,0.5)', 1.5);
}

function drawBox(ctx) {
  fillRR(ctx, 0, 4, 36, 24, 3, '#8a5a30', '#3a2210', 1.5);
  fillRR(ctx, 0, 0, 36, 10, 3, '#9a6a3a', '#3a2210', 1.5);
  fillRR(ctx, 10, 13, 16, 10, 2, '#c9a44a', '#6a5320', 1);
  ctx.fillStyle = '#2a2a30';
  for (const x of [13, 18, 23]) ctx.fillRect(x, 16, 3, 5);
}

function drawTape(ctx) {
  fillRR(ctx, 0, 0, 28, 18, 2, '#2a2a30', '#000', 1);
  fillRR(ctx, 4, 3, 20, 9, 1, '#ece6d4');
  ctx.fillStyle = '#2a2a30';
  for (const x of [9, 19]) {
    ctx.beginPath();
    ctx.arc(x, 8, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#b02020';
  ctx.fillRect(4, 3, 20, 2);
}

function drawKey(ctx) {
  ctx.strokeStyle = '#e8c13a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(7, 7, 4.5, 0, Math.PI * 2);
  ctx.stroke();
  line(ctx, 11.5, 7, 28, 7, '#e8c13a', 3);
  line(ctx, 22, 7, 22, 12, '#e8c13a', 3);
  line(ctx, 27, 7, 27, 11, '#e8c13a', 3);
}

// ---------------------------------------------------------------- personajes
/** Dibuja un fotograma del protagonista. dir: down|up|left|right, pose: 0..3 */
function drawPlayerFrame(ctx, ox, oy, dir, pose) {
  ctx.save();
  ctx.translate(ox, oy);
  const mirror = dir === 'left';
  if (mirror) {
    ctx.translate(PLAYER.FRAME_W, 0);
    ctx.scale(-1, 1);
  }
  const side = dir === 'left' || dir === 'right';
  const bob = pose === 1 ? 1 : 0;
  const step = pose === 2 ? -1 : pose === 3 ? 1 : 0;

  // sombra
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(20, 51, 13, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // piernas
  const legCol = '#2b2f3a';
  if (!side) {
    fillRR(ctx, 12, 37 + (step === -1 ? -3 : 0), 7, 13 + (step === -1 ? 3 : 0), 2, legCol);
    fillRR(ctx, 21, 37 + (step === 1 ? -3 : 0), 7, 13 + (step === 1 ? 3 : 0), 2, legCol);
  } else {
    fillRR(ctx, 15 + step * 5, 37, 7, 13, 2, '#232733');
    fillRR(ctx, 18 - step * 5, 37, 7, 13, 2, legCol);
  }
  // zapatos
  ctx.fillStyle = '#16161b';
  if (!side) {
    ctx.fillRect(11, 48, 9, 3);
    ctx.fillRect(21, 48, 9, 3);
  } else {
    ctx.fillRect(14 + step * 5, 48, 10, 3);
    ctx.fillRect(17 - step * 5, 48, 10, 3);
  }

  // torso (sudadera azul)
  const bodyW = side ? 16 : 22;
  const bx = 20 - bodyW / 2;
  fillRR(ctx, bx, 21 + bob, bodyW, 19, 6, '#3e6aa8', '#22406c', 1.5);
  // brazos
  if (!side) {
    fillRR(ctx, 5, 23 + bob + (step === 1 ? -2 : 0), 5, 13, 2, '#35609c');
    fillRR(ctx, 30, 23 + bob + (step === -1 ? -2 : 0), 5, 13, 2, '#35609c');
    ctx.fillStyle = '#e2b48c';
    ctx.fillRect(5, 35 + bob + (step === 1 ? -2 : 0), 5, 3);
    ctx.fillRect(30, 35 + bob + (step === -1 ? -2 : 0), 5, 3);
  } else {
    fillRR(ctx, 16 - step * 3, 23 + bob, 7, 12, 3, '#35609c');
    ctx.fillStyle = '#e2b48c';
    ctx.fillRect(17 - step * 3, 34 + bob, 5, 3);
  }

  // cabeza
  ctx.fillStyle = '#e2b48c';
  ctx.beginPath();
  ctx.arc(20, 13 + bob, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2f2118'; // pelo
  if (dir === 'up') {
    ctx.beginPath();
    ctx.arc(20, 13 + bob, 10, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(20, 12 + bob, 10, Math.PI * 1.05, Math.PI * 1.95);
    ctx.lineTo(30, 12 + bob);
    ctx.lineTo(10, 12 + bob);
    ctx.closePath();
    ctx.fill();
    if (side) ctx.fillRect(10, 10 + bob, 7, 8); // pelo de la nuca
  }
  // cara
  ctx.fillStyle = '#1c1410';
  if (dir === 'down') {
    ctx.fillRect(15, 14 + bob, 3, 3);
    ctx.fillRect(22, 14 + bob, 3, 3);
    line(ctx, 17, 20 + bob, 23, 20 + bob, '#8a5a4a', 1.2);
  } else if (side) {
    ctx.fillRect(24, 14 + bob, 3, 3);
    ctx.fillStyle = '#d6a27a';
    ctx.fillRect(29, 15 + bob, 2, 3);
  }
  ctx.restore();
}

/** Fotograma de la criatura ("la Sombra"). */
function drawMonsterFrame(ctx, ox, oy, frame) {
  const rnd = mulberry32(100 + frame * 17);
  const j = (a) => (rnd() - 0.5) * a; // temblor
  const sway = Math.sin((frame / 4) * Math.PI * 2);
  ctx.save();
  ctx.translate(ox, oy);

  // sombra en el suelo
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.ellipse(32, 82, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const body = '#08050c';
  const rim = '#2b1a3d';

  // brazos larguísimos
  for (const s of [-1, 1]) {
    ctx.strokeStyle = body;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(32 + s * 8, 32);
    ctx.quadraticCurveTo(32 + s * (22 + sway * 3), 50 + j(2), 32 + s * (24 + sway * 4 + j(2)), 78);
    ctx.stroke();
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1;
    ctx.stroke();
    // garras
    ctx.strokeStyle = '#cfc6dc';
    ctx.lineWidth = 1.2;
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(32 + s * (24 + sway * 4), 77);
      ctx.lineTo(32 + s * (24 + sway * 4) + k * 3 + s * 1, 85);
      ctx.stroke();
    }
  }

  // piernas
  ctx.strokeStyle = body;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(28, 54);
  ctx.lineTo(26 + sway * 2, 80);
  ctx.moveTo(36, 54);
  ctx.lineTo(38 - sway * 2, 80);
  ctx.stroke();

  // torso
  ctx.fillStyle = body;
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(23 + j(1), 30);
  ctx.quadraticCurveTo(32, 26, 41 + j(1), 30);
  ctx.lineTo(37, 58);
  ctx.lineTo(27, 58);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // jirones de sombra (humo)
  ctx.strokeStyle = 'rgba(8,5,12,0.85)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const sx = 24 + i * 3.2;
    ctx.beginPath();
    ctx.moveTo(sx, 56);
    ctx.quadraticCurveTo(sx + j(8), 66, sx + j(10), 72 + j(4));
    ctx.stroke();
  }

  // cabeza alargada
  ctx.fillStyle = body;
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(32, 17, 11, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // ojos y sonrisa
  ctx.fillStyle = '#fff3b0';
  for (const x of [27, 37]) {
    ctx.beginPath();
    ctx.ellipse(x, 15, 3.4, 2.2 + (frame === 2 ? 0.6 : 0), x === 27 ? -0.3 : 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#e8e0cc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 24);
  for (let k = 0; k <= 8; k++) ctx.lineTo(24 + k * 2, 24 + (k % 2 ? 3 : 0) + Math.sin(k) * 0.5);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- iconos / UI
function drawIconPause(ctx, w, h) {
  ctx.fillStyle = '#fff';
  fillRR(ctx, 7, 5, 6, 22, 2, '#fff');
  fillRR(ctx, 19, 5, 6, 22, 2, '#fff');
}

function drawSpeaker(ctx) {
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(5, 12);
  ctx.lineTo(11, 12);
  ctx.lineTo(18, 6);
  ctx.lineTo(18, 26);
  ctx.lineTo(11, 20);
  ctx.lineTo(5, 20);
  ctx.closePath();
  ctx.fill();
}

function drawIconSoundOn(ctx) {
  drawSpeaker(ctx);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  for (const r of [6, 11]) {
    ctx.beginPath();
    ctx.arc(18, 16, r, -0.8, 0.8);
    ctx.stroke();
  }
}

function drawIconSoundOff(ctx) {
  drawSpeaker(ctx);
  ctx.strokeStyle = '#ff6a6a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(22, 11);
  ctx.lineTo(30, 21);
  ctx.moveTo(30, 11);
  ctx.lineTo(22, 21);
  ctx.stroke();
}

function drawIconBag(ctx) {
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(16, 10, 5, Math.PI, 0);
  ctx.stroke();
  fillRR(ctx, 6, 10, 20, 17, 4, '#fff');
  fillRR(ctx, 11, 17, 10, 6, 2, '#222');
}

function drawIconLight(ctx) {
  ctx.fillStyle = '#fff';
  fillRR(ctx, 4, 12, 14, 9, 2, '#fff');
  ctx.beginPath();
  ctx.moveTo(18, 10);
  ctx.lineTo(24, 7);
  ctx.lineTo(24, 26);
  ctx.lineTo(18, 23);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  line(ctx, 27, 10, 31, 8, '#fff', 2);
  line(ctx, 27, 16.5, 32, 16.5, '#fff', 2);
  line(ctx, 27, 23, 31, 25, '#fff', 2);
}

function drawIconBattery(ctx) {
  fillRR(ctx, 2, 6, 24, 14, 3, null, '#fff', 2.5);
  ctx.fillStyle = '#fff';
  ctx.fillRect(26, 10, 3, 6);
}

function drawIconPhoto(ctx) {
  fillRR(ctx, 4, 6, 24, 20, 2, null, '#fff', 2.5);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(7, 23);
  ctx.lineTo(14, 14);
  ctx.lineTo(19, 20);
  ctx.lineTo(22, 17);
  ctx.lineTo(26, 23);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(21, 11, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawIconNote(ctx) {
  fillRR(ctx, 7, 4, 18, 24, 2, null, '#fff', 2.5);
  for (const y of [11, 16, 21]) line(ctx, 11, y, 21, y, '#fff', 2);
}

// ---------------------------------------------------------------- luces
function drawCone(ctx, w, h) {
  const img = ctx.createImageData(w, h);
  const half = 0.62; // semiapertura de la textura (algo mayor que la de detección)
  const cy = h / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x;
      const dy = y - cy;
      const r = Math.hypot(dx, dy);
      const th = Math.abs(Math.atan2(dy, dx));
      const radial = 1 - smoothstep(0.45, 1.0, r / w);
      const angular = 1 - smoothstep(half * 0.35, half, th);
      const a = Math.max(0, radial * angular);
      const i = (y * w + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(255 * Math.min(1, a * 1.05));
    }
  }
  ctx.putImageData(img, 0, 0);
}

// ---------------------------------------------------------------- API pública
export function generateMenuBackground(scene) {
  canvasTexture(scene, TEX.ROOM_BG, WORLD.width, WORLD.height, drawRoom);
}

export function generateAllTextures(scene) {
  const T = TEX;
  canvasTexture(scene, T.PIXEL, 2, 2, (ctx) => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 2, 2);
  });
  canvasTexture(scene, T.ROOM_BG, WORLD.width, WORLD.height, drawRoom);

  // lluvia (patrón que se desplaza sobre la ventana)
  canvasTexture(scene, T.RAIN, DECOR.window.w, DECOR.window.h, (ctx, w, h) => {
    const rnd = mulberry32(3);
    for (let i = 0; i < 38; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      line(ctx, x, y, x - 3, y + 11 + rnd() * 8, 'rgba(170,200,255,0.55)', 1);
    }
  });

  // muebles
  const furn = [
    ['furn_bed', 160, 200, drawBed],
    ['furn_nightstand', 56, 56, drawNightstand],
    ['furn_desk', 232, 80, drawDesk],
    ['furn_wardrobe', 168, 88, drawWardrobe],
    ['furn_bookshelf', 80, 220, drawBookshelf],
    ['furn_dresser', 72, 130, drawDresser],
    ['furn_sofa', 150, 90, drawSofa],
    ['furn_table', 128, 72, drawTable],
    ['furn_crates', 96, 88, drawCrates],
    ['furn_chest', 120, 72, drawChest],
    ['furn_generator', 120, 112, drawGenerator(false)],
    [T.GENERATOR_ON, 120, 112, drawGenerator(true)]
  ];
  for (const [key, w, h, fn] of furn) canvasTexture(scene, key, w, h, fn);

  // objetos
  const items = [
    [T.ITEM_FLASHLIGHT, 32, 21, drawFlashlight],
    [T.ITEM_BATTERY, 18, 28, drawBattery],
    [T.ITEM_PHOTO, 30, 26, drawPhoto],
    [T.ITEM_NOTE, 24, 28, drawNote],
    [T.ITEM_CLIPPING, 28, 32, drawClipping],
    [T.ITEM_DRAWING, 36, 30, drawDrawing],
    [T.ITEM_PHONE, 18, 32, drawPhone],
    [T.ITEM_BOX, 36, 28, drawBox],
    [T.ITEM_TAPE, 28, 18, drawTape],
    [T.ITEM_KEY, 30, 14, drawKey]
  ];
  for (const [key, w, h, fn] of items) canvasTexture(scene, key, w, h, fn);

  // protagonista: 4 direcciones x 4 poses
  const dirs = ['down', 'up', 'left', 'right'];
  const pt = canvasTexture(scene, T.PLAYER, PLAYER.FRAME_W * 4, PLAYER.FRAME_H * 4, (ctx) => {
    dirs.forEach((dir, row) => {
      for (let pose = 0; pose < 4; pose++) drawPlayerFrame(ctx, pose * PLAYER.FRAME_W, row * PLAYER.FRAME_H, dir, pose);
    });
  });
  dirs.forEach((dir, row) => {
    for (let pose = 0; pose < 4; pose++) pt.add(`${dir}_${pose}`, 0, pose * PLAYER.FRAME_W, row * PLAYER.FRAME_H, PLAYER.FRAME_W, PLAYER.FRAME_H);
  });

  // criatura: 4 fotogramas
  const mt = canvasTexture(scene, T.MONSTER, 64 * 4, 90, (ctx) => {
    for (let f = 0; f < 4; f++) drawMonsterFrame(ctx, f * 64, 0, f);
  });
  for (let f = 0; f < 4; f++) mt.add(`m${f}`, 0, f * 64, 0, 64, 90);

  // luces
  canvasTexture(scene, T.GLOW_SOFT, 128, 128, (ctx, w, h) => {
    ctx.fillStyle = radial(ctx, 64, 64, 64, [
      [0, 'rgba(255,255,255,1)'],
      [0.4, 'rgba(255,255,255,0.45)'],
      [1, 'rgba(255,255,255,0)']
    ]);
    ctx.fillRect(0, 0, w, h);
  });
  canvasTexture(scene, T.GLOW_EYE, 56, 28, (ctx) => {
    for (const x of [16, 40]) {
      ctx.fillStyle = radial(ctx, x, 14, 14, [
        [0, 'rgba(255,60,50,1)'],
        [0.35, 'rgba(255,40,40,0.55)'],
        [1, 'rgba(255,0,0,0)']
      ]);
      ctx.fillRect(x - 14, 0, 28, 28);
      ctx.fillStyle = '#ffd0b0';
      ctx.beginPath();
      ctx.ellipse(x, 14, 2.6, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  canvasTexture(scene, T.CONE, CONE_SIZE.w, CONE_SIZE.h, drawCone);
  canvasTexture(scene, T.AMBIENT, 256, 256, (ctx, w, h) => {
    ctx.fillStyle = radial(ctx, 128, 128, 128, [
      [0, 'rgba(255,255,255,0.95)'],
      [0.4, 'rgba(255,255,255,0.7)'],
      [0.75, 'rgba(255,255,255,0.18)'],
      [1, 'rgba(255,255,255,0)']
    ]);
    ctx.fillRect(0, 0, w, h);
  });

  // viñeta roja de peligro (centro transparente → bordes rojos)
  canvasTexture(scene, T.VIGNETTE, 480, 270, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, w * 0.62);
    g.addColorStop(0, 'rgba(160,0,0,0)');
    g.addColorStop(1, 'rgba(190,10,10,0.85)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

  // controles táctiles
  canvasTexture(scene, T.JOY_BASE, 150, 150, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(75, 75, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 4;
    ctx.stroke();
  });
  canvasTexture(scene, T.JOY_THUMB, 64, 64, (ctx) => {
    ctx.fillStyle = radial(ctx, 32, 32, 30, [[0, 'rgba(255,255,255,0.85)'], [1, 'rgba(200,200,220,0.55)']]);
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
  });
  canvasTexture(scene, T.BTN_ROUND, 88, 88, (ctx) => {
    ctx.fillStyle = 'rgba(20,14,30,0.6)';
    ctx.beginPath();
    ctx.arc(44, 44, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(240,207,122,0.9)';
    ctx.lineWidth = 3.5;
    ctx.stroke();
  });

  // iconos (blancos, se tiñen con setTint)
  const icons = [
    [T.ICON_PAUSE, 32, 32, drawIconPause],
    [T.ICON_SOUND_ON, 32, 32, drawIconSoundOn],
    [T.ICON_SOUND_OFF, 32, 32, drawIconSoundOff],
    [T.ICON_BAG, 32, 32, drawIconBag],
    [T.ICON_LIGHT, 36, 32, drawIconLight],
    [T.ICON_BATTERY, 32, 26, drawIconBattery],
    [T.ICON_PHOTO, 32, 32, drawIconPhoto],
    [T.ICON_NOTE, 32, 32, drawIconNote]
  ];
  for (const [key, w, h, fn] of icons) canvasTexture(scene, key, w, h, fn);
}

/** Crea las animaciones globales (caminar, quieto y criatura). */
export function createAnimations(scene) {
  const anims = scene.anims;
  for (const dir of ['down', 'up', 'left', 'right']) {
    if (!anims.exists(`player-idle-${dir}`)) {
      anims.create({
        key: `player-idle-${dir}`,
        frames: [0, 1].map((i) => ({ key: TEX.PLAYER, frame: `${dir}_${i === 0 ? 0 : 1}` })),
        frameRate: 2,
        repeat: -1
      });
      anims.create({
        key: `player-walk-${dir}`,
        frames: [2, 0, 3, 0].map((i) => ({ key: TEX.PLAYER, frame: `${dir}_${i}` })),
        frameRate: 9,
        repeat: -1
      });
    }
  }
  if (!anims.exists('monster-idle')) {
    anims.create({
      key: 'monster-idle',
      frames: [0, 1, 2, 3].map((i) => ({ key: TEX.MONSTER, frame: `m${i}` })),
      frameRate: 6,
      repeat: -1
    });
  }
}
