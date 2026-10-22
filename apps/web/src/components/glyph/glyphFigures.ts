/**
 * Figures: glyph shapes drawn as a silhouette instead of a winding (see layoutFigure in glyphEngine.ts). Each figure is a
 * few parts (rectangles, polygons, rings, strokes) on a frame 1 tall and `aspect` wide, x centred on 0 and y from 0 at
 * the bottom to 1 at the top. For each text row the engine asks where the row crosses every part, and sweeps that
 * part's cells across each crossing with a sine, so the part turns like a ribbon inside its outline. A part can be cut
 * by holes (a keyhole, the gaps of a ring chart), and `dir` sets which way its twist climbs.
 *
 * Every figure stands for one feature, the same on the landing Features stage, the card emblems and the app pages:
 *   lock      Lending: collateral locked in its own sealed market
 *   arrows    Trade: a long arrow up beside a short arrow down
 *   pagoda    China Equities: tiered roofs
 *   curve     Pons: the bonding curve a token climbs before it graduates, on its axes
 *   shield    Auto-Protect: a shield with a check cut through it
 *   candles   Markets: a rising run of price candles
 *   ring      Portfolio: an allocation ring in three slices
 *   bars      Analytics: a bar chart on its baseline
 */

type Point = [number, number];

type Part =
  | { kind: 'rect'; x0: number; x1: number; y0: number; y1: number }
  | { kind: 'poly'; points: Point[] }
  | { kind: 'ring'; cx: number; cy: number; ro: number; ri: number }
  | { kind: 'stroke'; points: Point[]; r: number };

interface FigurePart {
  part: Part;
  /** Which way the twist climbs: 1 up the figure, -1 down it. */
  dir?: 1 | -1;
  holes?: Part[];
}

export interface Figure {
  /** Width over height. */
  aspect: number;
  parts: FigurePart[];
}

export type FigureShape = 'lock' | 'arrows' | 'pagoda' | 'curve' | 'shield' | 'candles' | 'ring' | 'bars';

const rect = (x0: number, x1: number, y0: number, y1: number): Part => ({ kind: 'rect', x0, x1, y0, y1 });
const poly = (points: Point[]): Part => ({ kind: 'poly', points });
const mirror = (half: Point[]): Point[] => [...half, ...half.slice().reverse().map(([x, y]): Point => [-x, y])];

