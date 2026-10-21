import type { GlyphPreset, GlyphShape } from './glyphPresets';

/**
 * Shared renderer for every glyph field on the page.
 *
 * One hidden WebGL2 canvas draws each visible field in turn and copies the result into that field's own 2D canvas,
 * so the page holds a single GL context however many fields it shows. A single rAF loop runs only while a field is
 * on screen and the tab is visible. With reduced motion the fields are drawn once (and again on resize, pointer or
 * theme change) instead of animating.
 */

export interface FieldColors {
  ground: string;
  ink: string;
  accent: string;
}

export interface FieldOptions {
  canvas: HTMLCanvasElement;
  /** Read on every frame, so a theme change needs no re-registration. */
  getPreset: () => GlyphPreset;
  getColors: () => FieldColors;
  /** Silhouette height to grow from on first paint (the hero). */
  morphFromHeight?: number;
  /** Rows near the pointer widen. */
  interactive?: boolean;
  /** False: paint one still frame and animate only while setLive(true) is in effect (card emblems, on hover). Default true. */
  live?: boolean;
}

interface Field {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  opts: FieldOptions;
  clock: number;
  onScreen: boolean;
  /** Pointer, smoothed (mx, my) and target (tx, ty), in canvas fractions; y is up. */
  my: number;
  ty: number;
  on: number;
  tOn: number;
  /** Seconds since a swap() began, or -1 when none is running; shown is the preset drawn last frame. */
  swapT: number;
  shown: GlyphPreset | null;
  /** False until the first frame has been painted; a field is always painted once, even while scrolling. */
  drawn: boolean;
  /** Animating. A field that is not live is painted once and then left alone. */
  live: boolean;
}

// Each glyph cell is one instanced quad. layoutCells() (below) works out where every cell sits and uploads one
// (x, y, shade) per cell; the shaders only place a small quad there and paint the glyph inside it, so the GPU does
// work in proportion to the number of cells and the pixels they cover, not to the size of the canvas.
const VERTEX = `#version 300 es
precision highp float;
precision highp int;

in vec3 aCell;              // cell centre x (0..1), centre y (0..aspect), shade 1..4
uniform vec2 uRes;
uniform vec2 uCell;         // cell width and height in the same units

out vec2 vUv;               // position inside the cell, 0..1, y up
flat out int vShade;        // 1 = light, 2 = medium, 3 = dark, 4 = solid

const vec2 CORNER[6] = vec2[6](vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(0.0, 1.0), vec2(0.0, 1.0), vec2(1.0, 0.0), vec2(1.0, 1.0));

void main() {
  vec2 corner = CORNER[gl_VertexID];
  vUv = corner;
  vShade = int(aCell.z);
  vec2 pos = aCell.xy + (corner - 0.5) * uCell;
  float aspect = uRes.y / uRes.x;
  gl_Position = vec4(pos.x * 2.0 - 1.0, pos.y / aspect * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

in vec2 vUv;
flat in int vShade;
out vec4 outColor;

uniform vec2  uRes;
uniform float uSandMix, uSeed;
uniform vec3  uGround, uInk, uAccent;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Block characters drawn inside one cell; u runs 0..1 with y up. shade 1..4 = light, medium, dark, solid.
float glyph(int shade, vec2 u) {
  if (shade >= 4) return 1.0;
  vec2 q = floor(u * 4.0);
  float quarter = (mod(q.x, 2.0) < 0.5 && mod(q.y, 2.0) < 0.5) ? 1.0 : 0.0;
  if (shade == 1) return quarter;                    // light: a quarter of the sub-cells
  if (shade == 2) return mod(q.x + q.y, 2.0);        // medium: checkerboard
  return 1.0 - quarter;                              // dark: three quarters
}

void main() {
  float aspect = uRes.y / uRes.x;
  vec2 p = gl_FragCoord.xy / uRes.x;
  float cov = glyph(vShade, vUv);
  float toAccent = uSandMix * (0.35 + 0.65 * hash21(floor(p * vec2(90.0, 90.0 * aspect)) + uSeed));
  vec3 mark = mix(uInk, uAccent, toAccent);
  outColor = vec4(mix(uGround, mark, clamp(cov, 0.0, 1.0)), 1.0);
}`;

