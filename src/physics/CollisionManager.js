// =====================================================================
//  CollisionManager.js — Construye el mundo físico (Arcade Physics).
//  Responsable: Integrante 1 (personaje y físicas).
//
//  - Crea las paredes y los muebles como cuerpos estáticos.
//  - Genera las cuadrículas de pathfinding (navegación y línea de luz).
//  - Crea zonas "trigger" (overlaps que disparan eventos).
// =====================================================================
import Phaser from 'phaser';
import { WORLD, DEPTH } from '../config/constants.js';
import { WALLS, FURNITURE, TRIGGER_ZONES } from '../config/levelLayout.js';
import GridMap from './GridMap.js';
import { TEX } from '../assets/TextureFactory.js';

// Margen con el que se "inflan" los obstáculos para que la criatura (cuerpo ancho)
// no roce los muebles al seguir su ruta.
const NAV_INFLATE = 16;

export default class CollisionManager {
  constructor(scene) {
    this.scene = scene;
    this.solids = scene.physics.add.staticGroup();
    this.furnitureSprites = {};
    this.triggerZones = {};
    this.nav = new GridMap(WORLD.width, WORLD.height, WORLD.cellSize); // para caminar
    this.light = new GridMap(WORLD.width, WORLD.height, 16); // para bloquear la luz
  }

  /** Crea paredes y muebles. Devuelve el grupo estático de sólidos. */
  buildWorld() {
    // Paredes invisibles
    for (const w of WALLS) {
      const s = this.solids.create(w.x + w.w / 2, w.y + w.h / 2, TEX.PIXEL);
      s.setDisplaySize(w.w, w.h).setVisible(false).refreshBody();
      this.nav.addRect(w.x, w.y, w.w, w.h, 0);
      this.light.addRect(w.x, w.y, w.w, w.h, 0);
    }
    // Muebles
    for (const f of FURNITURE) {
      const s = this.solids.create(f.x + f.w / 2, f.y + f.h / 2, f.texture);
      s.setDepth(f.y + f.h);
      s.refreshBody();
      this.furnitureSprites[f.id] = s;
      this.nav.addRect(f.x, f.y, f.w, f.h, NAV_INFLATE);
      this.light.addRect(f.x, f.y, f.w, f.h, 0);
    }
    // Las paredes también se inflan en la cuadrícula de navegación
    for (const w of WALLS) this.nav.addRect(w.x, w.y, w.w, w.h, NAV_INFLATE);
    return this.solids;
  }

  /** Hace que un objeto con cuerpo choque contra todos los sólidos. */
  collide(gameObject) {
    return this.scene.physics.add.collider(gameObject, this.solids);
  }

  /** Crea las zonas trigger y devuelve un diccionario id -> Zone. */
  buildTriggerZones() {
    for (const z of TRIGGER_ZONES) {
      const zone = this.scene.add.zone(z.x, z.y, z.w, z.h);
      this.scene.physics.add.existing(zone, true); // cuerpo estático
      zone.triggerId = z.id;
      this.triggerZones[z.id] = zone;
    }
    return this.triggerZones;
  }

  /** Línea de visión de la luz entre dos puntos (los muebles la bloquean). */
  isLightBlocked(x1, y1, x2, y2) {
    return !this.light.lineClear(x1, y1, x2, y2, 8);
  }

  /** Depuración: dibuja la cuadrícula de navegación (tecla F4). */
  toggleDebug() {
    if (this.debugGfx) {
      this.debugGfx.destroy();
      this.debugGfx = null;
      return;
    }
    const g = this.scene.add.graphics().setDepth(DEPTH.FX);
    g.fillStyle(0xff0000, 0.25);
    const c = this.nav.cell;
    for (let r = 0; r < this.nav.rows; r++) {
      for (let col = 0; col < this.nav.cols; col++) {
        if (this.nav.isBlockedCell(col, r)) g.fillRect(col * c, r * c, c, c);
      }
    }
    this.debugGfx = g;
  }
}

// Utilidad para otras clases.
export const distance = Phaser.Math.Distance.Between;
