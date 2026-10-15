/**
 * A tiny sculpting kit: signed-distance fields, smooth boolean blends and a surface-nets mesher.
 * Allocation-free primitives (they run millions of times), no dependencies. Used to carve the two hero
 * figures procedurally, so the hero ships no model or texture files.
 */

export type Field = (x: number, y: number, z: number) => number;

// --- smooth booleans -------------------------------------------------------------------------------
export function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
export function smax(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
}

// --- primitives ------------------------------------------------------------------------------------
export function sph(x: number, y: number, z: number, cx: number, cy: number, cz: number, r: number) {
  const dx = x - cx, dy = y - cy, dz = z - cz;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
}
/** Ellipsoid, first-order distance estimate (accurate near the surface, which is all the mesher needs). */
export function ell(
  x: number, y: number, z: number,
  cx: number, cy: number, cz: number,
  rx: number, ry: number, rz: number,
) {
  const px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz;
  const k0 = Math.sqrt(px * px + py * py + pz * pz);
  const qx = px / rx, qy = py / ry, qz = pz / rz;
  const k1 = Math.sqrt(qx * qx + qy * qy + qz * qz);
  return k1 < 1e-9 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}
/** Ellipsoid rotated by `angle` radians about the z axis (for slanted forms such as lapels). */
export function ellRotZ(
  x: number, y: number, z: number,
  cx: number, cy: number, cz: number,
  rx: number, ry: number, rz: number,
  angle: number,
) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const dx = x - cx, dy = y - cy;
  return ell(cx + dx * c + dy * s, cy - dx * s + dy * c, z, cx, cy, cz, rx, ry, rz);
}
export function cap(
  x: number, y: number, z: number,
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  r: number,
) {
  const pax = x - ax, pay = y - ay, paz = z - az;
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
}
/** Elliptical torus around the z axis: ring radii (rx, ry) in the xy plane, tube radius `tube`. */
export function etorus(
  x: number, y: number, z: number,
  cx: number, cy: number, cz: number,
  rx: number, ry: number, tube: number,
) {
  const qx = (x - cx) / rx, qy = (y - cy) / ry;
  const ring = (Math.sqrt(qx * qx + qy * qy) - 1) * Math.min(rx, ry);
  const dz = z - cz;
  return Math.sqrt(ring * ring + dz * dz) - tube;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export function smoothstep(e0: number, e1: number, v: number) {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

// --- value noise (colouring, folds) ----------------------------------------------------------------
function hash3(x: number, y: number, z: number) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}
export function vnoise(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}
export function fbm(x: number, y: number, z: number, octaves = 4) {
  let a = 0.5, f = 1, s = 0;
  for (let i = 0; i < octaves; i++) {
    s += a * vnoise(x * f, y * f, z * f);
    f *= 2.03;
    a *= 0.5;
  }
  return s;
}

// --- surface nets ----------------------------------------------------------------------------------
export interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
}

const CORNERS: Array<[number, number, number]> = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
];
const EDGES: Array<[number, number]> = [];
for (let a = 0; a < 8; a++) for (let ax = 0; ax < 3; ax++) if (!(a & (1 << ax))) EDGES.push([a, a | (1 << ax)]);

/**
 * Extracts the zero level set of `field` inside the box [min, max] with cubic cells of size `step`.
 * Vertices are projected back onto the surface and normals come from the field's gradient, so the
 * mesh is smooth even on a coarse grid.
 */
