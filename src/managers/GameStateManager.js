// =====================================================================
//  GameStateManager.js — Máquina de estados global del juego.
//  Estados: BOOT → MENU → PLAYING ⇄ DIALOGUE / PAUSED → VICTORY | DEFEAT.
//  Cada escena informa su estado; las transiciones inválidas se rechazan,
//  lo que evita errores como "pausar mientras se está en el menú".
// =====================================================================
import { GAME_STATES as S, EVENTS } from '../config/constants.js';

const ALLOWED = {
  [S.BOOT]: [S.MENU],
  [S.MENU]: [S.PLAYING, S.MENU],
  [S.PLAYING]: [S.DIALOGUE, S.PAUSED, S.VICTORY, S.DEFEAT, S.MENU],
  [S.DIALOGUE]: [S.PLAYING, S.PAUSED, S.VICTORY, S.DEFEAT, S.MENU],
  [S.PAUSED]: [S.PLAYING, S.DIALOGUE, S.MENU],
  [S.VICTORY]: [S.MENU, S.PLAYING],
  [S.DEFEAT]: [S.MENU, S.PLAYING]
};

export default class GameStateManager {
  constructor(events) {
    this.events = events; // game.events
    this.state = S.BOOT;
    this.previous = null;
  }

  is(state) {
    return this.state === state;
  }

  /** Intenta cambiar de estado. Devuelve true si la transición es válida. */
  set(next) {
    if (next === this.state) return true;
    const ok = (ALLOWED[this.state] || []).includes(next);
    if (!ok) {
      // Se permite siempre volver al menú (p. ej. al cerrar una escena de forma abrupta).
      if (next !== S.MENU) {
        console.warn(`[GameState] transición no permitida: ${this.state} → ${next}`);
        return false;
      }
    }
    this.previous = this.state;
    this.state = next;
    this.events.emit(EVENTS.STATE_CHANGED, next, this.previous);
    return true;
  }
}
