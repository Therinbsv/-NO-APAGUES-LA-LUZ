// =====================================================================
//  StorageManager.js — Persistencia con localStorage.
//  Responsable: Integrante 4.
//
//  Claves que exige la rúbrica:
//    highScore       → puntuación más alta
//    nivelAlcanzado  → capítulo más avanzado alcanzado (1-7, 8 = final logrado)
//    audioMuted      → configuración de audio (silenciado o no)
//  Extras: configuración (volúmenes, dificultad…), partida guardada y finales
//  desbloqueados. Si localStorage no está disponible (modo privado) usa memoria.
// =====================================================================
import { STORAGE_KEYS } from '../config/constants.js';

export const DEFAULT_SETTINGS = {
  musicVolume: 0.6,
  sfxVolume: 0.85,
  difficulty: 'normal', // easy | normal | hard
  touchMode: 'auto', // auto | on | off
  reduceEffects: false // accesibilidad: menos destellos y sacudidas
};

export default class StorageManager {
  constructor() {
    this.memory = {};
    this.available = this._checkAvailable();
  }

  _checkAvailable() {
    try {
      const probe = '__nal_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Lee y parsea un valor JSON. */
  read(key, fallback) {
    try {
      const raw = this.available ? window.localStorage.getItem(key) : this.memory[key];
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  /** Guarda un valor como JSON. */
  write(key, value) {
    const raw = JSON.stringify(value);
    try {
      if (this.available) window.localStorage.setItem(key, raw);
      else this.memory[key] = raw;
    } catch (e) {
      this.memory[key] = raw;
    }
  }

  remove(key) {
    try {
      if (this.available) window.localStorage.removeItem(key);
    } catch (e) {
      /* nada */
    }
    delete this.memory[key];
  }

  // ---------------------------------------------------------- High score
  getHighScore() {
    return Number(this.read(STORAGE_KEYS.highScore, 0)) || 0;
  }

  /** Guarda la puntuación si supera el récord. Devuelve true si es nuevo récord. */
  submitScore(score) {
    if (score > this.getHighScore()) {
      this.write(STORAGE_KEYS.highScore, score);
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------- Nivel alcanzado
  getLevelReached() {
    return Number(this.read(STORAGE_KEYS.levelReached, 0)) || 0;
  }

  submitLevel(level) {
    if (level > this.getLevelReached()) this.write(STORAGE_KEYS.levelReached, level);
  }

  // ---------------------------------------------------------- Audio
  isAudioMuted() {
    return this.read(STORAGE_KEYS.audioMuted, false) === true;
  }

  setAudioMuted(muted) {
    this.write(STORAGE_KEYS.audioMuted, !!muted);
  }

  // ---------------------------------------------------------- Configuración
  getSettings() {
    return { ...DEFAULT_SETTINGS, ...this.read(STORAGE_KEYS.settings, {}) };
  }

  saveSettings(settings) {
    this.write(STORAGE_KEYS.settings, settings);
  }

  // ---------------------------------------------------------- Partida guardada
  hasProgress() {
    return !!this.read(STORAGE_KEYS.progress, null);
  }

  loadProgress() {
    return this.read(STORAGE_KEYS.progress, null);
  }

  saveProgress(snapshot) {
    this.write(STORAGE_KEYS.progress, snapshot);
  }

  clearProgress() {
    this.remove(STORAGE_KEYS.progress);
  }

  // ---------------------------------------------------------- Finales
  getEndings() {
    return this.read(STORAGE_KEYS.endings, []);
  }

  unlockEnding(id) {
    const list = this.getEndings();
    if (!list.includes(id)) {
      list.push(id);
      this.write(STORAGE_KEYS.endings, list);
    }
  }

  /** Borra todo (récord, nivel, progreso, ajustes). */
  resetAll() {
    Object.values(STORAGE_KEYS).forEach((k) => this.remove(k));
  }
}
