// =====================================================================
//  StoryManager.js — Progresión de la historia, acertijos y finales.
//  Responsable: Integrante 3.
//
//  No depende de Phaser (salvo el emisor de eventos): recibe los datos del
//  JSON cargado por el Loader y decide qué ocurre al interactuar con cada
//  objeto. GameScene ejecuta el "resultado" que devuelve (diálogos, sonidos…).
//
//  Capítulos (nivelAlcanzado): 1 apagón · 2 linterna · 3 fotografías ·
//  4 caja/llamada · 5 grabación · 6 llave · 7 generador/desenlace.
// =====================================================================
import Phaser from 'phaser';
import { SCORE, ENDINGS } from '../config/constants.js';
import { SFX } from '../audio/audioKeys.js';

export default class StoryManager extends Phaser.Events.EventEmitter {
  constructor(data, inventory, score) {
    super();
    this.data = data;
    this.inventory = inventory;
    this.score = score;
    this.reset();
  }

  reset() {
    this.level = 1;
    this.flags = {};
    this.readMessages = [];
    this.collected = []; // ids de objetos del mundo ya recogidos
    this.keypadAttempts = 0;
  }

  // ------------------------------------------------------------ guardado
  snapshot() {
    return {
      level: this.level,
      flags: { ...this.flags },
      readMessages: [...this.readMessages],
      collected: [...this.collected]
    };
  }

  restore(s) {
    this.level = s?.level ?? 1;
    this.flags = { ...(s?.flags ?? {}) };
    this.readMessages = [...(s?.readMessages ?? [])];
    this.collected = [...(s?.collected ?? [])];
  }

  // ------------------------------------------------------------ banderas
  has(flag) {
    return !!this.flags[flag];
  }

  set(flag, value = true) {
    this.flags[flag] = value;
  }

  isCollected(id) {
    return this.collected.includes(id);
  }

  markCollected(id) {
    if (!this.collected.includes(id)) this.collected.push(id);
  }

  // ------------------------------------------------------------ progreso
  /** El final secreto exige: 4 fotos + grabación escuchada + nota escondida. */
  canTriggerSecret() {
    return this.inventory.count('photo') >= 4 && this.has('recordingHeard') && this.has('secretNote');
  }

  computeLevel() {
    let lv = this.level;
    if (this.has('flashlight')) lv = Math.max(lv, 2);
    if (this.inventory.count('photo') >= 2) lv = Math.max(lv, 3);
    if (this.has('boxOpened')) lv = Math.max(lv, 4);
    if (this.has('recordingHeard')) lv = Math.max(lv, 5);
    if (this.has('hasKey')) lv = Math.max(lv, 6);
    if (this.has('generatorOn')) lv = Math.max(lv, 7);
    return lv;
  }

  /** Recalcula el capítulo. Emite 'levelUp' si avanzó. */
  checkProgress() {
    const lv = this.computeLevel();
    if (lv > this.level) {
      this.level = lv;
      this.emit('levelUp', lv, this.getChapter(lv));
      return true;
    }
    return false;
  }

  getChapter(level = this.level) {
    return this.data.chapters.find((c) => c.level === level) || this.data.chapters[0];
  }

  getObjective() {
    const ch = this.getChapter();
    if (ch.level === 4 && this.has('callAnswered') && ch.objectiveAfterCall) return ch.objectiveAfterCall;
    if (ch.level === 7 && this.canTriggerSecret() && ch.objectiveSecret) return ch.objectiveSecret;
    return ch.objective;
  }

  // ------------------------------------------------------------ textos de ayuda
  /** Texto del cartel que aparece sobre el objeto ("E · …"). */
  getPrompt(def) {
    const f = this.flags;
    switch (def.type) {
      case 'phone':
        return f.boxOpened && !f.callAnswered ? 'Contestar teléfono' : def.label;
      case 'box':
        return f.boxOpened ? 'Examinar caja vacía' : def.label;
      case 'recorder':
        if (f.recordingHeard) return 'Armario';
        return this.inventory.has('tape') ? 'Usar la grabadora' : def.label;
      case 'generator':
        if (f.generatorOn) return 'Generador (encendido)';
        return f.hasKey ? 'Mantén E: arrancar generador' : def.label;
      case 'door':
        return f.generatorOn ? 'Salir por la puerta' : def.label;
      default:
        return def.label;
    }
  }

  /** 'hold' si hay que mantener pulsado (generador), 'press' en otro caso. */
  getInteractionMode(def) {
    if (def.type === 'generator' && this.has('hasKey') && !this.has('generatorOn')) return 'hold';
    return 'press';
  }