const UNIFORMS = ['uRes', 'uCell', 'uSandMix', 'uSeed', 'uGround', 'uInk', 'uAccent'] as const;
type UniformName = (typeof UNIFORMS)[number];

interface Renderer {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  uniforms: Record<UniformName, WebGLUniformLocation | null>;
  /** Per-cell (x, y, shade), one instance each; grows when a field needs more cells. */
  cellBuffer: WebGLBuffer;
  cells: Float32Array;
}

const MAX_DPR = 1.5;
// A field is never rendered with more pixels than this; beyond it the canvas is stretched by the browser. The glyphs
// are chunky blocks, so a lower resolution costs almost nothing in looks and a lot less in fill and copy work.
const MAX_PIXELS = 1_500_000;
// The ribbons drift slowly, so 30 frames a second reads as smooth and leaves the rest of the frame to scrolling.
// If the page itself cannot keep up (a slow GPU, software rendering, a busy tab) the fields step down through these
// levels: a lower resolution first, then a lower frame rate. They climb back when the page has been calm for a while.
const QUALITY = [
  { scale: 1, ms: 1000 / 30 },
  { scale: 0.75, ms: 1000 / 30 },
  { scale: 0.55, ms: 1000 / 24 },
  { scale: 0.4, ms: 1000 / 20 },
] as const;
// While the page is scrolling (and a moment after) the fields stay as they are, so the compositor has the thread to itself.
const SCROLL_HOLD_MS = 140;
const MORPH_DELAY = 0.25;
const MORPH_SECONDS = 2.2;
// A swap() shrinks the shape to a stub, switches preset, and grows it again.
const SWAP_DOWN = 0.32;
const SWAP_UP = 0.62;
const SWAP_STUB = 0.12;

const fields = new Map<number, Field>();
let nextId = 1;
let renderer: Renderer | null = null;
let rafId = 0;
let running = false;
let lastTime = 0;
let scrollHoldUntil = 0;
// Adaptive quality: smoothed gap between animation frames, and when the level last changed.
let level = 0;
let cadence = 16.7;
let prevFrame = 0;
let levelSince = 0;
let calmSince = 0;
let climbBlockedUntil = 0;
let climbBlock = 15000;
let listening = false;
let failed = false;

const reducedMotion = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const smallScreen = () => typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 767px)').matches;

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  console.warn('[glyph] shader failed to compile:', gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

function createRenderer(): Renderer | null {
  if (failed || typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false });
  if (!gl || gl.isContextLost()) {
    failed = true;
    return null;
  }
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = vs && fs ? gl.createProgram() : null;
  if (!vs || !fs || !program) {
    failed = true;
    return null;
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[glyph] program failed to link:', gl.getProgramInfoLog(program));
    failed = true;
    return null;
  }
  gl.useProgram(program);
  gl.enable(gl.SCISSOR_TEST); // each field clears and draws only its own corner of the shared canvas
  const uniforms = {} as Renderer['uniforms'];
  for (const name of UNIFORMS) uniforms[name] = gl.getUniformLocation(program, name);

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    renderer = null;
    stop();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    renderer = createRenderer();
    start();
  });
  // One attribute, advanced per instance: the (x, y, shade) of each cell.
  const cellBuffer = gl.createBuffer();
  const location = gl.getAttribLocation(program, 'aCell');
  if (!cellBuffer || location < 0) {
    failed = true;
    return null;
  }
  gl.bindVertexArray(gl.createVertexArray());
  gl.bindBuffer(gl.ARRAY_BUFFER, cellBuffer);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 12, 0);
  gl.vertexAttribDivisor(location, 1);
  return { canvas, gl, uniforms, cellBuffer, cells: new Float32Array(3 * 4096) };
}

function getRenderer(): Renderer | null {
  if (renderer && !renderer.gl.isContextLost()) return renderer;
  renderer = createRenderer();
  return renderer;
}

