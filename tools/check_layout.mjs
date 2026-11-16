// =====================================================================
//  check_layout.mjs — Prueba automática de diseño del nivel (sin navegador).
//  Verifica que:
//   1) Ningún objeto/pila/jugador/spawn de la criatura esté dentro de un mueble.
//   2) Todo objeto interactivo sea alcanzable caminando desde el inicio.
//  Uso:  npm run check:layout
// =====================================================================
import { readFileSync } from 'node:fs';
import GridMap from '../src/physics/GridMap.js';
import { WALLS, FURNITURE, PLAYER_START, MONSTER_SPAWNS } from '../src/config/levelLayout.js';

const story = JSON.parse(readFileSync(new URL('../public/assets/data/story.json', import.meta.url)));
const WORLD = { w: 1280, h: 960 };

const walk = new GridMap(WORLD.w, WORLD.h, 16); // inflado 10 px (jugador); celda fina para no sobreestimar
for (const r of [...WALLS, ...FURNITURE]) walk.addRect(r.x, r.y, r.w, r.h, 10);

const inside = (p, r, m = 0) => p.x > r.x - m && p.x < r.x + r.w + m && p.y > r.y - m && p.y < r.y + r.h + m;
let errors = 0;
const fail = (msg) => { errors++; console.error('  ✗', msg); };
const ok = (msg) => console.log('  ✓', msg);

console.log('Comprobando el plano de la habitación…');

// 1) Jugador y spawns fuera de sólidos
for (const [name, p] of [['PLAYER_START', PLAYER_START], ...MONSTER_SPAWNS.map((p, i) => ['MONSTER_SPAWN_' + i, p])]) {
  const hit = [...WALLS, ...FURNITURE].find((r) => inside(p, r, 8));
  hit ? fail(`${name} (${p.x},${p.y}) cae dentro de ${hit.id}`) : ok(`${name} libre`);
}

// 2) Pilas fuera de sólidos y alcanzables
for (const [i, b] of story.batteries.entries()) {
  const hit = [...WALLS, ...FURNITURE].find((r) => inside(b, r, 8));
  if (hit) fail(`pila ${i + 1} (${b.x},${b.y}) cae dentro de ${hit.id}`);
  else if (!walk.reachable(PLAYER_START.x, PLAYER_START.y, b.x, b.y)) fail(`pila ${i + 1} inalcanzable`);
  else ok(`pila ${i + 1} alcanzable`);
}

// 3) Interactivos: debe existir una celda libre alcanzable a distancia <= radio
for (const o of story.interactables) {
  let reach = false;
  for (let a = 0; a < 360 && !reach; a += 15) {
    for (let d = 10; d <= o.radius - 8 && !reach; d += 10) {
      const p = { x: o.x + Math.cos((a * Math.PI) / 180) * d, y: o.y + Math.sin((a * Math.PI) / 180) * d };
      if (walk.isBlockedPx(p.x, p.y)) continue;
      if (walk.reachable(PLAYER_START.x, PLAYER_START.y, p.x, p.y)) reach = true;
    }
  }
  reach ? ok(`${o.id} se puede alcanzar`) : fail(`${o.id} NO se puede alcanzar a distancia de interacción`);
}

// 4) Combinación
const combo = story.meta.combination.join('-');
combo === '12-8-21' ? ok('combinación 12-08-21 correcta') : fail('combinación distinta de 12-08-21');

console.log(errors ? `\n${errors} problema(s) encontrados.` : '\nPlano OK: todo es alcanzable.');
process.exit(errors ? 1 : 0);
