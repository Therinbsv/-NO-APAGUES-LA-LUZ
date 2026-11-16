// =====================================================================
//  Monster.js — La Sombra (enemigo con IA básica).
//  Responsable: Integrante 2.
//
//  Estados:
//    dormant    → todavía no despertó (invisible, sin cuerpo físico).
//    spawning   → acaba de aparecer; se queda quieta unos instantes.
//    chasing    → persigue al jugador con A* (rodea los muebles).
//    frozen     → está iluminada: se detiene y chilla.
//    retreating → tras mucho tiempo bajo la luz, retrocede un momento.
//  Sus ojos rojos se dibujan POR ENCIMA de la oscuridad: así el jugador
//  sabe que algo se acerca aunque no pueda verla.
// =====================================================================
import Phaser from 'phaser';
import { MONSTER, DEPTH } from '../config/constants.js';
import { TEX } from '../assets/TextureFactory.js';
import { SFX } from '../audio/audioKeys.js';

export default class Monster extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, audio, collision) {
    super(scene, -200, -200, TEX.MONSTER, 'm0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.audio = audio;
    this.collision = collision;

    this.setOrigin(0.5, 0.92);
    this.body.setSize(26, 16).setOffset(19, 66);
    this.state = 'dormant';
    this.body.enable = false;
    this.setVisible(false);

    this.path = [];
    this.repathTimer = 0;
    this.litTime = 0;
    this.retreatTimer = 0;
    this.spawnTimer = 0;
    this.hissCooldown = 0;
    this.growlTimer = 4;
    this.speedMultiplier = 1;
    this.level = 3;
    this.lit = false;

    this.eyes = scene.add.image(0, 0, TEX.GLOW_EYE).setDepth(DEPTH.EYES).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.play('monster-idle');
  }

  get isActive() {
    return this.state !== 'dormant';
  }

  get feet() {
    return this.body.center;
  }

  /** Despierta a la criatura en (x, y). */
  awaken(x, y) {
    this.setPosition(x, y);
    this.body.enable = true;
    this.body.reset(x, y);
    this.state = 'spawning';
    this.spawnTimer = MONSTER.SPAWN_GRACE;
    this.setVisible(true);
    this.eyes.setVisible(true);
    this.setAlpha(0);
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 1100 });
    this.audio.playSfx(SFX.GROWL, { volume: 0.9 });
  }

  /** Devuelve a la criatura al estado dormido (reintentos). */
  sleep() {
    this.state = 'dormant';
    this.body.enable = false;
    this.setVisible(false);
    this.eyes.setVisible(false);
    this.path = [];
    this.lit = false;
  }

  currentSpeed() {
    const base = MONSTER.BASE_SPEED + MONSTER.SPEED_PER_LEVEL * Math.max(0, this.level - 3);
    return base * this.speedMultiplier;
  }

  /**
   * Actualiza la IA. dt en segundos.
   * @param {{x:number,y:number}} target posición de los pies del jugador
   * @param {boolean} lit ¿la ilumina la linterna o la luz de la habitación?
   */
  updateAI(dt, target, lit) {
    if (this.state === 'dormant') return;
    this.lit = lit;
    this.hissCooldown -= dt;
    const me = this.body.center;
    const dist = Phaser.Math.Distance.Between(me.x, me.y, target.x, target.y);

    // --- Estado de aparición: se queda quieta un momento.
    if (this.state === 'spawning') {
      this.setVelocity(0, 0);
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) this.state = 'chasing';
    }
    // --- Retroceso (la luz la repele)
    else if (this.retreatTimer > 0) {
      this.retreatTimer -= dt;
      this.state = 'retreating';
      const ang = Math.atan2(me.y - target.y, me.x - target.x);
      this.setVelocity(Math.cos(ang) * MONSTER.RETREAT_SPEED, Math.sin(ang) * MONSTER.RETREAT_SPEED);
      if (this.retreatTimer <= 0) this.state = 'chasing';
    }
    // --- Iluminada: se detiene
    else if (lit) {
      if (this.state !== 'frozen') {
        this.state = 'frozen';
        if (this.hissCooldown <= 0) {
          this.audio.playSfx(SFX.HISS, { volume: 0.8 });
          this.hissCooldown = 2.5;
        }
      }
      this.setVelocity(0, 0);
      this.litTime += dt;
      if (this.litTime > MONSTER.RETREAT_AFTER) {
        this.litTime = 0;
        this.retreatTimer = MONSTER.RETREAT_TIME;
      }
    }
    // --- Persecución
    else {
      this.state = 'chasing';
      this.litTime = Math.max(0, this.litTime - dt * 2);
      this.chase(dt, me, target, dist);
    }

    // Temblor visual cuando está bajo la luz
    this.setOrigin(0.5 + (this.state === 'frozen' ? (Math.random() - 0.5) * 0.04 : 0), 0.92);
    this.setDepth(this.y);
    this.updateEyes(dist);

    // Gruñidos ocasionales cuando está cerca
    this.growlTimer -= dt;
    if (this.growlTimer <= 0) {
      this.growlTimer = 7 + Math.random() * 6;
      if (dist < 450 && this.state === 'chasing') this.audio.playSfx(SFX.GROWL, { volume: 0.5 });
    }
  }

  /** Persigue con A* y velocidad con "rubber band": acelera si está muy lejos. */
  chase(dt, me, target, dist) {
    this.repathTimer -= dt * 1000;
    if (this.repathTimer <= 0) {
      this.repathTimer = MONSTER.REPATH_MS;
      this.path = this.collision.nav.findPath(me.x, me.y, target.x, target.y);
    }
    // descarta waypoints ya alcanzados
    while (this.path.length && Phaser.Math.Distance.Between(me.x, me.y, this.path[0].x, this.path[0].y) < 10) this.path.shift();
    const goal = this.path.length ? this.path[0] : target;
    const ang = Math.atan2(goal.y - me.y, goal.x - me.x);
    const catchUp = 1 + Phaser.Math.Clamp((dist - 350) / 700, 0, 0.5);
    const speed = this.currentSpeed() * catchUp;
    this.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
  }

  /** Ojos rojos visibles en la oscuridad (por encima de la capa de sombra). */
  updateEyes(dist) {
    const visible = this.state !== 'dormant' && !this.lit && dist < 560;
    this.eyes.setVisible(visible);
    if (!visible) return;
    this.eyes.setPosition(this.x, this.y - 68);
    const blink = Math.random() < 0.015 ? 0.1 : 1;
    this.eyes.setAlpha(Phaser.Math.Clamp(1.3 - dist / 520, 0.3, 1) * blink * this.alpha);
  }

  snapshot() {
    return { active: this.isActive };
  }
}
