// =====================================================================
//  InteractableObject.js — Objeto del mundo con el que se interactúa (E).
//  Responsable: Integrante 3.
//
//  Se construye a partir de una entrada del JSON (public/assets/data/story.json).
//  Lo que ocurre al interactuar lo decide StoryManager. Esta clase solo se
//  ocupa de lo visual: sprite, destello ("glint") visible en la oscuridad
//  cuando el jugador se acerca, y estado recogido/disponible.
// =====================================================================
import Phaser from 'phaser';
import { DEPTH } from '../config/constants.js';
import { TEX } from '../assets/TextureFactory.js';

const GLINT_RANGE = 200; // a esta distancia empieza a verse el destello

export default class InteractableObject extends Phaser.GameObjects.Sprite {
  /** @param {object} def entrada de "interactables" en story.json */
  constructor(scene, def) {
    super(scene, def.x, def.y, def.texture || TEX.PIXEL);
    scene.add.existing(this);
    this.def = def;
    this.id = def.id;
    this.type = def.type;
    this.radius = def.radius ?? 80;
    this.available = true;

    if (def.texture) {
      this.setDepth(def.onTop ? DEPTH.ITEM_TOP : DEPTH.ITEM_FLOOR);
      if (def.alpha) this.setAlpha(def.alpha);
    } else {
      this.setVisible(false); // zonas invisibles (puerta, armario, baúl…)
    }

    // Destello cálido por encima de la oscuridad: ayuda a encontrar los objetos.
    this.glint = scene.add
      .image(def.x, def.y, TEX.GLOW_SOFT)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0xffdf8a)
      .setDepth(DEPTH.GLINT)
      .setScale(0.5)
      .setAlpha(0);
    this.phase = Math.random() * Math.PI * 2;
  }

  /** Distancia desde un punto hasta el objeto. */
  distanceTo(x, y) {
    return Phaser.Math.Distance.Between(x, y, this.x, this.y);
  }

  /** Actualiza el destello según la cercanía del jugador. */
  updateGlint(time, px, py) {
    if (!this.available) {
      this.glint.setAlpha(0);
      return;
    }
    const d = this.distanceTo(px, py);
    if (d > GLINT_RANGE) {
      this.glint.setAlpha(0);
      return;
    }
    const pulse = 0.55 + 0.45 * Math.sin(time * 0.004 + this.phase);
    this.glint.setAlpha((1 - d / GLINT_RANGE) * 0.55 * pulse);
    this.glint.setScale(0.42 + 0.1 * pulse);
  }

  /** Marca el objeto como recogido: desaparece del mundo. */
  collect() {
    this.available = false;
    this.setVisible(false);
    this.glint.setVisible(false);
  }

  /** Restaura un objeto ya recogido (al cargar partida). */
  hideSilently() {
    this.collect();
  }

  destroy(fromScene) {
    if (this.glint) this.glint.destroy();
    super.destroy(fromScene);
  }
}