export function polygonize(
  field: Field,
  min: [number, number, number],
  max: [number, number, number],
  step: number,
): MeshData {
  const nx = Math.ceil((max[0] - min[0]) / step);
  const ny = Math.ceil((max[1] - min[1]) / step);
  const nz = Math.ceil((max[2] - min[2]) / step);
  const sx = nx + 1, sy = ny + 1, sz = nz + 1;
  const vals = new Float32Array(sx * sy * sz);
  // Sparse evaluation: probe the field at the centre of each B^3 block of cells; where the probe is farther
  // from the surface than the block's circumradius (with margin for non-exact distance fields), the block
  // cannot hold the surface and its nodes just inherit the probe value.
  const B = 4;
  const margin = 1.7 * Math.sqrt(3) * ((B * step) / 2);
  const exact = new Uint8Array(sx * sy * sz);
  const far: Array<[number, number, number, number, number, number, number]> = [];
  for (let bk = 0; bk < nz; bk += B)
    for (let bj = 0; bj < ny; bj += B)
      for (let bi = 0; bi < nx; bi += B) {
        const i1 = Math.min(bi + B, nx), j1 = Math.min(bj + B, ny), k1 = Math.min(bk + B, nz);
        const probe = field(
          min[0] + ((bi + i1) / 2) * step,
          min[1] + ((bj + j1) / 2) * step,
          min[2] + ((bk + k1) / 2) * step,
        );
        if (Math.abs(probe) > margin) {
          far.push([bi, i1, bj, j1, bk, k1, probe]);
          continue;
        }
        for (let k = bk; k <= k1; k++)
          for (let j = bj; j <= j1; j++)
            for (let i = bi; i <= i1; i++) {
              const n = i + sx * (j + sy * k);
              if (exact[n]) continue;
              vals[n] = field(min[0] + i * step, min[1] + j * step, min[2] + k * step);
              exact[n] = 1;
            }
      }
  for (const [bi, i1, bj, j1, bk, k1, probe] of far)
    for (let k = bk; k <= k1; k++)
      for (let j = bj; j <= j1; j++)
        for (let i = bi; i <= i1; i++) {
          const n = i + sx * (j + sy * k);
          if (!exact[n]) vals[n] = probe;
        }

  const cellVertex = new Int32Array(nx * ny * nz).fill(-1);
  const pos: number[] = [];
  const corner = new Float32Array(8);

  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          const [dx, dy, dz] = CORNERS[c];
          const v = vals[i + dx + sx * (j + dy + sy * (k + dz))];
          corner[c] = v;
          if (v < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let ax = 0, ay = 0, az = 0, count = 0;
        for (const [a, b] of EDGES) {
          const va = corner[a], vb = corner[b];
          if (va < 0 === vb < 0) continue;
          const t = va / (va - vb);
          ax += CORNERS[a][0] + (CORNERS[b][0] - CORNERS[a][0]) * t;
          ay += CORNERS[a][1] + (CORNERS[b][1] - CORNERS[a][1]) * t;
          az += CORNERS[a][2] + (CORNERS[b][2] - CORNERS[a][2]) * t;
          count++;
        }
        cellVertex[i + nx * (j + ny * k)] = pos.length / 3;
        pos.push(
          min[0] + (i + ax / count) * step,
          min[1] + (j + ay / count) * step,
          min[2] + (k + az / count) * step,
        );
      }

  const idx: number[] = [];
  const dims = [nx, ny, nz];
  const cellAt = (i: number, j: number, k: number) => cellVertex[i + nx * (j + ny * k)];
  for (let k = 0; k < sz; k++)
    for (let j = 0; j < sy; j++)
      for (let i = 0; i < sx; i++) {
        const node = [i, j, k];
        const va = vals[i + sx * (j + sy * k)];
        for (let a = 0; a < 3; a++) {
          const b = (a + 1) % 3, c = (a + 2) % 3;
          if (node[a] >= dims[a] || node[b] < 1 || node[c] < 1 || node[b] >= dims[b] || node[c] >= dims[c]) continue;
          const next = [i, j, k];
          next[a] += 1;
          const vb = vals[next[0] + sx * (next[1] + sy * next[2])];
          if (va < 0 === vb < 0) continue;
          const at = (db: number, dc: number) => {
            const cc = [i, j, k];
            cc[b] += db;
            cc[c] += dc;
            return cellAt(cc[0], cc[1], cc[2]);
          };
          const q0 = at(-1, -1), q1 = at(0, -1), q2 = at(0, 0), q3 = at(-1, 0);
          if (q0 < 0 || q1 < 0 || q2 < 0 || q3 < 0) continue;
          if (va < 0) idx.push(q0, q1, q2, q0, q2, q3);
          else idx.push(q0, q2, q1, q0, q3, q2);
        }
      }

  const positions = new Float32Array(pos);
  const normals = new Float32Array(positions.length);
  const eps = step * 0.6;

  // Laplacian smoothing: features thinner than a cell leave jagged edges; averaging each vertex with its
  // neighbours removes them (the projection below pulls everything back onto the surface).
  const tri = idx.length;
  const sum = new Float32Array(positions.length);
  const cnt = new Uint16Array(positions.length / 3);
  for (let pass = 0; pass < 3; pass++) {
    sum.fill(0);
    cnt.fill(0);
    for (let t = 0; t < tri; t += 3) {
      const i0 = idx[t], i1 = idx[t + 1], i2 = idx[t + 2];
      // Each corner receives its two neighbours (no allocation: this loop is hot).
      for (let c = 0; c < 3; c++) {
        const a = c === 0 ? i0 : c === 1 ? i1 : i2;
        const b = c === 0 ? i1 : c === 1 ? i2 : i0;
        const e = c === 0 ? i2 : c === 1 ? i0 : i1;
        sum[a * 3] += positions[b * 3] + positions[e * 3];
        sum[a * 3 + 1] += positions[b * 3 + 1] + positions[e * 3 + 1];
        sum[a * 3 + 2] += positions[b * 3 + 2] + positions[e * 3 + 2];
        cnt[a] += 2;
      }
    }
    for (let v = 0; v < cnt.length; v++) {
      if (!cnt[v]) continue;
      positions[v * 3] = lerp(positions[v * 3], sum[v * 3] / cnt[v], 0.55);
      positions[v * 3 + 1] = lerp(positions[v * 3 + 1], sum[v * 3 + 1] / cnt[v], 0.55);
      positions[v * 3 + 2] = lerp(positions[v * 3 + 2], sum[v * 3 + 2] / cnt[v], 0.55);
    }
  }
  for (let v = 0; v < positions.length; v += 3) {
    let x = positions[v], y = positions[v + 1], z = positions[v + 2];
    // Two projection steps onto the true surface, limited so a vertex never leaves its cell.
    for (let it = 0; it < 2; it++) {
      const d = field(x, y, z);
      const gx = field(x + eps, y, z) - field(x - eps, y, z);
      const gy = field(x, y + eps, z) - field(x, y - eps, z);
      const gz = field(x, y, z + eps) - field(x, y, z - eps);
      const g2 = gx * gx + gy * gy + gz * gz;
      if (g2 < 1e-12) break;
      const s = Math.max(-step * 0.5, Math.min(step * 0.5, d)) * (2 * eps) / g2 * 0.9;
      x -= gx * s; y -= gy * s; z -= gz * s;
    }
    const gx = field(x + eps, y, z) - field(x - eps, y, z);
    const gy = field(x, y + eps, z) - field(x, y - eps, z);
    const gz = field(x, y, z + eps) - field(x, y, z - eps);
    const len = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
    positions[v] = x; positions[v + 1] = y; positions[v + 2] = z;
    normals[v] = gx / len; normals[v + 1] = gy / len; normals[v + 2] = gz / len;
  }
  return { positions, normals, indices: new Uint32Array(idx) };
}

/** Ambient occlusion by marching a few samples along the normal: 1 = open, 0 = deeply enclosed. */
export function occlusion(field: Field, x: number, y: number, z: number, nx: number, ny: number, nz: number, scale = 1) {
  let occ = 0;
  let weight = 1;
  for (let i = 1; i <= 4; i++) {
    const h = 0.035 * i * i * scale;
    const d = field(x + nx * h, y + ny * h, z + nz * h);
    occ += Math.max(0, h - d) * weight;
    weight *= 0.62;
  }
  return clamp01(1 - occ * 2.1 / scale);
}
