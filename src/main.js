// =====================================================================
//  main.js — Punto de entrada. Crea el juego y registra el service worker
//  (PWA) cuando se sirve por HTTPS / localhost en producción.
// =====================================================================
import Phaser from 'phaser';
import config from './config/gameConfig.js';

const game = new Phaser.Game(config);
window.__game = game; // útil para depurar desde la consola

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
