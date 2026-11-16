// =====================================================================
//  GameScene.js — Escena principal: la habitación, el jugador, la criatura,
//  la linterna y toda la progresión de la historia.
//  Integra el trabajo de los cuatro módulos:
//    1) Player + CollisionManager  (movimiento, físicas)
//    2) Monster + Flashlight + SurvivalManager (terror y supervivencia)
//    3) InteractableObject + StoryManager + InventoryManager (historia)
//    4) UIScene + AudioManager + StorageManager (interfaz y persistencia)
// =====================================================================
import Phaser from 'phaser';
import {
  SCENES, GAME_WIDTH, GAME_HEIGHT, WORLD, DEPTH, GAME_STATES, FLASHLIGHT, SCORE, COLORS
} from '../config/constants.js';
import { PLAYER_START, DECOR } from '../config/levelLayout.js';
import { TEX } from '../assets/TextureFactory.js';
import { MUSIC, SFX } from '../audio/audioKeys.js';

import CollisionManager from '../physics/CollisionManager.js';
import Player from '../objects/Player.js';
import Monster from '../objects/Monster.js';
import Flashlight from '../objects/Flashlight.js';
import InteractableObject from '../objects/InteractableObject.js';
import DarknessLayer from '../objects/DarknessLayer.js';
import InteractionPrompt from '../ui/InteractionPrompt.js';

import ScoreManager from '../managers/ScoreManager.js';
import InventoryManager from '../managers/InventoryManager.js';
import StoryManager from '../managers/StoryManager.js';
import SurvivalManager from '../managers/SurvivalManager.js';
import InputManager from '../managers/InputManager.js';

const HOLD_SECONDS = 3.5; // tiempo manteniendo E para arrancar el generador
const MODAL_GRACE = 250; // ms tras cerrar un diálogo en los que no se puede reinteractuar