const resolved = new WeakMap<GlyphPreset, GlyphPreset>();
/** A preset with its small-screen overrides applied when the viewport is narrow. */
function resolve(preset: GlyphPreset): GlyphPreset {
  if (!preset.compact || !smallScreen()) return preset;
  let merged = resolved.get(preset);
  if (!merged) {
    merged = { ...preset, ...preset.compact, compact: undefined };
    resolved.set(preset, merged);
  }
  return merged;
}

const fract = (v: number) => v - Math.floor(v);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function hash21(x: number, y: number): number {
  let px = fract(x * 123.34);
  let py = fract(y * 456.21);
  const d = px * (px + 45.32) + py * (py + 45.32);
  px += d;
  py += d;
  return fract(px * py);
}

/** Half-width of the silhouette at normalised height ny (0 bottom, 1 top); a is 0 at mid-height and 1 at the ends. */
function profile(shape: GlyphShape, ny: number, a: number): number {
  switch (shape) {
    case 'diamond': return 1 - a;
    case 'hourglass': return 0.1 + 0.9 * a;
    case 'cone': return 1 - ny;
    case 'strands': return 1 - 0.45 * a * a; // a soft barrel
    case 'bands': return Math.floor(ny * 5) % 2 === 0 ? 1 : 0.55; // stepped widths
    case 'spiral': return 0.4 + 0.6 * Math.abs(Math.cos(ny * 9.42478)); // the helix breathes
    case 'blocks': return 1; // the gaps between rooms are cut out by the caller
    case 'opposing': return 1 - 0.3 * a;
    case 'wave': return 0.45; // narrow: it travels sideways
    case 'logo': return 1; // laid out from its own strips
    default: return 0.45; // infinity is laid out from its own curve
  }
}

/**
 * The Nash N (the logo): a left stem, three parallel bands that arc over from the top left and run down to the bottom
 * right, and a right stem rising from there. Measured from Nash-Protocol-Logo.png with the N 1 tall and 2 wide in u
 * (-1 is the left stem's centre, 1 the right one's). Band k starts at height LOGO_TOP[k] on the left and ends at
 * LOGO_BOTTOM[k] on the right; between them its centre line follows a half cosine, so it leaves and meets the stems
 * level, as the logo's bends do.
 */
const LOGO_STRIPS = 5; // left stem, right stem, three bands
const LOGO_ASPECT = 0.92; // width over height of the N
const LOGO_TOP = [0.97, 0.88, 0.79];
const LOGO_BOTTOM = [0.17, 0.085, 0];
const LOGO_BAND = 0.05; // band thickness, as a share of the N's height
const LOGO_STEM = 0.08; // stem half-width in u
const LOGO_SPAN: [number, number] = [0, 0];

/** u along band k where its centre line sits at height y (clamped to the band's ends). */
function logoBandU(k: number, y: number): number {
  const s = clamp01((LOGO_TOP[k] - y) / (LOGO_TOP[k] - LOGO_BOTTOM[k]));
  return (2 * Math.acos(1 - 2 * s)) / Math.PI - 1;
}

/** Where strip `strip` crosses the row at height ny, written to span as [from, to] in u; false if it does not. */
function logoSpan(strip: number, ny: number, span: [number, number]): boolean {
  if (strip === 0) {
    // Left stem: from the foot up to where the lowest band leaves it.
    if (ny > LOGO_TOP[2]) return false;
    span[0] = -1 - LOGO_STEM;
    span[1] = -1 + LOGO_STEM;
    return true;
  }
  if (strip === 1) {
    // Right stem: from where the highest band arrives up to the top.
    if (ny < LOGO_BOTTOM[0]) return false;
    span[0] = 1 - LOGO_STEM;
    span[1] = 1 + LOGO_STEM;
    return true;
  }
  const k = strip - 2;
  const lo = ny - LOGO_BAND * 0.5;
  const hi = ny + LOGO_BAND * 0.5;
  if (lo > LOGO_TOP[k] || hi < LOGO_BOTTOM[k]) return false;
  // The band's height falls from left to right, so the row's upper edge meets it further left.
  span[0] = logoBandU(k, hi);
  span[1] = logoBandU(k, lo);
  return true;
}

