// =====================================================================
//  InstructionsScene.js — Cómo jugar (objetivo, mecánicas y controles).
//  Cumple el requisito de accesibilidad: instrucciones y controles
//  documentados y visibles.
// =====================================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants.js';
import Button, { ButtonList } from '../ui/Button.js';
import { makeText, drawPanel, FONT_TITLE } from '../ui/UIHelpers.js';

const CONTROLS = [
  ['Mover', 'W A S D  ·  Flechas'],
  ['Apuntar la linterna', 'Ratón  (o hacia donde caminas)'],
  ['Fijar el haz', 'Mantener ESPACIO o SHIFT'],
  ['Encender / apagar linterna', 'F  ·  clic izquierdo'],
  ['Interactuar / avanzar texto', 'E  (mantener para arrancar)'],
  ['Mochila (releer pistas)', 'I'],
  ['Pausa', 'P  ·  ESC'],
  ['Silenciar', 'M  ·  botón del altavoz'],
  ['Móvil / tablet', 'Joystick izq. mueve · der. apunta']
];

export default class InstructionsScene extends Phaser.Scene {
  constructor() {
    super(SCENES.INSTRUCTIONS);
  }

  create() {
    this.cameras.main.setBackgroundColor(0x07050c);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x07050c).setOrigin(0, 0);
    drawPanel(this.add.graphics(), 24, 16, GAME_WIDTH - 48, GAME_HEIGHT - 32, { alpha: 0.95, radius: 14 });

    makeText(this, GAME_WIDTH / 2, 38, 'CÓMO JUGAR', { size: 30, font: FONT_TITLE, style: 'bold', color: '#ffe9a0', originX: 0.5, originY: 0.5, strokeThickness: 4 });

    // ---- Columna izquierda: objetivo y mecánicas
    makeText(this, 52, 70, 'OBJETIVO', { size: 15, style: 'bold', color: COLORS.GOLD });
    makeText(
      this, 52, 92,
      'Es una noche de tormenta y se fue la luz. Explora tu habitación, descubre qué le ocurrió a Sofía y sobrevive a la criatura que te acecha en la oscuridad. Hay 3 finales distintos.',
      { size: 14, wrap: 405, lineSpacing: 3 }
    );
    makeText(this, 52, 188, 'MECÁNICAS', { size: 15, style: 'bold', color: COLORS.GOLD });
    makeText(
      this, 52, 210,
      [
        '• La criatura se DETIENE mientras la iluminas.',
        '   En la oscuridad, te persigue.',
        '• La linterna gasta batería: recoge pilas',
        '   pasando por encima de ellas.',
        '• Examina objetos con E: fotos, notas, teléfono,',
        '   caja con candado, grabadora…',
        '• Mientras lees un diálogo el tiempo se detiene.',
        '• Los muebles bloquean la luz: no te quedes quieto.',
        '• Se guarda solo en cada capítulo (Continuar).',
        '• Puntos: fotos y notas +10, acertijo y grabación',
        '   +20, y bonificación por cada final.'
      ].join('\n'),
      { size: 14, wrap: 420, lineSpacing: 4 }
    );

    // ---- Columna derecha: controles
    makeText(this, 520, 70, 'CONTROLES', { size: 15, style: 'bold', color: COLORS.GOLD });
    CONTROLS.forEach(([action, keys], i) => {
      const y = 98 + i * 36;
      const g = this.add.graphics();
      g.fillStyle(i % 2 ? 0x16111f : 0x1d1628, 1).fillRoundedRect(516, y - 4, 396, 32, 6);
      makeText(this, 528, y + 12, action, { size: 13.5, originY: 0.5, color: '#d8cfe6' });
      makeText(this, 900, y + 12, keys, { size: 13.5, originX: 1, originY: 0.5, color: '#fff1c4', style: 'bold' });
    });

    makeText(this, 520, 428, 'Consejo: no apagues la luz cuando la sombra esté cerca…', { size: 13, color: COLORS.DANGER, style: 'italic', wrap: 390 });

    const back = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 44, 'VOLVER AL MENÚ', () => this.scene.start(SCENES.MENU), { width: 260, height: 42, size: 18 });
    new ButtonList(this, [back]);
    this.input.keyboard.on('keydown-ESC', () => this.scene.start(SCENES.MENU));
  }
}
