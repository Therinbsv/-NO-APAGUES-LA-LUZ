// =====================================================================
//  GridMap.js — Cuadrícula de obstáculos + A* + línea de visión.
//  Sin dependencias de Phaser (se puede probar en Node).
//  Se usa para:
//    1) Pathfinding de la criatura (IA básica: rodea los muebles).
//    2) Línea de visión de la linterna (los muebles bloquean la luz).
// =====================================================================

export default class GridMap {
  /**
   * @param {number} worldW ancho del mundo en px
   * @param {number} worldH alto del mundo en px
   * @param {number} cell   tamaño de celda en px
   */
  constructor(worldW, worldH, cell = 32) {
    this.cell = cell;
    this.cols = Math.ceil(worldW / cell);
    this.rows = Math.ceil(worldH / cell);
    this.blocked = new Uint8Array(this.cols * this.rows);
  }

  /** Marca como bloqueadas las celdas que toca el rectángulo (con margen "inflate"). */
  addRect(x, y, w, h, inflate = 0) {
    const c0 = Math.floor((x - inflate) / this.cell);
    const c1 = Math.floor((x + w + inflate - 1) / this.cell);
    const r0 = Math.floor((y - inflate) / this.cell);
    const r1 = Math.floor((y + h + inflate - 1) / this.cell);
    for (let r = Math.max(0, r0); r <= Math.min(this.rows - 1, r1); r++) {
      for (let c = Math.max(0, c0); c <= Math.min(this.cols - 1, c1); c++) {
        this.blocked[r * this.cols + c] = 1;
      }
    }
  }

  inBounds(c, r) {
    return c >= 0 && r >= 0 && c < this.cols && r < this.rows;
  }

  isBlockedCell(c, r) {
    return !this.inBounds(c, r) || this.blocked[r * this.cols + c] === 1;
  }

  isBlockedPx(x, y) {
    return this.isBlockedCell(Math.floor(x / this.cell), Math.floor(y / this.cell));
  }

  cellCenter(c, r) {
    return { x: c * this.cell + this.cell / 2, y: r * this.cell + this.cell / 2 };
  }

  /** ¿Se puede ir en línea recta de A a B sin tocar celdas bloqueadas? */
  lineClear(x1, y1, x2, y2, step = 8) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const n = Math.max(1, Math.ceil(dist / step));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (this.isBlockedPx(x1 + dx * t, y1 + dy * t)) return false;
    }
    return true;
  }

  /** Celda libre más cercana (búsqueda en espiral). */
  nearestFree(c, r, maxRadius = 6) {
    if (!this.isBlockedCell(c, r)) return { c, r };
    for (let rad = 1; rad <= maxRadius; rad++) {
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad) continue;
          if (!this.isBlockedCell(c + dc, r + dr)) return { c: c + dc, r: r + dr };
        }
      }
    }
    return null;
  }

  /**
   * A* en 8 direcciones (sin cortar esquinas).
   * @returns {{x:number,y:number}[]} waypoints en px (sin incluir el punto de partida)
   */
  findPath(sx, sy, tx, ty) {
    const start = this.nearestFree(Math.floor(sx / this.cell), Math.floor(sy / this.cell));
    const goal = this.nearestFree(Math.floor(tx / this.cell), Math.floor(ty / this.cell));
    if (!start || !goal) return [];
    const cols = this.cols;
    const idx = (c, r) => r * cols + c;
    const startI = idx(start.c, start.r);
    const goalI = idx(goal.c, goal.r);
    if (startI === goalI) return [{ x: tx, y: ty }];

    const g = new Float32Array(this.cols * this.rows).fill(Infinity);
    const parent = new Int32Array(this.cols * this.rows).fill(-1);
    const closed = new Uint8Array(this.cols * this.rows);
    const open = []; // montículo binario [f, índice]
    const heur = (c, r) => {
      const dx = Math.abs(c - goal.c);
      const dy = Math.abs(r - goal.r);
      return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy); // distancia octil
    };
    const push = (f, i) => {
      open.push([f, i]);
      let k = open.length - 1;
      while (k > 0) {
        const p = (k - 1) >> 1;
        if (open[p][0] <= open[k][0]) break;
        [open[p], open[k]] = [open[k], open[p]];
        k = p;
      }
    };
    const pop = () => {
      const top = open[0];
      const last = open.pop();
      if (open.length) {
        open[0] = last;
        let k = 0;
        for (;;) {
          const l = 2 * k + 1;
          const r = l + 1;
          let m = k;
          if (l < open.length && open[l][0] < open[m][0]) m = l;
          if (r < open.length && open[r][0] < open[m][0]) m = r;
          if (m === k) break;
          [open[m], open[k]] = [open[k], open[m]];
          k = m;
        }
      }
      return top;
    };

    g[startI] = 0;
    push(heur(start.c, start.r), startI);
    const dirs = [
      [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
      [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]
    ];
    let found = false;
    while (open.length) {
      const [, cur] = pop();
      if (closed[cur]) continue;
      closed[cur] = 1;
      if (cur === goalI) {
        found = true;
        break;
      }
      const cc = cur % cols;
      const cr = (cur / cols) | 0;
      for (const [dc, dr, cost] of dirs) {
        const nc = cc + dc;
        const nr = cr + dr;
        if (this.isBlockedCell(nc, nr)) continue;
        // no cortar esquinas: en diagonal, ambas celdas laterales deben estar libres
        if (dc !== 0 && dr !== 0 && (this.isBlockedCell(cc + dc, cr) || this.isBlockedCell(cc, cr + dr))) continue;
        const ni = idx(nc, nr);
        if (closed[ni]) continue;
        const ng = g[cur] + cost;
        if (ng < g[ni]) {
          g[ni] = ng;
          parent[ni] = cur;
          push(ng + heur(nc, nr), ni);
        }
      }
    }
    if (!found) return [];

    // reconstruir camino
    const cells = [];
    for (let i = goalI; i !== -1; i = parent[i]) cells.push(i);
    cells.reverse();
    let pts = cells.map((i) => this.cellCenter(i % cols, (i / cols) | 0));
    pts[0] = { x: sx, y: sy };
    pts[pts.length - 1] = { x: tx, y: ty };

    // suavizado ("string pulling" simple): saltar waypoints con visión directa
    const out = [];
    let anchor = 0;
    while (anchor < pts.length - 1) {
      let next = anchor + 1;
      for (let j = pts.length - 1; j > anchor + 1; j--) {
        if (this.lineClear(pts[anchor].x, pts[anchor].y, pts[j].x, pts[j].y, 6)) {
          next = j;
          break;
        }
      }
      out.push(pts[next]);
      anchor = next;
    }
    return out;
  }

  /** Alcanzabilidad: ¿hay camino de A a B? (para pruebas de diseño del nivel) */
  reachable(sx, sy, tx, ty) {
    return this.findPath(sx, sy, tx, ty).length > 0;
  }
}