const CELL_ASPECT = 0.62; // a monospace cell is about 0.62 as wide as it is tall
// Share of the canvas height the infinity may fill at most, so its top and bottom curves always stay in view.
const INFINITY_FIT = 0.92;
const BASE_ROWS = 44;

/**
 * Where every glyph cell sits, as (x, y, shade) triples written into r.cells; returns how many cells there are.
 * x runs 0..1 across the canvas and y 0..aspect upward, both measured in canvas widths. Each row places `cols` cells
 * at sine offsets around the shape's centre line, and later columns draw over earlier ones.
 */
/** Exported so a numeric test can check that the pointer widening stays inside the canvas. */
export function layoutCells(r: Renderer, p: GlyphPreset, aspect: number, time: number, height: number, mouseY: number, mouseOn: number): number {
  const cols = Math.min(64, Math.max(1, Math.floor(p.cols)));
  const rows = BASE_ROWS * p.density;
  const rowCount = Math.ceil(rows) + 1;
  if (r.cells.length < rowCount * cols * 3) r.cells = new Float32Array(rowCount * cols * 3);
  const out = r.cells;
  const cellH = aspect / rows;
  const shape = p.shape;
  const centerY = p.centerY ?? 0.5;
  // The infinity keeps its natural 2:1 proportion (its height is mag canvas widths). When the canvas is too short for
  // that, the whole figure scales down (mag shrinks) instead of being squashed or cut at the top and bottom. The fit
  // uses the preset height, not the animated one, so the width holds still while the hero grows in.
  const mag = shape === 'infinity' ? Math.min(p.mag, (INFINITY_FIT * aspect) / Math.max(p.height, 0.001)) : p.mag;
  const bandH = shape === 'infinity' ? (mag / aspect) * height : height;
  const h0 = centerY - bandH * 0.5;
  const h1 = centerY + bandH * 0.5;
  const phaseTime = time * 90;
  // How far from the centre a cell centre may sit: the canvas edge less half a cell, so the glyph is not cut off.
  const edge = 0.5 - cellH * CELL_ASPECT * 0.5;
  let n = 0;
  for (let row = 0; row < rowCount; row++) {
    const posY = (row + 0.5) * cellH;
    const nyL = posY / aspect;
    if (nyL < h0 || nyL > h1) continue;
    const ny = clamp01((nyL - h0) / Math.max(bandH, 0.001));
    const a = Math.abs(ny * 2 - 1);
    let magnitude = mag * profile(shape, ny, a);
    const lean = (ny - 0.5) * p.lean;

    // Logo: the Nash N, drawn as its five strips (see logoSpan). Each row hands its cells out to the strips the row
    // crosses; inside a strip the sine sweeps the cells from edge to edge, so the strip turns like a ribbon. The N keeps
    // its proportion (about 0.92 wide for 1 tall) and does not widen under the pointer.
    if (shape === 'logo') {
      const half = Math.min(mag, LOGO_ASPECT * 0.5 * p.height * aspect);
      const perStrip = Math.ceil(cols / LOGO_STRIPS);
      for (let i = 0; i < cols; i++) {
        const strip = i % LOGO_STRIPS;
        if (!logoSpan(strip, ny, LOGO_SPAN)) continue;
        const j = Math.floor(i / LOGO_STRIPS);
        const sine = Math.sin(((j * (360 / perStrip) + row * p.freqY + strip * 47 + phaseTime) * Math.PI) / 180);
        const u = (LOGO_SPAN[0] + LOGO_SPAN[1]) * 0.5 + (LOGO_SPAN[1] - LOGO_SPAN[0]) * 0.5 * sine;
        out[n * 3] = 0.5 + lean + half * u;
        out[n * 3 + 1] = posY;
        out[n * 3 + 2] = Math.floor((cols > 1 ? i / (cols - 1) : 0) * 3.999) + 1;
        n++;
      }
      continue;
    }

    // Blocks: four sealed rooms; the rows between them stay empty.
    if (shape === 'blocks') {
      if (fract(ny * 4) < 0.16) continue;
      magnitude *= 0.72 + 0.28 * hash21(Math.floor(ny * 4), 3);
    }
    // Wave: the whole strand slides sideways along a sine.
    const offsetX = shape === 'wave' ? mag * 1.1 * Math.sin(ny * 7.85398 + time * 60 * 0.0174533) : 0;
    // Infinity: a lemniscate, x^2 (1 - x^2) = y^2. Per row the right lobe runs from the inner edge to the outer one,
    // and the left lobe mirrors it; both meet at the crossing on the middle row.
    let lobeOuter = 0;
    let lobeInner = 0;
    if (shape === 'infinity') {
      const v = ny * 2 - 1;
      const s = Math.sqrt(Math.max(0, 1 - v * v));
      lobeOuter = mag * Math.sqrt((1 + s) * 0.5);
      lobeInner = mag * Math.sqrt((1 - s) * 0.5);
    }
    // Rows near the pointer widen, with an exponential falloff.
    const prox = mouseOn * Math.exp(-Math.abs(posY - mouseY) / Math.max(p.reach, 0.01));
    let widen = 1 + p.widen * prox * p.pull;
    // The widening only uses the room this row has left inside the canvas, so a silhouette that already spans the
    // width (the hero) swells where it can and is never cut off at the edge. The rest shape (widen = 1) is untouched.
    if (widen > 1) {
      const restExtent = shape === 'infinity' ? lobeOuter + mag * 0.1 : magnitude;
      const room = edge - Math.abs(lean) - Math.abs(offsetX) - restExtent;
      const extra = restExtent * (widen - 1);
      widen = restExtent > 0 ? 1 + (room > 0 ? room * (1 - Math.exp(-extra / room)) : 0) / restExtent : 1;
    }
    magnitude *= widen;
    lobeOuter *= widen;
    lobeInner *= widen;

    for (let i = 0; i < cols; i++) {
      const even = i % 2 === 0 ? 1 : -1;
      const rowPhase = row * p.freqY * (shape === 'opposing' ? even : 1);
      const sine = Math.sin(((i * p.freqX + rowPhase + phaseTime) * Math.PI) / 180);
      let x: number;
      if (shape === 'infinity') {
        // Four strands per row, one on each branch of the curve; the sine twists each across a ribbon of width mag * 0.1.
        const quad = i % 4;
        const side = quad < 2 ? 1 : -1;
        const base = quad % 2 === 0 ? lobeOuter : lobeInner;
        x = 0.5 + lean + side * (base + mag * 0.1 * widen * sine);
      } else {
        x = 0.5 + lean + offsetX + magnitude * sine;
      }
      out[n * 3] = x;
      out[n * 3 + 1] = posY;
      out[n * 3 + 2] = Math.floor((cols > 1 ? i / (cols - 1) : 0) * 3.999) + 1; // the shade ramps up with the column
      n++;
    }
  }
  return n;
}