export default class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME);
  }

  init(data) {
    this.mode = data?.mode ?? 'new'; // 'new' | 'continue'
    this.ui = null;
    this.ended = false;
    this.pending = [];
    this.holdProgress = 0;
    this.flashAmount = 0;
    this.nextLightning = 18 + Math.random() * 14;
    this.ringTimer = 2.5;
    this.lowWarned = false;
    this.roomSmooth = 0;
    this.camX = 0;
    this.camY = 0;
  }

  // =================================================================
  //  CREACIÓN
  // =================================================================
  create() {
    this.storage = this.registry.get('storage');
    this.audio = this.registry.get('audio');
    this.stateMgr = this.registry.get('state');
    this.settings = this.storage.getSettings();
    this.highScore = this.storage.getHighScore();
    const storyData = this.cache.json.get('story');
    this.storyData = storyData;

    // ---- Managers de datos
    this.score = new ScoreManager();
    this.inventory = new InventoryManager();
    this.story = new StoryManager(storyData, this.inventory, this.score);
    this.story.on('levelUp', (lv, ch) => this.onLevelUp(lv, ch));

    // ---- Mundo
    this.add.image(0, 0, TEX.ROOM_BG).setOrigin(0, 0).setDepth(DEPTH.FLOOR);
    const w = DECOR.window;
    this.rain = this.add.tileSprite(w.x + w.w / 2, w.y + w.h / 2, w.w, w.h, TEX.RAIN).setDepth(DEPTH.DECOR).setAlpha(0.75);
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);

    this.collision = new CollisionManager(this);
    this.collision.buildWorld();
    this.triggers = this.collision.buildTriggerZones();
    this.generatorSprite = this.collision.furnitureSprites.generator;

    // ---- Objetos interactivos y pilas
    this.interactables = storyData.interactables.map((def) => new InteractableObject(this, def));
    this.batteries = this.physics.add.staticGroup();
    storyData.batteries.forEach((b, i) => this.createBattery(b.x, b.y, `battery_${i}`));

    // ---- Personaje, linterna, criatura
    this.player = new Player(this, PLAYER_START.x, PLAYER_START.y, this.audio);
    this.collision.collide(this.player);
    this.flashlight = new Flashlight(this.audio, this.collision);
    this.flashlight.setAngleImmediate(Math.PI / 2);
    this.monster = new Monster(this, this.audio, this.collision);
    this.collision.collide(this.monster);

    this.survival = new SurvivalManager({
      player: this.player,
      flashlight: this.flashlight,
      monster: this.monster,
      collision: this.collision,
      audio: this.audio,
      story: this.story,
      difficulty: this.settings.difficulty
    });
    this.survival.on('caught', (cause) => this.onCaught(cause));
    this.survival.on('monsterAwake', () => this.onMonsterAwake());
    this.survival.on('lightPhase', (p) => this.onLightPhase(p));
    this.survival.on('needBattery', () => this.spawnEmergencyBattery());
    this.flashlight.addListener('empty', () => this.ui?.hud.toast('¡La linterna se quedó sin batería!', { color: COLORS.DANGER }));

    // ---- Física: overlaps y triggers
    this.physics.add.overlap(this.player, this.batteries, (p, b) => this.collectBattery(b));
    this.physics.add.overlap(this.player, this.monster, () => this.survival.handleTouch());
    this.triggerFired = {};
    for (const zone of Object.values(this.triggers)) {
      this.physics.add.overlap(this.player, zone, () => this.onTrigger(zone.triggerId));
    }

    // ---- Iluminación, cámara, entrada
    this.darkness = new DarknessLayer(this);
    this.prompt = new InteractionPrompt(this);
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height).setRoundPixels(true);
    this.inputMgr = new InputManager(this, () => this.ui?.touch ?? null);

    // ---- Cargar partida guardada (si corresponde)
    const snap = this.mode === 'continue' ? this.storage.loadProgress() : null;
    if (snap) this.restoreFrom(snap);
    else {
      this.storage.clearProgress();
      this.mode = 'new';
    }
    this.snapCamera();

    // ---- Audio, estado y UI
    this.audio.playMusic(MUSIC.AMBIENT, 0.55);
    this.stateMgr.set(GAME_STATES.PLAYING);
    this.scene.launch(SCENES.UI);
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // Pausa automática si se oculta la pestaña
    this._onHidden = () => {
      if (this.ui && !this.ui.isModalOpen() && !this.ended) this.requestPause();
    };
    this.game.events.on(Phaser.Core.Events.HIDDEN, this._onHidden);

    this.events.once('shutdown', () => this.cleanup());
    if (new URLSearchParams(window.location.search).has('debug')) window.__nal = this;
  }

  createBattery(x, y, id) {
    const b = this.batteries.create(x, y, TEX.ITEM_BATTERY);
    b.setDepth(DEPTH.ITEM_FLOOR).refreshBody();
    b.batteryId = id;
    b.glint = this.add
      .image(x, y, TEX.GLOW_SOFT)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0x8dffb0)
      .setDepth(DEPTH.GLINT)
      .setScale(0.4)
      .setAlpha(0);
    b.phase = Math.random() * 6.28;
    return b;
  }

  /** La interfaz avisa de que está lista (se crea un frame después de GameScene). */
  onUIReady(ui) {
    this.ui = ui;
    if (this.mode === 'new' && !this.story.has('introShown')) {
      this.story.set('introShown');
      this.ui.showDialogue(this.storyData.intro);
    } else if (this.mode === 'continue') {
      this.ui.hud.toast('Partida restaurada desde el último capítulo.');
    }
    this.updateHud();
  }

  cleanup() {
    this.audio.stopAllLoops();
    this.inputMgr?.destroy();
    this.game.events.off(Phaser.Core.Events.HIDDEN, this._onHidden);
    if (this.genSound) this.genSound.stop();
  }

  // =================================================================
  //  GUARDADO / CARGA
  // =================================================================
  saveCheckpoint() {
    const p = this.player.body.center;
    this.storage.saveProgress({
      version: 1,
      story: this.story.snapshot(),
      inventory: this.inventory.snapshot(),
      score: this.score.snapshot(),
      flashlight: this.flashlight.snapshot(),
      player: { x: Math.round(p.x), y: Math.round(p.y) },
      savedAt: Date.now()
    });
  }

  restoreFrom(snap) {
    this.inventory.restore(snap.inventory);
    this.score.restore(snap.score);
    this.story.restore(snap.story);
    this.flashlight.restore(snap.flashlight);
    // Reintento tras morir: batería mínima para que sea justo.
    if (this.flashlight.owned) this.flashlight.battery = Math.max(this.flashlight.battery, 50);

    for (const o of this.interactables) if (this.story.isCollected(o.id)) o.hideSilently();
    this.batteries.getChildren().slice().forEach((b) => {
      if (this.story.isCollected(b.batteryId)) this.removeBattery(b);
    });
    if (this.story.has('generatorOn')) {
      this.generatorSprite.setTexture(TEX.GENERATOR_ON);
      this.survival.activateRoomLight();
    }
    if (snap.player) this.player.teleport(snap.player.x, snap.player.y);
    if (this.story.has('monsterAwake')) this.survival.awakenMonster();
    this.monster.level = this.story.level;
  }

  snapCamera() {
    const p = this.player.body.center;
    this.camX = Phaser.Math.Clamp(p.x - GAME_WIDTH / 2, 0, WORLD.width - GAME_WIDTH);
    this.camY = Phaser.Math.Clamp(p.y - GAME_HEIGHT / 2, 0, WORLD.height - GAME_HEIGHT);
    this.cameras.main.setScroll(this.camX, this.camY);
  }

  // =================================================================
  //  EVENTOS DE HISTORIA
  // =================================================================
  onLevelUp(level, chapter) {
    this.monster.level = level;
    // Se ejecuta cuando se cierra el diálogo actual (para no interrumpir la lectura).
    this.pending.push(() => {
      this.storage.submitLevel(level);
      this.ui?.hud.chapterCard(level, chapter.title);
      if (level >= 3 && !this.monster.isActive) this.survival.awakenMonster();
      if (level === 4) this.ui?.hud.toast('El teléfono del escritorio empieza a sonar…', { color: COLORS.SOFIA });
      if (level === 7) this.ui?.hud.toast('¡La luz volvió, pero parpadea! Cuando se apague, la sombra se moverá.', { color: COLORS.GOLD, duration: 5000 });
      this.saveCheckpoint();
    });
  }

  flushPending() {
    const tasks = this.pending;
    this.pending = [];
    tasks.forEach((t) => t());
  }

  onMonsterAwake() {
    this.lightning(true);
    this.ui?.hud.toast('Algo se mueve en la oscuridad… Ilumínalo con la linterna.', { color: COLORS.DANGER, duration: 4500 });
  }

  onLightPhase(phase) {
    if (phase === 'warn') this.audio.playSfx(SFX.GENERATOR_START, { volume: 0.25, rate: 1.6 });
    if (phase === 'off') this.ui?.hud.toast('¡Se fue la luz! Usa la linterna.', { color: COLORS.DANGER, duration: 2500 });
    if (phase === 'on') this.ui?.hud.toast('La luz volvió.', { color: COLORS.GOLD, duration: 1500 });
  }

  onTrigger(id) {
    if (this.triggerFired[id]) return;
    this.triggerFired[id] = true; // se dispara una sola vez
    if (id === 'window') {
      this.lightning(true);
      this.ui?.hud.toast('Un relámpago ilumina la ventana. La tormenta no cesa.', { duration: 2800 });
    } else if (id === 'door') {
      if (!this.story.has('generatorOn')) this.ui?.hud.toast('La puerta tiene un cerrojo eléctrico. No hay corriente.', { duration: 3200 });
    } else if (id === 'generator') {
      if (!this.story.has('hasKey') && !this.story.has('generatorOn')) this.ui?.hud.toast('Un generador de emergencia… está cerrado con candado.', { duration: 3200 });
    }
  }

  // =================================================================
  //  PILAS
  // =================================================================
  collectBattery(b) {
    if (!b.active || this.ended) return;
    if (this.flashlight.owned && this.flashlight.battery >= 99) return; // no desperdiciar
    this.flashlight.addBattery(FLASHLIGHT.BATTERY_PICKUP);
    this.lowWarned = false;
    this.score.add(SCORE.battery, 'Pila');
    this.story.markCollected(b.batteryId);
    this.audio.playSfx(SFX.BATTERY, { volume: 0.9 });
    this.ui?.hud.toast(`+${FLASHLIGHT.BATTERY_PICKUP}% de batería`, { color: COLORS.OK, duration: 1400 });
    this.removeBattery(b);
  }

  removeBattery(b) {
    b.glint?.destroy();
    b.destroy();
  }

  /** Reserva: si te quedas sin batería ni pilas, aparece una pila cerca. */
  spawnEmergencyBattery() {
    if (this.batteries.countActive() > 0) return;
    const p = this.player.body.center;
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(120, WORLD.width - 120);
      const y = Phaser.Math.Between(180, WORLD.height - 120);
      const d = Phaser.Math.Distance.Between(x, y, p.x, p.y);
      if (d < 180 || d > 420) continue;
      if (this.collision.nav.isBlockedPx(x, y)) continue;
      this.createBattery(x, y, `battery_extra_${Date.now()}`);
      this.ui?.hud.toast('Una pila brilla entre las sombras…', { color: COLORS.OK });
      return;
    }
  }

  // =================================================================
  //  INTERACCIÓN
  // =================================================================
  updateInteraction(dt, time) {
    const feet = this.player.body.center;
    const sinceModal = time - (this.ui?.lastModalClose ?? 0);

    // 1) ¿Está la criatura iluminada y al alcance? (final secreto / observarla)
    if (this.monster.isActive && this.monster.lit && this.monster.state !== 'spawning') {
      const m = this.monster.body.center;
      if (Phaser.Math.Distance.Between(feet.x, feet.y, m.x, m.y) < 100) {
        const secret = this.story.canTriggerSecret();
        this.prompt.show(this.monster.x, this.monster.y - 100, secret ? 'Enfrentar a la sombra' : 'Observar a la sombra', this.keyLabel());
        if (this.inputMgr.interactJust && sinceModal > MODAL_GRACE) this.interactWithMonster();
        this.holdProgress = 0;
        return;
      }
    }

    // 2) Objeto interactivo más cercano
    let nearest = null;
    let best = Infinity;
    for (const o of this.interactables) {
      if (!o.available) continue;
      const d = o.distanceTo(feet.x, feet.y);
      if (d <= o.radius && d < best) {
        best = d;
        nearest = o;
      }
    }
    if (!nearest) {
      this.prompt.hide();
      this.releaseHold();
      return;
    }

    const mode = this.story.getInteractionMode(nearest.def);
    const label = this.story.getPrompt(nearest.def);
    const py = nearest.def.texture ? nearest.y - 34 : nearest.y - 20;

    if (mode === 'hold') {
      // Generador: hay que mantener pulsado E.
      if (this.inputMgr.interactHeld && sinceModal > MODAL_GRACE) {
        if (this.holdProgress === 0) this.genSound = this.audio.playSfx(SFX.GENERATOR_START, { volume: 0.9 });
        this.holdProgress += dt / HOLD_SECONDS;
        if (this.holdProgress >= 1) {
          this.holdProgress = 0;
          this.completeGenerator();
          return;
        }
      } else this.releaseHold();
      this.prompt.show(nearest.x, py, label, this.keyLabel(), this.holdProgress);
    } else {
      this.releaseHold();
      this.prompt.show(nearest.x, py, label, this.keyLabel());
      if (this.inputMgr.interactJust && sinceModal > MODAL_GRACE) this.performInteraction(nearest);
    }
  }

  keyLabel() {
    return this.ui?.touch?.visible ? 'ACTUAR' : 'E';
  }

  releaseHold() {
    if (this.holdProgress > 0 && this.genSound) {
      this.genSound.stop();
      this.genSound = null;
    }
    this.holdProgress = 0;
  }

  performInteraction(obj) {
    const res = this.story.interact(obj.def);
    if (res.sfx) this.audio.playSfx(res.sfx);
    if (res.flashlight) this.flashlight.pickUp();
    if (res.consume) {
      obj.collect();
      this.story.markCollected(obj.id);
    }
    this.ui.showDialogue(res.lines, () => {
      if (res.keypad) this.openKeypad();
      if (res.ending) this.startEnding(res.ending);
      this.flushPending();
    });
  }

  openKeypad() {
    this.ui.showKeypad({
      onSubmit: (values) => this.story.submitCombination(values),
      onSolved: (res) => {
        this.ui.showDialogue(res.lines, () => this.flushPending());
      },
      onClose: () => this.flushPending()
    });
  }

  completeGenerator() {
    const res = this.story.completeGenerator();
    this.generatorSprite.setTexture(TEX.GENERATOR_ON);
    this.survival.activateRoomLight();
    this.lightning(false);
    this.prompt.hide();
    this.ui.showDialogue(res.lines, () => this.flushPending());
  }

  interactWithMonster() {
    const res = this.story.interactMonster();
    if (res.ending) {
      this.ui.showDialogue([{ speaker: 'Mateo', text: '…Sofía.' }], () => this.startEnding(res.ending));
    } else {
      this.ui.showDialogue(res.lines);
    }
  }

  openInventory() {
    if (!this.ui || this.ui.isModalOpen() || this.ended) return;
    this.ui.showInventory(this.inventory.list());
  }

  // =================================================================
  //  FINALES
  // =================================================================
  onCaught(cause) {
    if (this.ended) return;
    this.ended = true;
    this.player.halt();
    this.monster.setVelocity(0, 0);
    this.releaseHold();
    this.audio.stopAllLoops();
    this.audio.stopMusic();
    this.audio.playSfx(SFX.JUMPSCARE, { volume: 1 });
    this.prompt.hide();
    this.ui?.closeAllModals();
    this.stateMgr.set(GAME_STATES.DEFEAT);
    if (!this.settings.reduceEffects) this.cameras.main.shake(500, 0.02);
    this.cameras.main.flash(250, 255, 40, 40);
    this.time.delayedCall(1100, () => {
      this.scene.stop(SCENES.UI);
      this.scene.start(SCENES.GAME_OVER, {
        cause,
        score: this.score.score,
        level: this.story.level
      });
    });
  }

  startEnding(ending) {
    if (this.ended) return;
    this.ended = true;
    this.releaseHold();
    this.story.finish(ending);
    this.storage.unlockEnding(ending);
    this.storage.submitLevel(7);
    this.storage.clearProgress(); // partida completada
    this.audio.stopAllLoops();
    this.stateMgr.set(GAME_STATES.VICTORY);
    const data = {
      ending,
      score: this.score.score,
      photos: this.inventory.count('photo'),
      notes: this.inventory.count('note')
    };
    this.cameras.main.fadeOut(900, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop(SCENES.UI);
      this.scene.start(SCENES.ENDING, data);
    });
  }

  // =================================================================
  //  PAUSA
  // =================================================================
  requestPause() {
    if (this.ended || !this.ui || this.scene.isPaused()) return;
    if (!this.stateMgr.set(GAME_STATES.PAUSED)) return;
    this.audio.pauseAll();
    this.scene.pause();
    this.scene.pause(SCENES.UI);
    this.scene.launch(SCENES.PAUSE);
  }

  // =================================================================
  //  EFECTOS AMBIENTALES
  // =================================================================
  /** Relámpago: la habitación se ilumina un instante y suena un trueno. */
  lightning(thunder = true) {
    if (!this.settings.reduceEffects) {
      this.tweens.killTweensOf(this);
      this.flashAmount = 1;
      this.tweens.add({
        targets: this,
        flashAmount: { from: 1, to: 0 },
        duration: 600,
        ease: 'Cubic.easeOut'
      });
      this.time.delayedCall(140, () => {
        this.flashAmount = 0.8;
        this.tweens.add({ targets: this, flashAmount: 0, duration: 450 });
      });
    }
    if (thunder) this.time.delayedCall(350 + Math.random() * 700, () => this.audio.playSfx(SFX.THUNDER, { volume: 0.9 }));
  }

  updateAmbient(dt, time) {
    // lluvia en la ventana
    this.rain.tilePositionY -= 220 * dt;
    this.rain.tilePositionX += 30 * dt;

    // relámpagos aleatorios
    this.nextLightning -= dt;
    if (this.nextLightning <= 0) {
      this.nextLightning = 22 + Math.random() * 26;
      this.lightning(true);
    }

    // el teléfono suena hasta que se contesta la llamada
    if (this.story.has('boxOpened') && !this.story.has('callAnswered')) {
      this.ringTimer -= dt;
      if (this.ringTimer <= 0) {
        this.ringTimer = 7;
        this.audio.playSfx(SFX.PHONE_RING, { volume: 0.7 });
      }
    }

    // brillos de objetos y pilas
    const p = this.player.body.center;
    for (const o of this.interactables) o.updateGlint(time, p.x, p.y);
    for (const b of this.batteries.getChildren()) {
      if (!b.glint) continue;
      const d = Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y);
      b.glint.setAlpha(d < 240 ? (1 - d / 240) * 0.6 * (0.6 + 0.4 * Math.sin(time * 0.005 + b.phase)) : 0);
    }

    // aviso de batería baja
    if (this.flashlight.owned && this.flashlight.isLow && !this.lowWarned) {
      this.lowWarned = true;
      this.ui?.hud.toast('Batería baja: busca pilas (brillan en verde).', { color: COLORS.GOLD });
    }
  }

  // =================================================================
  //  RENDER: cámara + oscuridad + HUD
  // =================================================================
  updateCamera(dt) {
    const p = this.player.body.center;
    const tx = Phaser.Math.Clamp(p.x - GAME_WIDTH / 2, 0, WORLD.width - GAME_WIDTH);
    const ty = Phaser.Math.Clamp(p.y - GAME_HEIGHT / 2, 0, WORLD.height - GAME_HEIGHT);
    const k = Math.min(1, dt * 9);
    this.camX += (tx - this.camX) * k;
    this.camY += (ty - this.camY) * k;
    this.cameras.main.setScroll(Math.round(this.camX), Math.round(this.camY));
  }

  renderDarkness(dt) {
    // Suavizado de la luz de la habitación (parpadea rápido si está en "warn")
    const target = this.survival.roomLightLevel;
    this.roomSmooth += (target - this.roomSmooth) * Math.min(1, dt * 14);
    let alpha = Phaser.Math.Linear(0.95, 0.3, this.roomSmooth);
    alpha = Math.max(0.05, alpha - this.flashAmount * 0.55);

    const sx = Math.round(this.camX);
    const sy = Math.round(this.camY);
    const lo = this.player.lightOrigin;
    const fl = this.flashlight;
    const halos = [{ x: lo.x - sx, y: lo.y - sy, radius: fl.emitting ? 125 : 96, strength: 0.95 }];
    const cone = fl.emitting ? { x: lo.x - sx, y: lo.y - sy, angle: fl.angle, range: FLASHLIGHT.RANGE, intensity: 1 } : null;
    this.darkness.render(alpha, halos, cone);
  }

  updateHud() {
    if (!this.ui) return;
    const f = this.flashlight;
    const s = this.story;
    const dist = this.survival.monsterDistance;
    let danger = Number.isFinite(dist) ? Phaser.Math.Clamp((250 - dist) / 250, 0, 1) : 0;
    if (this.monster.lit) danger *= 0.35;
    this.ui.setHudState({
      owned: f.owned,
      battery: Math.round(f.battery * 10) / 10,
      on: f.on,
      low: f.isLow || (f.owned && f.battery <= 0),
      score: this.score.score,
      high: this.highScore,
      level: s.level,
      chapterTitle: s.getChapter().title,
      objective: s.getObjective(),
      photos: this.inventory.count('photo'),
      notes: this.inventory.count('note'),
      tape: this.inventory.has('tape'),
      key: this.inventory.has('key'),
      danger: Math.round(danger * 100) / 100
    });
  }

  // =================================================================
  //  BUCLE PRINCIPAL
  // =================================================================
  update(time, delta) {
    if (!this.ui || this.ended) return;
    const dt = Math.min(delta, 50) / 1000;
    const im = this.inputMgr;
    im.update();

    if (im.muteJust) this.audio.toggleMute();
    if (im.fpsJust) this.ui.toggleFps();
    if (im.navJust) this.collision.toggleDebug();

    const modal = this.ui.isModalOpen();
    const sinceModal = time - this.ui.lastModalClose;
    if (!modal && sinceModal > MODAL_GRACE) {
      if (im.pauseJust) {
        this.requestPause();
        return;
      }
      if (im.invJust) this.openInventory();
    }

    // Mientras se lee un diálogo, la caja de código o la mochila, el tiempo del mundo se detiene.
    if (modal) {
      this.stateMgr.set(GAME_STATES.DIALOGUE);
      this.player.halt();
      this.prompt.hide();
      this.releaseHold();
      this.updateCamera(dt);
      this.renderDarkness(dt);
      this.updateHud();
      return;
    }
    this.stateMgr.set(GAME_STATES.PLAYING);

    // --- Movimiento y linterna
    this.player.moveWith(im.move, dt);
    if (im.flashJust) this.flashlight.toggle();
    const aim = im.getAimAngle(this.player.lightOrigin, this.flashlight.angle, this.cameras.main, this.player.lastMoveAngle);
    this.flashlight.turnToward(aim);

    // --- Supervivencia (batería, criatura, luz del generador)
    this.survival.update(dt);
    if (this.ended) return;

    // --- Interacción, ambiente, render
    this.updateInteraction(dt, time);
    this.updateAmbient(dt, time);
    this.updateCamera(dt);
    this.renderDarkness(dt);
    this.updateHud();
  }
}
