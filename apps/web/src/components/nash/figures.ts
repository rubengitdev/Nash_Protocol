/**
 * The two hero characters, carved as signed-distance fields and meshed once at load.
 *
 *  - Satoshi: a hooded figure with no face, only a deep void under the hood.
 *  - Nash: a marble bust, a stylised statue in the classical manner (not a portrait).
 *
 * Pure math, no THREE: this runs inside a Web Worker (figures.worker.ts). Both are modelled in their
 * own local space, facing +z, y up.
 */

import {
  type Field, cap, clamp01, ell, ellRotZ, etorus, fbm, lerp, occlusion, polygonize, smax, smin, smoothstep, sph, vnoise,
} from './sculpt';

// --- Nash: the marble bust ------------------------------------------------------------------------
export function nashField(x: number, y: number, z: number): number {
  const bound = ell(x, y, z, 0, -0.35, -0.05, 1.15, 1.5, 0.78);
  if (bound > 0.3) return bound;
  const ax = Math.abs(x); // every symmetric feature is built from |x|

  // Skull, mid-face, jaw and chin.
  let d = ell(x, y, z, 0, 0.17, -0.07, 0.49, 0.49, 0.57);
  d = smin(d, ell(x, y, z, 0, -0.1, 0.13, 0.395, 0.42, 0.41), 0.18);
  d = smin(d, ell(x, y, z, 0, -0.34, 0.06, 0.365, 0.26, 0.38), 0.15);
  d = smin(d, ell(x, y, z, 0, -0.54, 0.28, 0.19, 0.13, 0.16), 0.07);
  d = smin(d, sph(ax, y, z, 0.27, -0.1, 0.24, 0.12), 0.1); // cheekbones
  d = smin(d, ell(ax, y, z, 0, 0.1, 0.45, 0.38, 0.085, 0.13), 0.07); // brow ridge

  // Eyes: carve a socket, set a blank statue eyeball in it, then bring the lids over it. The outer corners
  // sit a little higher than the inner ones.
  const ey = y - 0.2 * (ax - 0.16);
  d = smax(d, -sph(ax, ey, z, 0.16, 0.06, 0.58, 0.135), 0.07);
  d = smin(d, ell(ax, ey, z, 0.16, 0.06, 0.455, 0.092, 0.094, 0.096), 0.02);
  d = smin(d, ell(ax, ey, z, 0.16, 0.162, 0.475, 0.096, 0.022, 0.085), 0.045); // upper lid
  d = smin(d, ell(ax, ey, z, 0.16, -0.045, 0.475, 0.08, 0.016, 0.07), 0.05); // lower lid
  d = smax(d, -sph(ax, ey, z, 0.16, 0.06, 0.575, 0.034), 0.014); // carved pupil
  d = smax(d, -cap(x, y, z, 0, 0.13, 0.5, 0, 0.04, 0.52, 0.02), 0.025); // brow furrow

  // Nose.
  const bridge = cap(x, y, z, 0, 0.09, 0.46, 0, -0.1, 0.585, 0.046);
  const tip = sph(x, y, z, 0, -0.15, 0.615, 0.062);
  const wings = sph(ax, y, z, 0.06, -0.14, 0.57, 0.04);
  d = smin(d, smin(smin(bridge, tip, 0.06), wings, 0.04), 0.05);
  d = smax(d, -sph(ax, y, z, 0.03, -0.185, 0.6, 0.022), 0.012); // nostrils

  // Mouth: two lips, the line between them, and the folds that frame it.
  const lips = smin(
    ell(x, y, z, 0, -0.25, 0.52, 0.115, 0.034, 0.05),
    ell(x, y, z, 0, -0.31, 0.51, 0.1, 0.036, 0.05),
    0.012,
  );
  d = smin(d, lips, 0.025);
  d = smax(d, -ell(x, y, z, 0, -0.28, 0.555, 0.125, 0.007, 0.07), 0.01);

  // Ears.
  d = smin(d, ell(ax, y, z, 0.47, -0.03, -0.07, 0.055, 0.14, 0.085), 0.04);
  d = smax(d, -sph(ax, y, z, 0.52, -0.02, -0.03, 0.04), 0.02);

  // Hair: a short, side-parted cap, cut at a hairline that drops at the temples and the nape.
  const hairline = 0.32 - 0.5 * smoothstep(0.2, 0.5, ax) - 0.5 * smoothstep(-0.05, -0.5, z);
  let hair = ell(x, y, z, 0, 0.23, -0.09, 0.525, 0.53, 0.615);
  hair = smin(hair, ell(x, y, z, -0.1, 0.47, 0.27, 0.3, 0.13, 0.2), 0.1); // lift at the front
  hair = smax(hair, hairline - y, 0.07);
  {
    const part = (x - (0.16 - 0.12 * Math.max(0, z))) / 0.014;
    hair += 0.02 * Math.exp(-part * part); // the parting, a shallow groove
  }
  hair += 0.008 * Math.sin(36 * (0.9 * x + 0.25 * z + 0.35 * y)); // strands
  d = smin(d, hair, 0.03);

  // Neck, shoulders, and a suit with lapels and a tie.
  d = smin(d, cap(x, y, z, 0, -0.45, -0.04, 0, -1.15, -0.06, 0.19), 0.16);
  let body = ell(x, y, z, 0, -1.3, -0.05, 0.96, 0.36, 0.48);
  body = smin(body, ell(ax, y, z, 0.4, -1.06, -0.08, 0.36, 0.2, 0.32), 0.18); // trapezius
  d = smin(d, body, 0.28);
  d = smin(d, ellRotZ(ax, y, z, 0.2, -1.12, 0.36, 0.055, 0.34, 0.07, 0.4), 0.05); // lapels
  d = smin(d, ell(ax, y, z, 0.12, -0.84, 0.15, 0.085, 0.045, 0.05), 0.04); // collar points
  d = smin(d, sph(x, y, z, 0, -0.93, 0.23, 0.042), 0.03); // tie knot
  d = smin(d, ell(x, y, z, 0, -1.2, 0.34, 0.034, 0.24, 0.026), 0.03); // tie
  d += 0.006 * Math.sin(16 * ax + 5 * y) * smoothstep(-1.0, -1.3, y); // carved drapery

  return Math.max(d, -1.66 - y); // bust cut
}

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

