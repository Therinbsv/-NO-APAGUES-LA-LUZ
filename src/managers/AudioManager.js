// =====================================================================
//  AudioManager.js — Música, efectos, bucles y botón de mute.
//  Responsable: Integrante 4.
//
//  Se crea una sola vez (BootScene) y se comparte por el registro del juego.
//  El mute se guarda en localStorage (clave audioMuted).
// =====================================================================
import { EVENTS } from '../config/constants.js';

export default class AudioManager {
  constructor(game, storage) {
    this.game = game;
    this.storage = storage;
    this.settings = storage.getSettings();
    this.muted = storage.isAudioMuted();
    this.music = null;
    this.musicKey = null;
    this.loops = {};
    game.sound.mute = this.muted;
  }

  // ----------------------------------------------------------- Mute
  isMuted() {
    return this.muted;
  }

  setMuted(muted) {
    this.muted = !!muted;
    this.game.sound.mute = this.muted;
    this.storage.setAudioMuted(this.muted);
    this.game.events.emit(EVENTS.MUTE_CHANGED, this.muted);
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // ----------------------------------------------------------- Volúmenes
  setMusicVolume(v) {
    this.settings.musicVolume = Math.min(1, Math.max(0, v));
    this.storage.saveSettings(this.settings);
    if (this.music) this.music.setVolume(this.settings.musicVolume * this.musicGain);
  }

  setSfxVolume(v) {
    this.settings.sfxVolume = Math.min(1, Math.max(0, v));
    this.storage.saveSettings(this.settings);
  }

  /** Recarga los ajustes (p. ej. tras cambiarlos en la pantalla de configuración). */
  refreshSettings() {
    this.settings = this.storage.getSettings();
    if (this.music) this.music.setVolume(this.settings.musicVolume * this.musicGain);
  }

  // ----------------------------------------------------------- Música
  /**
   * Reproduce una música en bucle. Si ya suena esa misma, no hace nada.
   * @param {string} key clave del audio cargado
   * @param {number} gain factor extra de volumen (0-1)
   */
  playMusic(key, gain = 1) {
    if (this.musicKey === key && this.music && this.music.isPlaying) return;
    this.stopMusic();
    if (!this.game.cache.audio.exists(key)) return;
    this.musicKey = key;
    this.musicGain = gain;
    this.music = this.game.sound.add(key, { loop: true, volume: this.settings.musicVolume * gain });
    this.music.play();
  }

  stopMusic() {
    if (this.music) {
      this.music.stop();
      this.music.destroy();
    }
    this.music = null;
    this.musicKey = null;
  }

  // ----------------------------------------------------------- Efectos
  /** Efecto de sonido puntual. */
  playSfx(key, { volume = 1, rate = 1 } = {}) {
    if (!this.game.cache.audio.exists(key)) return null;
    return this.game.sound.play(key, { volume: volume * this.settings.sfxVolume, rate });
  }

  // ----------------------------------------------------------- Bucles (latido, generador…)
  startLoop(key, volume = 0.5) {
    if (this.loops[key]) return this.loops[key];
    if (!this.game.cache.audio.exists(key)) return null;
    const s = this.game.sound.add(key, { loop: true, volume: volume * this.settings.sfxVolume });
    s.play();
    this.loops[key] = { sound: s, base: volume };
    return this.loops[key];
  }

  setLoopVolume(key, volume) {
    const l = this.loops[key];
    if (l) {
      l.base = volume;
      l.sound.setVolume(volume * this.settings.sfxVolume);
    }
  }

  stopLoop(key) {
    const l = this.loops[key];
    if (l) {
      l.sound.stop();
      l.sound.destroy();
      delete this.loops[key];
    }
  }

  stopAllLoops() {
    Object.keys(this.loops).forEach((k) => this.stopLoop(k));
  }

  // ----------------------------------------------------------- Pausa
  pauseAll() {
    this.game.sound.pauseAll();
  }

  resumeAll() {
    this.game.sound.resumeAll();
  }
}
