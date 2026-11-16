// =====================================================================
//  SettingsScene.js — Configuración: volúmenes, mute, dificultad,
//  controles táctiles, reducción de efectos, pantalla completa y reset.
//  Todo se guarda en localStorage (StorageManager).
// =====================================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, EVENTS } from '../config/constants.js';
import Button, { ButtonList } from '../ui/Button.js';
import { makeText, drawPanel, FONT_TITLE } from '../ui/UIHelpers.js';

const DIFFICULTY = [['easy', 'Fácil'], ['normal', 'Normal'], ['hard', 'Difícil']];
const TOUCH = [['auto', 'Automático'], ['on', 'Siempre visibles'], ['off', 'Ocultos']];

export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super(SCENES.SETTINGS);
  }

  create() {
    this.storage = this.registry.get('storage');
    this.audio = this.registry.get('audio');
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x07050c).setOrigin(0, 0);
    drawPanel(this.add.graphics(), 24, 16, GAME_WIDTH - 48, GAME_HEIGHT - 32, { alpha: 0.95, radius: 14 });
    makeText(this, GAME_WIDTH / 2, 40, 'CONFIGURACIÓN', { size: 30, font: FONT_TITLE, style: 'bold', color: '#ffe9a0', originX: 0.5, originY: 0.5, strokeThickness: 4 });

    this.confirmReset = false;
    this.rows = {};
    const X_LABEL = 70;
    const X_CTRL = 700;
    let y = 90;
    const STEP = 48;

    // -- Volumen de música
    this.label(X_LABEL, y, 'Volumen de la música');
    this.volume('musicVolume', y, X_CTRL, (v) => this.audio.setMusicVolume(v));
    y += STEP;
    // -- Volumen de efectos
    this.label(X_LABEL, y, 'Volumen de efectos');
    this.volume('sfxVolume', y, X_CTRL, (v) => {
      this.audio.setSfxVolume(v);
      this.audio.playSfx('sfx_pickup', { volume: 0.7 });
    });
    y += STEP;
    // -- Silencio
    this.label(X_LABEL, y, 'Sonido');
    this.muteBtn = new Button(this, X_CTRL, y, '', () => this.audio.toggleMute(), { width: 220, height: 36, size: 16 });
    y += STEP;
    // -- Dificultad
    this.label(X_LABEL, y, 'Dificultad (velocidad de la criatura)');
    this.diffBtn = new Button(this, X_CTRL, y, '', () => this.cycle('difficulty', DIFFICULTY, this.diffBtn), { width: 220, height: 36, size: 16 });
    y += STEP;
    // -- Táctil
    this.label(X_LABEL, y, 'Controles táctiles');
    this.touchBtn = new Button(this, X_CTRL, y, '', () => this.cycle('touchMode', TOUCH, this.touchBtn), { width: 220, height: 36, size: 16 });
    y += STEP;
    // -- Reducir efectos
    this.label(X_LABEL, y, 'Reducir efectos (sin destellos ni sacudidas)');
    this.fxBtn = new Button(this, X_CTRL, y, '', () => this.toggle('reduceEffects'), { width: 220, height: 36, size: 16 });
    y += STEP;
    // -- Pantalla completa
    this.label(X_LABEL, y, 'Pantalla completa');
    this.fsBtn = new Button(this, X_CTRL, y, 'Activar / desactivar', () => (this.scale.isFullscreen ? this.scale.stopFullscreen() : this.scale.startFullscreen()), { width: 220, height: 36, size: 16 });
    y += STEP;
    // -- Borrar datos
    this.label(X_LABEL, y, 'Borrar récord, progreso y ajustes');
    this.resetBtn = new Button(this, X_CTRL, y, 'Borrar datos', () => this.reset(), { width: 220, height: 36, size: 16 });

    const back = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 38, 'VOLVER AL MENÚ', () => this.scene.start(SCENES.MENU), { width: 260, height: 40, size: 18 });
    this.list = new ButtonList(this, [this.muteBtn, this.diffBtn, this.touchBtn, this.fxBtn, this.fsBtn, this.resetBtn, back]);

    this.refresh();
    this._onMute = () => this.refresh();
    this.game.events.on(EVENTS.MUTE_CHANGED, this._onMute);
    this.events.once('shutdown', () => this.game.events.off(EVENTS.MUTE_CHANGED, this._onMute));
    this.input.keyboard.on('keydown-ESC', () => this.scene.start(SCENES.MENU));
  }

  label(x, y, text) {
    makeText(this, x, y, text, { size: 16, originY: 0.5, color: '#e6dcf2' });
  }

  /** Control de volumen con botones − y +. */
  volume(key, y, xCenter, onChange) {
    const val = makeText(this, xCenter, y, '', { size: 18, style: 'bold', originX: 0.5, originY: 0.5, color: '#fff1c4' });
    const minus = new Button(this, xCenter - 90, y, '−', () => change(-0.1), { width: 44, height: 36, size: 22 });
    const plus = new Button(this, xCenter + 90, y, '+', () => change(0.1), { width: 44, height: 36, size: 22 });
    const change = (d) => {
      const v = Math.round(Phaser.Math.Clamp(this.storage.getSettings()[key] + d, 0, 1) * 10) / 10;
      onChange(v);
      this.refresh();
    };
    this.rows[key] = val;
    return [minus, plus];
  }

  setSetting(key, value) {
    const s = this.storage.getSettings();
    s[key] = value;
    this.storage.saveSettings(s);
    this.audio.refreshSettings();
    this.game.events.emit(EVENTS.SETTINGS_CHANGED, s);
  }

  cycle(key, options, btn) {
    const s = this.storage.getSettings();
    const i = options.findIndex(([k]) => k === s[key]);
    this.setSetting(key, options[(i + 1) % options.length][0]);
    this.refresh();
  }

  toggle(key) {
    this.setSetting(key, !this.storage.getSettings()[key]);
    this.refresh();
  }

  reset() {
    if (!this.confirmReset) {
      this.confirmReset = true;
      this.resetBtn.setLabel('¿Seguro? Pulsa de nuevo');
      this.time.delayedCall(3000, () => {
        this.confirmReset = false;
        this.resetBtn.setLabel('Borrar datos');
      });
      return;
    }
    this.storage.resetAll();
    this.audio.setMuted(false);
    this.audio.refreshSettings();
    this.confirmReset = false;
    this.resetBtn.setLabel('Datos borrados');
    this.refresh();
  }

  refresh() {
    const s = this.storage.getSettings();
    this.rows.musicVolume.setText(`${Math.round(s.musicVolume * 100)}%`);
    this.rows.sfxVolume.setText(`${Math.round(s.sfxVolume * 100)}%`);
    this.muteBtn.setLabel(this.audio.isMuted() ? 'Silenciado (activar)' : 'Activado (silenciar)');
    this.diffBtn.setLabel(DIFFICULTY.find(([k]) => k === s.difficulty)[1]);
    this.touchBtn.setLabel(TOUCH.find(([k]) => k === s.touchMode)[1]);
    this.fxBtn.setLabel(s.reduceEffects ? 'Sí (reducidos)' : 'No');
  }
}
