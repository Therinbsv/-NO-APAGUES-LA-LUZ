// =====================================================================
//  Coordina Flashlight + Monster + luz de la habitación:
//   · despierta a la criatura (por historia o por tiempo),
//   · decide si está iluminada (linterna o luz del generador),
//   · detecta el contacto → derrota,
//   · tras arrancar el generador, hace que la luz parpadee por ciclos
//     (cuando se apaga, la criatura vuelve a moverse).
// =====================================================================
import Phaser from 'phaser';
import { MONSTER } from '../config/constants.js';
import { MONSTER_SPAWNS } from '../config/levelLayout.js';
import { SFX } from '../audio/audioKeys.js';

// Ciclo de la luz de la habitación una vez arrancado el generador (segundos).
const LIGHT_CYCLE = { on: 14, warn: 1.3, off: 3.6 };

export default class SurvivalManager extends Phaser.Events.EventEmitter {
  constructor({ player, flashlight, monster, collision, audio, story, difficulty = 'normal' }) {
    super();
    this.player = player;
    this.flashlight = flashlight;
    this.monster = monster;
    this.collision = collision;
    this.audio = audio;
    this.story = story;

    this.caught = false;
    this.awakenTimer = 0;
    this.emptyTimer = 0;

    // Luz de la habitación (generador)
    this.roomLit = false;
    this.lightPhase = 'on';
    this.lightTimer = 0;

    monster.speedMultiplier = MONSTER.DIFFICULTY[difficulty] ?? 1;
  }

  /** Nivel de luz de la habitación para dibujar (0 = oscuro, 1 = encendido). */
  get roomLightLevel() {
    if (!this.roomLit) return 0;
    if (this.lightPhase === 'on') return 1;
    if (this.lightPhase === 'warn') return Math.random() < 0.5 ? 1 : 0.15;
    return 0;
  }

  /** ¿La luz de la habitación está protegiendo al jugador ahora mismo? */
  get roomProtects() {
    return this.roomLit && this.lightPhase !== 'off';
  }

  // criatura
  /** Despierta a la criatura en el punto de aparición más lejano al jugador. */
  awakenMonster() {
    if (this.monster.isActive) return;
    const p = this.player.body.center;
    let best = MONSTER_SPAWNS[0];
    let bestD = -1;
    for (const s of MONSTER_SPAWNS) {
      const d = Phaser.Math.Distance.Between(p.x, p.y, s.x, s.y);
      if (d > bestD) {
        bestD = d;
        best = s;
      }
    }
    this.monster.level = this.story.level;
    this.monster.awaken(best.x, best.y);
    this.story.set('monsterAwake');
    this.emit('monsterAwake');
  }

  /** Devuelve a la criatura a su lugar de aparición y la duerme (reintento). */
  resetMonster() {
    this.caught = false;
    this.monster.sleep();
    if (this.story.has('monsterAwake')) this.awakenMonster();
  }

  //  luz de la habitación
  activateRoomLight() {
    this.roomLit = true;
    this.lightPhase = 'on';
    this.lightTimer = 0;
    this.audio.startLoop(SFX.GENERATOR_HUM, 0.35);
  }

  updateRoomLight(dt) {
    if (!this.roomLit) return;
    this.lightTimer += dt;
    const prev = this.lightPhase;
    if (this.lightPhase === 'on' && this.lightTimer >= LIGHT_CYCLE.on) this.lightPhase = 'warn';
    else if (this.lightPhase === 'warn' && this.lightTimer >= LIGHT_CYCLE.on + LIGHT_CYCLE.warn) this.lightPhase = 'off';
    else if (this.lightPhase === 'off' && this.lightTimer >= LIGHT_CYCLE.on + LIGHT_CYCLE.warn + LIGHT_CYCLE.off) {
      this.lightPhase = 'on';
      this.lightTimer = 0;
    }
    if (prev !== this.lightPhase) this.emit('lightPhase', this.lightPhase);
  }

  // contacto
  /** Llamado por el overlap jugador–criatura de Arcade Physics. */
  handleTouch() {
    if (this.caught || !this.monster.isActive) return;
    if (this.monster.lit || this.monster.state === 'spawning') return; // la luz protege
    this.triggerCaught();
  }

  triggerCaught() {
    if (this.caught) return;
    this.caught = true;
    this.emit('caught', this.flashlight.battery <= 0 ? 'batteryOut' : 'caught');
  }

  // ------------------------------------------------------------ bucle principal
  update(dt) {
    const { flashlight, monster, player } = this;
    flashlight.update(dt);
    this.updateRoomLight(dt);

    // Despertar automático por tiempo si el jugador ya tiene la linterna
    if (!monster.isActive && flashlight.owned && !this.story.has('monsterAwake')) {
      this.awakenTimer += dt;
      if (this.awakenTimer >= MONSTER.AUTO_AWAKEN_SECONDS) this.awakenMonster();
    }

    // Reserva de pilas: si no queda batería ni pilas en el mapa, se genera una.
    if (flashlight.owned && flashlight.battery <= 0) {
      this.emptyTimer += dt;
      if (this.emptyTimer > 8) {
        this.emptyTimer = 0;
        this.emit('needBattery');
      }
    } else this.emptyTimer = 0;

    if (!monster.isActive) {
      return;
    }

    const me = player.body.center;
    const m = monster.body.center;
    const litByFlash = flashlight.isPointLit(player.lightOrigin, m.x, m.y, 20);
    monster.updateAI(dt, me, litByFlash || this.roomProtects);

    // Contacto por distancia (además del overlap de física, para ser justos y consistentes)
    const dist = Phaser.Math.Distance.Between(me.x, me.y, m.x, m.y);
    if (dist < MONSTER.CATCH_DISTANCE) this.handleTouch();
  }

  /** Distancia a la criatura (para efectos visuales de la interfaz). */
  get monsterDistance() {
    if (!this.monster.isActive) return Infinity;
    const me = this.player.body.center;
    const m = this.monster.body.center;
    return Phaser.Math.Distance.Between(me.x, me.y, m.x, m.y);
  }
}
