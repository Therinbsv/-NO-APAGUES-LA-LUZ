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
