/**
 * The two hero characters, carved as signed-distance fields and meshed once at load.
 *
 * Satoshi: a hooded figure with no face, only a deep void under the hood.
 *
 * Pure math, no THREE: this runs inside a Web Worker (figures.worker.ts). Modelled in its own local
 * space, facing +z, y up.
 */

import { type Field, cap, ell, etorus, fbm, lerp, occlusion, polygonize, smax, smin, smoothstep, sph, vnoise } from './sculpt';

// --- Satoshi: the hooded figure --------------------------------------------------------------------
const CAVITY = { cx: 0, cy: 0.28, cz: 0.62, rx: 0.33, ry: 0.46, rz: 0.44 };
function cavity(x: number, y: number, z: number) {
  return ell(x, y, z, CAVITY.cx, CAVITY.cy, CAVITY.cz, CAVITY.rx, CAVITY.ry, CAVITY.rz);
}

export function satoshiField(x: number, y: number, z: number): number {
  const bound = ell(x, y, z, 0, -0.35, 0, 1.6, 1.55, 0.85);
  if (bound > 0.3) return bound;
  const ax = Math.abs(x);

  // Hood dome with a cowl that sweeps up and back to a peak.
  let d = ell(x, y, z, 0, 0.38, 0, 0.66, 0.8, 0.7);
  d = smin(d, ell(x, y, z, 0, 0.7, -0.42, 0.34, 0.58, 0.38), 0.3);
  d = smin(d, ell(x, y, z, 0, 0.8, 0.38, 0.42, 0.1, 0.22), 0.14); // brim

  // Slumped shoulders, the hood pooling over them, and a bunched collar.
  let shoulders = ell(x, y, z, 0, -0.78, -0.02, 1.12, 0.62, 0.55);
  shoulders = smin(shoulders, ell(ax, y, z, 0.98, -1.2, 0.04, 0.32, 0.62, 0.36), 0.25);
  d = smin(d, shoulders, 0.4);
  d = smin(d, ell(x, y, z, 0, -0.26, 0.04, 0.74, 0.17, 0.64), 0.16);

  // The face: a deep opening with a thick, rolled rim.
  d = smax(d, -cavity(x, y, z), 0.06);
  d = smin(d, etorus(x, y, z, 0, 0.28, 0.56, 0.42, 0.54, 0.07), 0.05);

  // Drawstrings and their tips.
  const strings = Math.min(
    cap(ax, y, z, 0.2, -0.15, 0.6, 0.17, -0.7, 0.6, 0.022),
    sph(ax, y, z, 0.17, -0.74, 0.6, 0.042),
  );
  d = smin(d, strings, 0.03);

  // Folds in the cloth: long drapes below, a little grain. Only near the surface, where it can be seen.
  if (Math.abs(d) < 0.15) {
    d += 0.018 * Math.sin(9 * y + 2.2 * Math.sin(4 * x + 1.3)) * smoothstep(0.1, -0.5, y);
    d += 0.012 * (vnoise(x * 3, y * 3, z * 3) - 0.5);
  }

  return Math.max(d, -1.72 - y);
}

// --- colour (linear RGB) ---------------------------------------------------------------------------
type RGB = [number, number, number];
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const hex = (h: number): RGB => [toLinear(((h >> 16) & 255) / 255), toLinear(((h >> 8) & 255) / 255), toLinear((h & 255) / 255)];
const mix = (out: RGB, to: RGB, t: number) => {
  out[0] = lerp(out[0], to[0], t); out[1] = lerp(out[1], to[1], t); out[2] = lerp(out[2], to[2], t);
};
const scale = (out: RGB, k: number) => { out[0] *= k; out[1] *= k; out[2] *= k; };

const BG = hex(0x000000);
const CLOTH = hex(0x161616);

export interface FigureMesh {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}
export type Quality = 'high' | 'low';

type Paint = (p: { x: number; y: number; z: number; ao: number }, out: RGB) => void;

function carve(field: Field, min: [number, number, number], max: [number, number, number], step: number, paint: Paint): FigureMesh {
  const mesh = polygonize(field, min, max, step);
  const count = mesh.positions.length / 3;
  const colors = new Float32Array(count * 3);
  const rgb: RGB = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    const x = mesh.positions[i * 3], y = mesh.positions[i * 3 + 1], z = mesh.positions[i * 3 + 2];
    const ao = occlusion(field, x, y, z, mesh.normals[i * 3], mesh.normals[i * 3 + 1], mesh.normals[i * 3 + 2]);
    paint({ x, y, z, ao }, rgb);
    colors[i * 3] = rgb[0]; colors[i * 3 + 1] = rgb[1]; colors[i * 3 + 2] = rgb[2];
  }
  return { ...mesh, colors };
}

export function buildFigureMesh(quality: Quality = 'high'): FigureMesh {
  const coarse = quality === 'low' ? 1.3 : 1;
  return carve(satoshiField, [-1.75, -1.8, -0.95], [1.75, 1.25, 1.0], 0.034 * coarse, ({ x, y, z, ao }, out) => {
    out[0] = CLOTH[0]; out[1] = CLOTH[1]; out[2] = CLOTH[2];
    scale(out, (0.8 + 0.4 * vnoise(x * 6, y * 6, z * 6)) * lerp(0.35, 1, ao));
    // Inside the opening the cloth gives way to a pure void.
    scale(out, smoothstep(0.015, 0.11, cavity(x, y, z)));
    mix(out, BG, smoothstep(-1.0, -1.7, y) * 0.8);
  });
}
