// =====================================================================
//  InventoryUI.js — Mochila (tecla I). Permite volver a leer fotos y notas.
//  Responsable: Integrante 3/4.  (Bonus: sistema de inventario.)
// =====================================================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants.js';
import { makeText, drawPanel, speakerColor } from './UIHelpers.js';
import Button from './Button.js';

const P = { w: 700, h: 380 };
P.x = (GAME_WIDTH - P.w) / 2;
P.y = (GAME_HEIGHT - P.h) / 2;
const SLOT = 64;
const COLS = 8;

export default class InventoryUI extends Phaser.GameObjects.Container {
  constructor(scene, audio) {
    super(scene, 0, 0);
    this.audio = audio;
    this.isOpen = false;
    this.items = [];
    this.selected = 0;

    this.blocker = scene.add.zone(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0, 0).setInteractive();
    this.dim = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setOrigin(0, 0);
    this.panel = drawPanel(scene.add.graphics(), P.x, P.y, P.w, P.h, { alpha: 0.96, radius: 14 });
    this.title = makeText(scene, P.x + 24, P.y + 16, 'MOCHILA', { size: 22, style: 'bold', color: COLORS.GOLD, strokeThickness: 2 });
    this.hintText = makeText(scene, P.x + P.w - 24, P.y + 22, '← → elegir · I / Esc cerrar', { size: 12, color: COLORS.TEXT_DIM, originX: 1 });
    this.slotsG = scene.add.graphics();
    this.icons = [];
    this.nameText = makeText(scene, P.x + 24, P.y + 170, '', { size: 18, style: 'bold', strokeThickness: 2 });
    this.descText = makeText(scene, P.x + 24, P.y + 200, '', { size: 15, wrap: P.w - 48, lineSpacing: 4 });
    this.closeBtn = new Button(scene, P.x + P.w / 2, P.y + P.h - 32, 'Cerrar', () => this.close(), { width: 160, height: 38, size: 17 });

    this.add([this.blocker, this.dim, this.panel, this.title, this.hintText, this.slotsG, this.nameText, this.descText, this.closeBtn]);
    this.setDepth(110).setVisible(false);
    scene.add.existing(this);

    this._key = (e) => {
      if (!this.isOpen) return;
      if (e.code === 'KeyI' || e.code === 'Escape') this.close();
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.select(this.selected + 1);
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.select(this.selected - 1);
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.select(this.selected + COLS);
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') this.select(this.selected - COLS);
    };
    scene.input.keyboard.on('keydown', this._key);
    scene.events.once('shutdown', () => scene.input.keyboard?.off('keydown', this._key));
  }

  open(items) {
    this.items = items;
    this.selected = 0;
    this.isOpen = true;
    this.openedAt = this.scene.time.now;
    this.rebuild();
    this.setVisible(true);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.setVisible(false);
    this.emit('closed');
  }

  select(i) {
    if (!this.items.length) return;
    this.selected = Phaser.Math.Clamp(i, 0, this.items.length - 1);
    this.rebuild();
  }

  rebuild() {
    this.icons.forEach((i) => i.destroy());
    this.icons = [];
    const g = this.slotsG;
    g.clear();
    const x0 = P.x + 24;
    const y0 = P.y + 56;
    const n = Math.max(this.items.length, 1);
    for (let i = 0; i < Math.max(COLS * 2, n); i++) {
      const cx = x0 + (i % COLS) * (SLOT + 8);
      const cy = y0 + Math.floor(i / COLS) * (SLOT + 8);
      const sel = i === this.selected && this.items.length > 0;
      g.fillStyle(sel ? 0x3a2a52 : 0x1a1424, 1);
      g.fillRoundedRect(cx, cy, SLOT, SLOT, 8);
      g.lineStyle(sel ? 3 : 1.5, sel ? 0xffe9a0 : 0x5a4a70, 1);
      g.strokeRoundedRect(cx, cy, SLOT, SLOT, 8);
      const item = this.items[i];
      if (item) {
        const img = this.scene.add.image(cx + SLOT / 2, cy + SLOT / 2, item.icon);
        const s = Math.min(44 / img.width, 44 / img.height);
        img.setScale(s);
        this.add(img);
        this.icons.push(img);
        // clic para seleccionar
        const zone = this.scene.add.zone(cx, cy, SLOT, SLOT).setOrigin(0, 0).setInteractive({ useHandCursor: true });
        zone.on('pointerup', () => this.select(i));
        this.add(zone);
        this.icons.push(zone);
      }
    }
    const it = this.items[this.selected];
    if (it) {
      this.nameText.setText(it.name);
      this.descText.setText(it.lines.map((l) => l.text).join('\n\n'));
      this.descText.setColor('#f4ecd8');
      this.nameText.setColor(speakerColor(it.lines[0]?.speaker));
    } else {
      this.nameText.setText('Mochila vacía');
      this.nameText.setColor(COLORS.TEXT_DIM);
      this.descText.setText('Todavía no has recogido nada. Explora la habitación con la linterna.');
    }
    // mantener botón y textos por encima de los iconos
    this.bringToTop(this.closeBtn);
  }
}