/** A wedge from the centre of a ring outward at `deg`, `w` wide: the gap between two slices. */
function gap(cx: number, cy: number, deg: number, w: number, len: number): Part {
  const a = (deg * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const nx = -dy * w * 0.5;
  const ny = dx * w * 0.5;
  return poly([
    [cx + nx, cy + ny],
    [cx + dx * len + nx, cy + dy * len + ny],
    [cx + dx * len - nx, cy + dy * len - ny],
    [cx - nx, cy - ny],
  ]);
}

/** The bonding curve, y = x^2.4 over the frame, sampled finely enough that the stroke reads as one smooth line. */
const BONDING: Point[] = Array.from({ length: 33 }, (_, k): Point => {
  const s = k / 32;
  return [-0.56 + 1.16 * s, 0.1 + 0.86 * Math.pow(s, 2.4)];
});

/**
 * The left half of the shield, from the middle of its top edge round to its point: a slight peak, straight flanks down
 * to 0.55, then curving in to the point at the bottom.
 */
const SHIELD_LEFT: Point[] = [
  [0, 1],
  [-0.2, 0.95],
  [-0.4, 0.92],
  ...[0.55, 0.42, 0.3, 0.19, 0.1, 0.04].map((y): Point => [-0.4 * Math.sin((y / 0.55) * Math.PI * 0.5), y]),
  [0, 0],
];

const PAGODA_TIERS = [
  // y0, eave (roof bottom), top of roof, body half-width, eave half-width, roof-top half-width
  [0.06, 0.18, 0.37, 0.27, 0.5, 0.2],
  [0.37, 0.47, 0.64, 0.2, 0.4, 0.14],
  [0.64, 0.72, 0.88, 0.13, 0.3, 0.05],
] as const;

/** A roof: a flared band, wider at the eave, its edge curving in toward the top. */
function roof(y0: number, y1: number, eave: number, top: number): Part {
  const half: Point[] = [];
  for (let k = 0; k <= 6; k++) {
    const s = k / 6;
    half.push([-(top + (eave - top) * Math.pow(1 - s, 2)), y0 + (y1 - y0) * s]);
  }
  return poly(mirror(half.reverse()));
}

export const FIGURES: Record<FigureShape, Figure> = {
  lock: {
    aspect: 0.78,
    parts: [
      // The shackle: a half ring on two legs.
      { part: { kind: 'ring', cx: 0, cy: 0.69, ro: 0.29, ri: 0.18 }, holes: [rect(-1, 1, 0, 0.69)] },
      { part: rect(-0.29, -0.18, 0.56, 0.7) },
      { part: rect(0.18, 0.29, 0.56, 0.7), dir: -1 },
      // The body, with its keyhole.
      {
        part: rect(-0.39, 0.39, 0, 0.58),
        holes: [
          { kind: 'ring', cx: 0, cy: 0.36, ro: 0.075, ri: 0 },
          poly([
            [-0.035, 0.36],
            [0.035, 0.36],
            [0.06, 0.13],
            [-0.06, 0.13],
          ]),
        ],
      },
    ],
  },
  arrows: {
    aspect: 0.9,
    parts: [
      // Long: up on the left, its twist climbing.
      { part: rect(-0.305, -0.155, 0, 0.6) },
      {
        part: poly([
          [-0.45, 0.58],
          [-0.01, 0.58],
          [-0.23, 1],
        ]),
      },
      // Short: down on the right, its twist falling.
      { part: rect(0.155, 0.305, 0.4, 1), dir: -1 },
      {
        part: poly([
          [0.01, 0.42],
          [0.45, 0.42],
          [0.23, 0],
        ]),
        dir: -1,
      },
    ],
  },
  pagoda: {
    aspect: 1,
    parts: [
      { part: rect(-0.44, 0.44, 0, 0.05) },
      ...PAGODA_TIERS.flatMap(([y0, eaveY, topY, body, eave, top], i): FigurePart[] => [
        { part: rect(-body, body, y0, eaveY), dir: i % 2 === 0 ? 1 : -1 },
        { part: roof(eaveY, topY, eave, top) },
      ]),
      { part: rect(-0.025, 0.025, 0.88, 1) },
    ],
  },
  curve: {
    aspect: 1.3,
    parts: [
      // The axes, then the curve climbing from the flat start to where the token graduates.
      { part: rect(-0.65, -0.6, 0, 1), dir: -1 },
      { part: rect(-0.65, 0.65, 0, 0.05) },
      { part: { kind: 'stroke', points: BONDING, r: 0.05 } },
      { part: { kind: 'ring', cx: BONDING[32][0], cy: BONDING[32][1], ro: 0.06, ri: 0 } },
    ],
  },
  shield: {
    aspect: 0.8,
    parts: [
      {
        part: poly(mirror(SHIELD_LEFT)),
        holes: [
          {
            kind: 'stroke',
            points: [
              [-0.17, 0.53],
              [-0.04, 0.39],
              [0.19, 0.68],
            ],
            r: 0.045,
          },
        ],
      },
    ],
  },
  candles: {
    aspect: 1.35,
    parts: [
      // x, wick low, wick high, body low, body high, falling
      ...(
        [
          [-0.56, 0.04, 0.42, 0.12, 0.34, false],
          [-0.28, 0.2, 0.6, 0.28, 0.52, false],
          [0, 0.16, 0.66, 0.24, 0.46, true],
          [0.28, 0.36, 0.84, 0.44, 0.76, false],
          [0.56, 0.56, 1, 0.64, 0.92, false],
        ] as const
      ).flatMap(([x, w0, w1, b0, b1, falling]): FigurePart[] => {
        const dir = falling ? -1 : 1;
        return [
          { part: rect(x - 0.016, x + 0.016, w0, w1), dir },
          { part: rect(x - 0.09, x + 0.09, b0, b1), dir },
        ];
      }),
    ],
  },
  ring: {
    aspect: 1,
    parts: [
      {
        part: { kind: 'ring', cx: 0, cy: 0.5, ro: 0.5, ri: 0.29 },
        holes: [gap(0, 0.5, 90, 0.07, 0.6), gap(0, 0.5, 222, 0.07, 0.6), gap(0, 0.5, 318, 0.07, 0.6)],
      },
    ],
  },
  bars: {
    aspect: 1.3,
    parts: [
      { part: rect(-0.65, 0.65, 0, 0.04) },
      ...[0.36, 0.56, 0.46, 0.74, 0.62, 1].map(
        (top, i): FigurePart => ({ part: rect(-0.6 + i * 0.226, -0.6 + i * 0.226 + 0.15, 0.08, top), dir: i % 2 === 0 ? 1 : -1 }),
      ),
    ],
  },
};

export const isFigure = (shape: string): shape is FigureShape => Object.prototype.hasOwnProperty.call(FIGURES, shape);

/** Pushes the [from, to] intervals where the row at height y crosses `part` onto out (flat pairs); returns how many. */
function crossings(part: Part, y: number, rowH: number, out: number[]): number {
  switch (part.kind) {
    case 'rect': {
      if (y < part.y0 || y > part.y1) return 0;
      out.push(part.x0, part.x1);
      return 1;
    }
    case 'ring': {
      const dy = y - part.cy;
      if (Math.abs(dy) > part.ro) return 0;
      const outer = Math.sqrt(part.ro * part.ro - dy * dy);
      if (Math.abs(dy) >= part.ri) {
        out.push(-outer + part.cx, outer + part.cx);
        return 1;
      }
      const inner = Math.sqrt(part.ri * part.ri - dy * dy);
      out.push(part.cx - outer, part.cx - inner, part.cx + inner, part.cx + outer);
      return 2;
    }
    case 'poly': {
      // Even-odd scanline: the x where each edge crosses the row, sorted and taken in pairs.
      const xs: number[] = [];
      const pts = part.points;
      for (let k = 0; k < pts.length; k++) {
        const [x0, y0] = pts[k];
        const [x1, y1] = pts[(k + 1) % pts.length];
        if (y0 === y1) continue;
        if (y >= Math.min(y0, y1) && y < Math.max(y0, y1)) {
          xs.push(x0 + ((y - y0) / (y1 - y0)) * (x1 - x0));
        }
      }
      xs.sort((a, b) => a - b);
      let n = 0;
      for (let k = 0; k + 1 < xs.length; k += 2) {
        out.push(xs[k], xs[k + 1]);
        n++;
      }
      return n;
    }
    case 'stroke': {
      // A line of discs along the polyline: each segment contributes the span of the capsule around it at this row,
      // and overlapping spans are merged. A row is thick, so a disc counts if it reaches the row's middle half.
      const spans: number[] = [];
      const r = part.r;
      const pts = part.points;
      for (let k = 0; k + 1 < pts.length; k++) {
        const [ax, ay] = pts[k];
        const [bx, by] = pts[k + 1];
        const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / (r * 0.4)));
        for (let s = 0; s <= steps; s++) {
          const cx = ax + ((bx - ax) * s) / steps;
          const cy = ay + ((by - ay) * s) / steps;
          const dy = Math.max(0, Math.abs(y - cy) - rowH * 0.25);
          if (dy > r) continue;
          const half = Math.sqrt(r * r - dy * dy);
          spans.push(cx - half, cx + half);
        }
      }
      return pushMerged(spans, out);
    }
  }
}

