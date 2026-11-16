// =====================================================================
//  InventoryManager.js — Inventario del jugador (bonus: sistema de inventario).
//  Responsable: Integrante 3.
//
//  Cada ítem: { id, name, kind, icon, lines }
//    kind: 'tool' | 'photo' | 'note' | 'tape' | 'key'
//    lines: texto para volver a leerlo desde el inventario (tecla I).
// =====================================================================
import Phaser from 'phaser';

export default class InventoryManager extends Phaser.Events.EventEmitter {
  constructor() {
    super();
    this.items = [];
  }

  add(item) {
    if (this.has(item.id)) return false;
    this.items.push(item);
    this.emit('add', item);
    this.emit('change', this.items);
    return true;
  }

  has(id) {
    return this.items.some((i) => i.id === id);
  }

  get(id) {
    return this.items.find((i) => i.id === id);
  }

  count(kind) {
    return this.items.filter((i) => i.kind === kind).length;
  }

  list() {
    return this.items;
  }

  clear() {
    this.items = [];
    this.emit('change', this.items);
  }

  snapshot() {
    return this.items.map((i) => ({ ...i }));
  }

  restore(items) {
    this.items = (items || []).map((i) => ({ ...i }));
    this.emit('change', this.items);
  }
}
