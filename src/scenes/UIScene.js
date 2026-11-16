// =====================================================================
//  UIScene.js — Capa de interfaz que corre EN PARALELO a GameScene.
//  Contiene HUD, diálogos, teclado de la caja, mochila, botones de
//  pausa/mute y controles táctiles. Separarla del mundo permite que la
//  interfaz no se mueva con la cámara y simplifica la pausa.
// =====================================================================
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, EVENTS } from '../config/constants.js';
import { TEX } from '../assets/TextureFactory.js';
import HUD from '../ui/HUD.js';
import DialogueBox from '../ui/DialogueBox.js';
import KeypadUI from '../ui/KeypadUI.js';
import InventoryUI from '../ui/InventoryUI.js';
import TouchControls from '../ui/TouchControls.js';
import { IconButton } from '../ui/Button.js';
import { makeText } from '../ui/UIHelpers.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super(SCENES.UI);
  }

  create() {
    this.storage = this.registry.get('storage');
    this.audio = this.registry.get('audio');
    this.gameScene = this.scene.get(SCENES.GAME);
    this.lastModalClose = 0;
    this.input.addPointer(2); // multitoque: 2 joysticks + botones

    // Zona de fondo: un clic de ratón en el campo de juego alterna la linterna.
    this.clickZone = this.add.zone(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0, 0).setInteractive().setDepth(-1);
    this.clickZone.on('pointerdown', (p) => {
      if (!p.wasTouch && p.leftButtonDown() && !this.isModalOpen()) this.game.events.emit(EVENTS.PLAYFIELD_CLICK);
    });

    this.hud = new HUD(this);
    this.touch = new TouchControls(this);
    this.dialogue = new DialogueBox(this, this.audio);
    this.keypad = new KeypadUI(this, this.audio);
    this.inventoryUI = new InventoryUI(this, this.audio);
    this.inventoryUI.on('closed', () => this.modalClosed());

    // Botones de la esquina superior derecha
    this.btnPause = new IconButton(this, GAME_WIDTH - 118, 100, TEX.ICON_PAUSE, () => this.gameScene.requestPause());
    this.btnMute = new IconButton(this, GAME_WIDTH - 70, 100, this.audio.isMuted() ? TEX.ICON_SOUND_OFF : TEX.ICON_SOUND_ON, () => this.audio.toggleMute());
    this.btnBag = new IconButton(this, GAME_WIDTH - 22, 100, TEX.ICON_BAG, () => this.gameScene.openInventory());
    [this.btnPause, this.btnMute, this.btnBag].forEach((b) => b.setDepth(12));

    this._onMute = (m) => this.btnMute.setIcon(m ? TEX.ICON_SOUND_OFF : TEX.ICON_SOUND_ON);
    this.game.events.on(EVENTS.MUTE_CHANGED, this._onMute);

    // Contador de FPS (tecla F3): ayuda a comprobar el requisito de 45 FPS.
    this.fpsText = makeText(this, GAME_WIDTH / 2, 6, '', { size: 12, color: '#7be0a0', originX: 0.5, strokeThickness: 3 }).setDepth(200).setVisible(false);

    // Controles táctiles: visibles según la configuración (auto = dispositivos táctiles)
    const mode = this.storage.getSettings().touchMode;
    const auto = !this.sys.game.device.os.desktop;
    this.setTouchVisible(mode === 'on' || (mode === 'auto' && auto));
    this.input.on('pointerdown', (p) => {
      if (mode === 'auto' && p.wasTouch && !this.touch.visible) this.setTouchVisible(true);
    });

    this.events.once('shutdown', () => {
      this.game.events.off(EVENTS.MUTE_CHANGED, this._onMute);
    });

    // Avisa a GameScene de que la interfaz ya existe.
    this.gameScene.onUIReady(this);
  }

  setTouchVisible(v) {
    this.touch.setVisible(v);
    this.hud.setTouchMode(v);
  }

  // ------------------------------------------------------------ modales
  isModalOpen() {
    return this.dialogue.isOpen || this.keypad.isOpen || this.inventoryUI.isOpen;
  }

  modalClosed() {
    this.lastModalClose = this.game.loop.time;
    if (!this.isModalOpen()) this.touch.setEnabled(true);
  }

  showDialogue(lines, onClose) {
    this.touch.setEnabled(false);
    this.dialogue.open(lines, () => {
      this.modalClosed();
      onClose?.();
    });
  }

  showKeypad({ onSubmit, onSolved, onClose }) {
    this.touch.setEnabled(false);
    this.keypad.open({
      onSubmit,
      onSolved,
      onClose: () => {
        this.modalClosed();
        onClose?.();
      }
    });
  }

  showInventory(items) {
    this.touch.setEnabled(false);
    this.inventoryUI.open(items);
  }

  closeAllModals() {
    this.dialogue.close();
    this.keypad.close();
    this.inventoryUI.close();
  }

  // ------------------------------------------------------------ HUD
  setHudState(state) {
    this.hud.setState(state);
  }

  toggleFps() {
    this.fpsText.setVisible(!this.fpsText.visible);
  }

  update() {
    if (this.fpsText.visible) {
      this.fpsText.setText(`${Math.round(this.game.loop.actualFps)} FPS · estado: ${this.registry.get('state').state}`);
    }
  }
}
