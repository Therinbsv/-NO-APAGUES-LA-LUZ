// =====================================================================
//  DarknessLayer.js — Oscuridad dinámica con RenderTexture.
//  Responsable: Integrante 2.
//
//  Cada frame se rellena una textura del tamaño de la pantalla con un
//  color oscuro y se "borra" (blend ERASE) la silueta del cono de la
//  linterna y un pequeño halo alrededor del jugador. Todo ocurre en la GPU,
//  así que mantiene 60 FPS incluso en móviles.
// =====================================================================
import { GAME_WIDTH, GAME_HEIGHT, DEPTH, FLASHLIGHT } from '../config/constants.js';
import { TEX, CONE_SIZE } from '../assets/TextureFactory.js';

export default class DarknessLayer {
  constructor(scene, { depth = DEPTH.DARKNESS, color = 0x04020a } = {}) {
    this.scene = scene;
    this.color = color;
    this.rt = scene.add.renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0, 0).setScrollFactor(0).setDepth(depth);
    // Imágenes "plantilla" (no se añaden a la escena, solo se usan para borrar).
    this.cone = scene.make.image({ key: TEX.CONE, add: false }).setOrigin(0, 0.5);
    this.halo = scene.make.image({ key: TEX.AMBIENT, add: false }).setOrigin(0.5, 0.5);
  }

  /**
   * Redibuja la oscuridad.
   * @param {number} alpha opacidad base de la oscuridad (0-1)
   * @param {Array<{x,y,radius,strength}>} halos zonas circulares iluminadas (coords de pantalla)
   * @param {{x,y,angle,range,intensity}|null} cone cono de linterna (coords de pantalla)
   */
  render(alpha, halos = [], cone = null) {
    this.rt.fill(this.color, alpha);
    for (const h of halos) {
      this.halo.setPosition(h.x, h.y).setScale((h.radius * 2) / 256).setAlpha(h.strength ?? 1);
      this.rt.erase(this.halo);
    }
    if (cone) {
      this.cone
        .setPosition(cone.x, cone.y)
        .setRotation(cone.angle)
        .setScale((cone.range ?? FLASHLIGHT.RANGE) / CONE_SIZE.w)
        .setAlpha(cone.intensity ?? 1);
      this.rt.erase(this.cone);
    }
  }

  setVisible(v) {
    this.rt.setVisible(v);
  }

  destroy() {
    this.rt.destroy();
    this.cone.destroy();
    this.halo.destroy();
  }
}