function draw(r: Renderer, field: Field) {
  const { gl, uniforms: u } = r;
  const { canvas, opts } = field;
  const wanted = resolve(opts.getPreset());
  // While a swap is shrinking the old shape, keep drawing what was on screen; the new preset takes over at the stub.
  const preset = field.swapT >= 0 && field.swapT < SWAP_DOWN && field.shown ? field.shown : wanted;
  field.shown = preset;
  const colors = opts.getColors();

  const cssW = Math.max(1, canvas.clientWidth);
  const cssH = Math.max(1, canvas.clientHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR, Math.sqrt(MAX_PIXELS / (cssW * cssH))) * QUALITY[level].scale;
  const w = Math.max(1, Math.round(cssW * dpr));
  const h = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  // The shared GL canvas only grows, so fields of different sizes never make it reallocate on every frame.
  if (r.canvas.width < w || r.canvas.height < h) {
    r.canvas.width = Math.max(r.canvas.width, w);
    r.canvas.height = Math.max(r.canvas.height, h);
  }
  gl.viewport(0, 0, w, h);
  gl.scissor(0, 0, w, h);
  const ground = rgb(colors.ground);
  gl.clearColor(ground[0], ground[1], ground[2], 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // The hero grows from a stub to full height, easing out.
  const from = opts.morphFromHeight;
  const progress = reducedMotion() ? 1 : Math.max(0, Math.min(1, (field.clock - MORPH_DELAY) / MORPH_SECONDS));
  let height = from == null ? preset.height : from + (preset.height - from) * (1 - Math.pow(1 - progress, 3));
  if (field.swapT >= 0) {
    const t = field.swapT;
    const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
    const scale = t < SWAP_DOWN ? 1 - (1 - SWAP_STUB) * ease(t / SWAP_DOWN) : SWAP_STUB + (1 - SWAP_STUB) * ease((t - SWAP_DOWN) / SWAP_UP);
    height *= scale;
  }

  const aspect = h / w;
  const cellH = aspect / (BASE_ROWS * preset.density);
  const count = layoutCells(r, preset, aspect, field.clock * preset.speed, height, field.my * aspect, field.on);
  gl.uniform2f(u.uRes, w, h);
  gl.uniform2f(u.uCell, cellH * CELL_ASPECT, cellH);
  gl.uniform1f(u.uSandMix, preset.sandMix);
  gl.uniform1f(u.uSeed, preset.seed);
  gl.uniform3fv(u.uGround, ground);
  gl.uniform3fv(u.uInk, rgb(colors.ink));
  gl.uniform3fv(u.uAccent, rgb(colors.accent));
  gl.bindBuffer(gl.ARRAY_BUFFER, r.cellBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, r.cells.subarray(0, count * 3), gl.DYNAMIC_DRAW);
  if (count > 0) gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
  // The GL origin is bottom-left, and this field's pixels sit in the bottom-left w by h corner of the shared canvas.
  field.ctx.drawImage(r.canvas, 0, r.canvas.height - h, w, h, 0, 0, w, h);
  field.drawn = true;
}

const visibleFields = () => (document.hidden ? [] : [...fields.values()].filter((f) => f.onScreen));

const holdingStill = () => performance.now() < scrollHoldUntil || document.documentElement.hasAttribute('data-glyph-pause');

/** Steps the quality level down when frames arrive late, and back up after a long calm spell. */
function adapt(now: number) {
  const gap = now - prevFrame;
  prevFrame = now;
  if (gap > 250 || holdingStill()) return; // a pause or a hidden tab says nothing about speed
  cadence += (gap - cadence) * 0.08;
  if (cadence > 30 && level < QUALITY.length - 1 && now - levelSince > 700) {
    level++;
    levelSince = calmSince = now;
    cadence = 20; // start the next measurement fresh
    climbBlockedUntil = now + climbBlock;
    climbBlock = Math.min(climbBlock * 2, 240000); // each retreat makes the next climb wait longer
  } else if (cadence < 19 && level > 0 && now > climbBlockedUntil && now - calmSince > 4000) {
    level--;
    levelSince = calmSince = now;
    cadence = 17;
  } else if (cadence >= 19) {
    calmSince = now;
  }
}

function frame(now: number) {
  if (!running) return;
  rafId = requestAnimationFrame(frame);
  adapt(now);
  const since = now - lastTime;
  if (since < QUALITY[level].ms - 1.5) return;
  lastTime = now;
  const dt = Math.min(since / 1000, 0.05);
  const r = getRenderer();
  const active = visibleFields();
  if (!r || active.length === 0) {
    stop();
    return;
  }
  const still = holdingStill();
  for (const f of active) {
    // Scrolling (or a header focus veil) freezes the animation; a field that has never been painted still gets its first frame.
    if (f.drawn && (still || !f.live)) continue;
    f.clock += dt;
    if (f.swapT >= 0) f.swapT = f.swapT + dt > SWAP_DOWN + SWAP_UP ? -1 : f.swapT + dt;
    // Ease the pointer toward its target; the preset's momentum sets how heavy that feels.
    const k = 1 - Math.pow(0.5, dt / (0.012 + 0.34 * f.opts.getPreset().momentum));
    f.my += (f.ty - f.my) * k;
    f.on += (f.tOn - f.on) * k;
    draw(r, f);
  }
  // Nothing left that moves (every field is a painted still): the loop sleeps until a field wakes it.
  if (!active.some((f) => f.live || !f.drawn)) stop();
}

function start() {
  if (typeof document === 'undefined' || document.hidden) return;
  if (reducedMotion()) {
    renderStill();
    return;
  }
  if (running || visibleFields().length === 0) return;
  running = true;
  lastTime = prevFrame = performance.now();
  rafId = requestAnimationFrame(frame);
}

function stop() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}

