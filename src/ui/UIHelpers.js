// =====================================================================
//  UIHelpers.js — Funciones y estilos reutilizables para toda la interfaz.
//  Mantiene la misma tipografía y paneles en menús, HUD y diálogos.
// =====================================================================
import { COLORS } from '../config/constants.js';

export const FONT_TITLE = "Georgia, 'Times New Roman', serif";
export const FONT_UI = "'Trebuchet MS', 'Segoe UI', Roboto, Arial, sans-serif";

/**
 * Crea un texto con resolución 2x (nítido aunque el canvas se escale).
 * opts: size, color, font, style, align, wrap, stroke, strokeThickness, originX, originY, lineSpacing
 */
export function makeText(scene, x, y, str, opts = {}) {
  const t = scene.add.text(x, y, str, {
    fontFamily: opts.font ?? FONT_UI,
    fontSize: `${opts.size ?? 16}px`,
    color: opts.color ?? COLORS.TEXT,
    fontStyle: opts.style ?? '',
    align: opts.align ?? 'left',
    stroke: opts.stroke ?? '#000000',
    strokeThickness: opts.strokeThickness ?? 0,
    lineSpacing: opts.lineSpacing ?? 2,
    wordWrap: opts.wrap ? { width: opts.wrap, useAdvancedWrap: true } : undefined,
    resolution: 2
  });
  t.setOrigin(opts.originX ?? 0, opts.originY ?? 0);
  return t;
}

/** Dibuja un panel redondeado semitransparente con borde dorado. */
export function drawPanel(g, x, y, w, h, opts = {}) {
  const { radius = 10, fill = 0x120d1a, alpha = 0.9, stroke = 0xd9b45a, lineWidth = 2, strokeAlpha = 0.9 } = opts;
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x, y, w, h, radius);
  if (lineWidth > 0) {
    g.lineStyle(lineWidth, stroke, strokeAlpha);
    g.strokeRoundedRect(x, y, w, h, radius);
  }
  return g;
}

/** Color del nombre del hablante en los diálogos. */
export function speakerColor(name) {
  const n = (name || '').toLowerCase();
  if (n.startsWith('sofía') || n.startsWith('grabación')) return COLORS.SOFIA;
  if (n.startsWith('mateo')) return COLORS.MATEO;
  if (n === 'narrador') return '#c9c1d8';
  return '#e8dfc0'; // notas, fotos, recortes…
}

/** Sonido de clic de interfaz (si hay AudioManager registrado). */
export function uiClick(scene) {
  const audio = scene.registry.get('audio');
  if (audio) audio.playSfx('sfx_click', { volume: 0.6 });
}

/** Rectángulo de pantalla completa oscuro (para fondos de modales). */
export function dimmer(scene, alpha = 0.6) {
  return scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, alpha).setOrigin(0, 0);
}