/** Sorts flat [from, to] pairs, merges the ones that overlap and pushes the result onto out; returns how many. */
function pushMerged(spans: number[], out: number[]): number {
  if (spans.length === 0) return 0;
  const order = Array.from({ length: spans.length / 2 }, (_, k) => k).sort((a, b) => spans[a * 2] - spans[b * 2]);
  let from = spans[order[0] * 2];
  let to = spans[order[0] * 2 + 1];
  let n = 0;
  for (let k = 1; k < order.length; k++) {
    const a = spans[order[k] * 2];
    const b = spans[order[k] * 2 + 1];
    if (a <= to) {
      to = Math.max(to, b);
    } else {
      out.push(from, to);
      n++;
      from = a;
      to = b;
    }
  }
  out.push(from, to);
  return n + 1;
}

const scratch: number[] = [];
const holeScratch: number[] = [];

/**
 * Where the row at height y (0..1) crosses part `index` of the figure, holes removed, as flat [from, to] pairs in frame
 * x pushed onto out. rowH is the row's height on the same frame. Returns how many intervals were pushed.
 */
export function figureSpans(figure: Figure, index: number, y: number, rowH: number, out: number[]): number {
  const { part, holes } = figure.parts[index];
  scratch.length = 0;
  const n = crossings(part, y, rowH, scratch);
  if (n === 0) return 0;
  if (!holes || holes.length === 0) {
    for (let k = 0; k < n * 2; k++) out.push(scratch[k]);
    return n;
  }
  holeScratch.length = 0;
  for (const hole of holes) crossings(hole, y, rowH, holeScratch);
  let pushed = 0;
  for (let k = 0; k < n; k++) {
    // Cut every hole out of this interval, left to right.
    let from = scratch[k * 2];
    const to = scratch[k * 2 + 1];
    const cuts: number[] = [];
    for (let h = 0; h < holeScratch.length; h += 2) {
      const a = Math.max(from, holeScratch[h]);
      const b = Math.min(to, holeScratch[h + 1]);
      if (b > a) cuts.push(a, b);
    }
    const merged: number[] = [];
    pushMerged(cuts, merged);
    for (let c = 0; c < merged.length; c += 2) {
      if (merged[c] > from) {
        out.push(from, merged[c]);
        pushed++;
      }
      from = Math.max(from, merged[c + 1]);
    }
    if (to > from) {
      out.push(from, to);
      pushed++;
    }
  }
  return pushed;
}
