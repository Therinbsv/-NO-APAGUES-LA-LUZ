# NO APAGUES LA LUZ

Videojuego 2D de **terror psicológico, exploración y supervivencia** hecho con **Phaser 3 + Vite + JavaScript (ES modules)**.
Proyecto de *Aplicaciones Web* — Escuela Politécnica Nacional.

> Una noche de tormenta se va la luz. Mateo descubre, con la ayuda de una linterna, qué le pasó a su hermana Sofía… mientras una criatura se mueve en la oscuridad. **La criatura se detiene mientras la iluminas.**

## Instalación y ejecución

```bash
npm install
npm run dev        # desarrollo  → http://localhost:5173
npm run build      # producción  → carpeta dist/
npm run preview    # probar la build
```
Requiere Node 18+. Los recursos (arte, audio) se generan de forma procedural, así que **no hay assets externos con derechos de autor**; el audio se regenera con `python3 tools/generate_audio.py` (opcional, requiere numpy).

## Controles

| Acción | Teclado / ratón | Móvil |
|---|---|---|
| Mover | WASD / flechas | Joystick izquierdo |
| Apuntar linterna | Ratón (o dirección de marcha); ESPACIO/SHIFT fija el haz | Joystick derecho |
| Linterna ON/OFF | F / clic izquierdo | Botón de linterna |
| Interactuar | E (mantener para el generador) | Botón ACTUAR |
| Mochila | I | Botón mochila |
| Pausa | P / ESC | Botón pausa |
| Silenciar | M | Botón altavoz |
| Depuración | F3 (FPS) · F4 (rejilla de navegación) | — |

## Mecánicas
- La criatura te persigue en la oscuridad y se **congela y retrocede** si la mantienes iluminada (detección por distancia + ángulo del cono + línea de visión: los muebles bloquean la luz).
- La linterna gasta batería; las pilas brillan en verde. Si te quedas sin nada, aparece una pila de emergencia.
- Historia en 7 capítulos: linterna → mensajes de Sofía → fotos y notas → caja de la combinación (**12-08-21**) → grabadora → llave → generador → puerta.
- **3 finales:** malo *La oscuridad*, normal *La salida*, secreto *Nunca estuviste solo* (4 fotos + grabación + nota oculta, y enfrentar a la sombra iluminada).
- Puntuación: foto +10, nota +10, acertijo +20, grabación +20, pila +5, generador +15, escape +30, secreto +50.
- Se guarda al inicio de cada capítulo (**Continuar**).

## Persistencia (localStorage)
`highScore`, `nivelAlcanzado`, `audioMuted`, además de `nal_settings`, `nal_progress`, `nal_endings`.

## Estructura
```
src/
  main.js                 punto de entrada
  config/                 gameConfig, constants, levelLayout
  scenes/                 Boot, Preload, Menu, Instructions, Settings, Game, UI, Pause, GameOver, Ending
  objects/                Player, Monster, Flashlight, DarknessLayer, InteractableObject
  ui/                     HUD, DialogueBox, KeypadUI, InventoryUI, TouchControls, Button, ...
  managers/               Storage, Audio, GameState, Score, Inventory, Story, Survival, Input
  physics/                CollisionManager (Arcade), GridMap (A*)
  audio/                  audioKeys
  assets/                 TextureFactory (arte procedural)
public/assets/            audio (música + efectos .wav) y story.json (historia data-driven)
```

## Tecnologías
Phaser 3.90, Vite 6, Arcade Physics, Canvas 2D (texturas procedurales), Web Audio, localStorage, PWA (manifest + service worker).

## Bonus implementados
Sistema de inventario/mochila · PWA instalable · pathfinding A* · iluminación dinámica con línea de visión · guardado y continuar · tres finales · ajustes (volumen, dificultad, reducir efectos, pantalla completa).

## Distribución del trabajo (4 integrantes)
1. Jugador, físicas y colisiones · 2. Criatura, linterna y supervivencia · 3. Historia, objetos e inventario · 4. Interfaz, audio y persistencia. *(Completar con nombres.)*

## Créditos
Código, arte procedural y audio sintetizado: equipo del proyecto. Motor: [Phaser](https://phaser.io) (MIT).