/** Draw every visible field once; used with reduced motion, and after a theme change. */
export function renderStill() {
  const r = getRenderer();
  if (!r) return;
  for (const f of fields.values()) f.drawn = false; // an off-screen field repaints when it next appears
  for (const f of visibleFields()) draw(r, f);
}

function onPointerMove(event: PointerEvent) {
  for (const f of fields.values()) {
    if (!f.opts.interactive) continue;
    const rect = f.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    f.ty = 1 - y;
    f.tOn = x >= 0 && x <= 1 && y >= 0 && y <= 1 ? 1 : 0;
  }
  if (reducedMotion()) renderStill();
}

function onScroll() {
  scrollHoldUntil = performance.now() + SCROLL_HOLD_MS;
}

function onVisibility() {
  if (document.hidden) stop();
  else start();
}

/** Registers a canvas; returns a function that removes it. Returns null if WebGL2 is not available. */
export function registerField(
  opts: FieldOptions,
): { unregister: () => void; setOnScreen: (on: boolean) => void; swap: () => void; setLive: (live: boolean) => void; invalidate: () => void } | null {
  const ctx = opts.canvas.getContext('2d');
  if (!ctx || !getRenderer()) return null;

  const id = nextId++;
  fields.set(id, { canvas: opts.canvas, ctx, opts, clock: 0, onScreen: false, my: 0.5, ty: 0.5, on: 0, tOn: 0, swapT: -1, shown: null, drawn: false, live: opts.live !== false });

  if (!listening) {
    listening = true;
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('scroll', onScroll, { passive: true });
    // Touch screens have no hover, so the pointer response is only wired up on larger screens.
    if (!smallScreen()) window.addEventListener('pointermove', onPointerMove, { passive: true });
  }

  return {
    setOnScreen(on: boolean) {
      const f = fields.get(id);
      if (!f) return;
      f.onScreen = on;
      if (on && reducedMotion()) {
        // Nothing animates: paint just this field once, not every visible one.
        const r = getRenderer();
        if (r && !document.hidden) draw(r, f);
      } else if (on) start();
      else if (visibleFields().length === 0) stop();
    },
    /** A field that is not live animates only while this is true (card emblems: while the card is hovered or focused). */
    setLive(live: boolean) {
      const f = fields.get(id);
      if (!f) return;
      f.live = live;
      if (live && f.onScreen && !reducedMotion()) start();
    },
    /** The canvas changed size: paint it again. */
    invalidate() {
      const f = fields.get(id);
      if (!f) return;
      f.drawn = false;
      if (!f.onScreen) return;
      if (reducedMotion()) {
        const r = getRenderer();
        if (r && !document.hidden) draw(r, f);
      } else start();
    },
    /** Call after the preset changed: the shape collapses to a stub and regrows as the new one. */
    swap() {
      const f = fields.get(id);
      if (!f) return;
      if (reducedMotion()) {
        f.shown = null;
        renderStill();
        return;
      }
      f.swapT = 0;
      start();
    },
    unregister() {
      fields.delete(id);
      if (visibleFields().length === 0) stop();
      if (fields.size === 0 && listening) {
        listening = false;
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('pointermove', onPointerMove);
      }
    },
  };
}
