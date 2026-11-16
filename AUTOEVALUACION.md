# Autoevaluación — NO APAGUES LA LUZ

| Criterio de la rúbrica | Estado | Evidencia |
|---|---|---|
| Escenas Phaser (Boot, Preload, Menú, Juego, Pausa, Game Over, Final) | Cumple | `src/scenes/` |
| Loader con barra de progreso | Cumple | `PreloadScene.js` |
| Sistema de estados | Cumple | `GameStateManager.js` (tabla de transiciones) |
| Reiniciar / volver al menú | Cumple | Pausa y Game Over |
| Estructura de carpetas pedida | Cumple | README |
| Movimiento y colisiones (Arcade Physics) | Cumple | `Player`, `CollisionManager` |
| Puntuación y HUD | Cumple | `ScoreManager`, `HUD` |
| Enemigo con IA | Cumple | `Monster` (FSM + A*) |
| Victoria / derrota | Cumple | 3 finales |
| Persistencia | Cumple | localStorage (3 claves exigidas) |
| Música + ≥2 SFX + mute | Cumple | 3 músicas, 20 SFX, mute persistente |
| Responsive + táctil | Cumple (probado solo en escritorio) | `Phaser.Scale.FIT`, `TouchControls` |
| ≥45 FPS | **Sin verificar** | En este entorno sin GPU se midieron ~11 FPS con WebGL por software; probar en un equipo real con F3 |
| Accesibilidad | Cumple | Instrucciones, alto contraste, teclado, reducir efectos |
| Código comentado y modular | Cumple | |
| README, video, capturas, ZIP | README y capturas listos; **video por grabar** | `docs/capturas/` |

## Casos de prueba (plan)
Verificados con prueba automatizada en navegador (Playwright): recorrido completo hasta final normal, derrota por la criatura, pausa, guardado de `highScore` / `nivelAlcanzado`. El resto, verificar a mano:

| ID | Prueba | Resultado |
|---|---|---|
| CP-01 | Menú carga y JUGAR inicia | OK (auto) |
| CP-02 | Recoger linterna | OK (auto) |
| CP-03 | Fotos y notas suman 10 pts | OK (auto) |
| CP-04 | Caja 12-08-21 | OK (auto, vía lógica) |
| CP-05 | Grabadora, cofre y llave | OK (auto) |
| CP-06 | Generador y luz | OK (auto) |
| CP-07 | Puerta → final normal | OK (auto) |
| CP-08 | Derrota → Game Over | OK (auto) |
| CP-09 | Pausa/reanudar | OK (auto) |
| CP-10 | highScore / nivelAlcanzado guardados | OK (auto) |
| CP-11…CP-16 | Final secreto, mute persistente, táctil, ajustes, continuar, FPS | Pendiente de prueba manual |