  // ------------------------------------------------------------ interacción
  /**
   * Procesa una interacción y devuelve qué debe hacer GameScene:
   * { lines, sfx, consume, keypad, ending, flashlight, stopRing }
   */
  interact(def) {
    const T = this.data.texts;
    const items = this.data.items;
    const res = { lines: [], sfx: null, consume: false, keypad: false, ending: null };

    switch (def.type) {
      case 'flashlight': {
        this.set('flashlight');
        this.inventory.add({ id: def.id, name: items.flashlight.name, kind: 'tool', icon: def.texture, lines: items.flashlight.lines });
        res.lines = items.flashlight.lines;
        res.sfx = SFX.PICKUP;
        res.consume = true;
        res.flashlight = true;
        break;
      }

      case 'photo':
      case 'note': {
        const it = items[def.id];
        const added = this.inventory.add({ id: def.id, name: it.name, kind: def.type, icon: def.texture, lines: it.lines });
        if (added) this.score.add(def.points ?? SCORE[def.type], it.name);
        if (def.id === 'note_4') this.set('secretNote');
        res.lines = it.lines;
        res.sfx = def.type === 'photo' ? SFX.PICKUP : SFX.PAPER;
        res.consume = true;
        break;
      }

      case 'calendar':
        res.lines = T.calendar;
        res.sfx = SFX.PAPER;
        break;

      case 'phone': {
        if (this.has('boxOpened') && !this.has('callAnswered')) {
          this.set('callAnswered');
          res.lines = this.data.phone.call;
          res.stopRing = true;
          break;
        }
        const msgs = this.data.phone.messages;
        const unread = [];
        msgs.forEach((m, i) => {
          if (m.minLevel <= this.level && !this.readMessages.includes(i)) {
            unread.push(m);
            this.readMessages.push(i);
          }
        });
        if (unread.length) {
          res.lines = unread.map((m) => ({ speaker: 'Sofía (mensaje)', text: m.text }));
          if (this.level >= 7 && this.canTriggerSecret() && !this.has('secretMessageShown')) {
            this.set('secretMessageShown');
            res.lines.push({ speaker: 'Sofía (mensaje)', text: this.data.phone.secretMessage });
          }
          res.sfx = SFX.PHONE_BUZZ;
        } else {
          res.lines = [{ speaker: 'Teléfono', text: this.data.phone.empty }];
        }
        break;
      }

      case 'box':
        if (this.has('boxOpened')) res.lines = [{ speaker: 'Narrador', text: T.boxOpen }];
        else {
          res.lines = T.boxClosed;
          res.keypad = true;
        }
        break;

      case 'recorder':
        if (this.has('recordingHeard')) res.lines = T.recorderDone;
        else if (!this.inventory.has('tape')) res.lines = T.recorderNoTape;
        else {
          this.set('recordingHeard');
          this.score.add(SCORE.recording, 'Grabación escuchada');
          res.lines = T.recording;
          res.sfx = SFX.TAPE;
        }
        break;

      case 'chest':
        if (this.has('hasKey')) res.lines = [{ speaker: 'Narrador', text: T.chestEmpty }];
        else if (!this.has('recordingHeard')) res.lines = T.chestLocked;
        else {
          this.set('hasKey');
          this.inventory.add({ id: 'key', name: items.key.name, kind: 'key', icon: 'item_key', lines: items.key.lines });
          res.lines = [...T.chestKey, ...items.key.lines];
          res.sfx = SFX.PICKUP;
        }
        break;

      case 'generator':
        if (this.has('generatorOn')) res.lines = [{ speaker: 'Mateo', text: 'El generador sigue rugiendo. La luz aguanta... por ahora.' }];
        else res.lines = T.generatorNoKey; // con llave se usa el modo "hold"
        break;

      case 'door':
        if (!this.has('generatorOn')) {
          res.lines = T.doorLocked;
        } else if (this.canTriggerSecret() && !this.has('doorWarned')) {
          this.set('doorWarned');
          res.lines = T.doorSecretWarning;
        } else {
          res.lines = T.doorOpen;
          res.sfx = SFX.DOOR;
          res.ending = ENDINGS.NORMAL;
        }
        break;

      default:
        break;
    }
    this.checkProgress();
    return res;
  }

  /** Acertijo de la caja. values = [día, mes, año]. */
  submitCombination(values) {
    const target = this.data.meta.combination;
    const correct = values.length === target.length && values.every((v, i) => v === target[i]);
    if (!correct) {
      this.keypadAttempts++;
      return { correct: false, hint: this.keypadAttempts >= 3 ? this.data.texts.boxHint : null };
    }
    this.set('boxOpened');
    const tape = this.data.items.tape;
    this.inventory.add({ id: 'tape', name: tape.name, kind: 'tape', icon: 'item_tape', lines: tape.lines });
    this.score.add(SCORE.puzzle, 'Acertijo de la caja');
    this.checkProgress();
    return { correct: true, lines: tape.lines };
  }

  /** Se llama cuando el jugador termina de arrancar el generador. */
  completeGenerator() {
    this.set('generatorOn');
    this.score.add(SCORE.generator, 'Generador encendido');
    this.checkProgress();
    return { lines: this.data.texts.generatorOn };
  }

  /** Interacción con la criatura (final secreto). */
  interactMonster() {
    if (this.canTriggerSecret()) {
      return { ending: ENDINGS.SECRET, lines: [] };
    }
    return { ending: null, lines: this.data.texts.monsterObserve };
  }

  /** Suma la bonificación de un final y devuelve su definición. */
  finish(endingId) {
    if (endingId === ENDINGS.NORMAL) this.score.add(SCORE.escape, 'Escapaste');
    if (endingId === ENDINGS.SECRET) this.score.add(SCORE.secret, 'Final secreto');
    return this.data.endings[endingId];
  }
}