const BG = hex(0x050a18);
const MARBLE = hex(0xcfd9e8);
const MARBLE_SHADE = hex(0x9fb0cc);
const VEIN = hex(0x6a7da3);
const CLOTH = hex(0x0b1633);

export interface FigureMesh {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}
export type FigureName = 'nash' | 'satoshi';
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

export function buildFigureMesh(which: FigureName, quality: Quality = 'high'): FigureMesh {
  const coarse = quality === 'low' ? 1.3 : 1;
  if (which === 'nash') {
    return carve(nashField, [-1.3, -1.7, -0.9], [1.3, 0.95, 0.9], 0.024 * coarse, ({ x, y, z, ao }, out) => {
      // Marble: a pale body, soft cloudy shading, and thin veins from ridged noise.
      out[0] = MARBLE[0]; out[1] = MARBLE[1]; out[2] = MARBLE[2];
      mix(out, MARBLE_SHADE, clamp01(fbm(x * 1.8 + 3, y * 1.8, z * 1.8, 3) * 1.15 - 0.15));
      const ridge = 1 - Math.abs(fbm(x * 3.4, y * 3.4 + 7, z * 3.4, 4) * 2 - 1);
      mix(out, VEIN, smoothstep(0.86, 0.985, ridge) * 0.55);
      // Occlusion deepens the sockets and the folds, then the lower bust dissolves into the dark.
      scale(out, lerp(0.3, 1, ao));
      mix(out, BG, smoothstep(-0.95, -1.62, y));
    });
  }
  return carve(satoshiField, [-1.75, -1.8, -0.95], [1.75, 1.25, 1.0], 0.034 * coarse, ({ x, y, z, ao }, out) => {
    out[0] = CLOTH[0]; out[1] = CLOTH[1]; out[2] = CLOTH[2];
    scale(out, (0.8 + 0.4 * vnoise(x * 6, y * 6, z * 6)) * lerp(0.35, 1, ao));
    // Inside the opening the cloth gives way to a pure void.
    scale(out, smoothstep(0.015, 0.11, cavity(x, y, z)));
    mix(out, BG, smoothstep(-1.0, -1.7, y) * 0.8);
  });
}
