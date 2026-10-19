/**
 * Presets for the glyph ribbon (see GlyphField.tsx). Each field is a stack of text rows; every row places a few
 * block characters (light shade to solid) at sine offsets, so the stack reads as a twisting 3D ribbon.
 *
 *   cols      glyph columns per row; later columns draw over earlier ones, and the shade ramps up with the index
 *   mag       half-width of the silhouette, as a fraction of the canvas width
 *   freqX     degrees of phase between neighbouring columns (how tightly a row is wound)
 *   freqY     degrees of phase between neighbouring rows (how steeply the strands climb)
 *   density   multiplies the 44 base rows: a higher number gives smaller glyphs
 *   height    share of the canvas the silhouette occupies; above 1 it runs off both edges. The infinity keeps its own
 *             2:1 proportion (mag is its half-width) and height only stretches it
 *   shape     diamond, hourglass, cone (one tapering band); infinity (two lobes that cross); strands, bands, spiral,
 *             blocks, opposing, wave (the figures used on the app pages and the Features stage)
 *   lean      horizontal shear from bottom to top
 */
export type GlyphShape =
  | 'diamond'
  | 'hourglass'
  | 'cone'
  | 'infinity'
  | 'strands'
  | 'bands'
  | 'spiral'
  | 'blocks'
  | 'opposing'
  | 'wave';

export interface GlyphPreset {
  shape: GlyphShape;
  speed: number;
  density: number;
  cols: number;
  mag: number;
  freqX: number;
  freqY: number;
  height: number;
  lean: number;
  /** Seed for the sand speckle. */
  seed: number;
  /** How far glyphs drift toward the sand accent, 0 to 1. */
  sandMix: number;
  /** Pointer response: how far a row near the pointer widens, and how tightly it is focused. */
  pull: number;
  widen: number;
  reach: number;
  /** Seconds of easing on the pointer; larger feels heavier. */
  momentum: number;
  /** Where the silhouette is centred, as a share of the canvas height measured from the bottom. Default 0.5. */
  centerY?: number;
  /** Overrides applied below 768px, where the canvas is tall and narrow. */
  compact?: Partial<Omit<GlyphPreset, 'compact'>>;
}

const BASE: Omit<GlyphPreset, 'shape' | 'density' | 'cols' | 'mag' | 'freqX' | 'freqY' | 'height' | 'lean'> = {
  speed: 0.35,
  seed: 24.7,
  sandMix: 0.12,
  pull: 0.13,
  widen: 2.2,
  reach: 0.12,
  momentum: 0.35,
};

/**
 * The hero ribbon: a horizontal infinity as wide as the header content (the canvas is that wide; see .landing-hero-field).
 * mag is its half-width in canvas widths: the outer strand reaches 1.1 x mag, so 0.449 leaves about 1% at each edge.
 * It starts as a flat stub and grows to full height.
 */
export const HERO_PRESET: GlyphPreset = {
  ...BASE,
  shape: 'infinity',
  density: 3.9,
  cols: 56,
  mag: 0.449,
  freqX: 37,
  freqY: 5.5,
  height: 1,
  lean: 0,
  // On a phone the infinity spans the width and sits under the copy, so the headline stays clear of it.
  compact: { cols: 44, centerY: 0.22 },
};
export const HERO_MORPH_FROM_HEIGHT = 0.15;

/** Base for the small square-ish figures (the How it works tiles). */
const TILE: Omit<GlyphPreset, 'shape' | 'freqX' | 'freqY'> = {
  ...BASE,
  density: 1.47,
  cols: 26,
  mag: 0.21,
  height: 0.7,
  lean: 0,
};

/** Ground and ink per theme; the sand accent is the same in both. */
export const GLYPH_COLORS = {
  light: { ground: '#fefdf9', ink: '#010101', accent: '#d6b376' },
  dark: { ground: '#010101', ink: '#fefdf9', accent: '#d6b376' },
} as const;

/**
 * The slim ribbon at the top of every feature page. The strip is wide and short, so it needs finer cells
 * and more columns than a tile to keep the same visual density; the winding (freqX, freqY) is the tile's, rescaled
 * for the different column and row counts.
 */
const BANNER: Omit<GlyphPreset, 'shape' | 'freqX' | 'freqY'> = {
  ...BASE,
  density: 1.05,
  cols: 64,
  mag: 0.17,
  height: 1,
  lean: 0,
};
export const BANNER_PRESETS: Record<GlyphShape, GlyphPreset> = {
  diamond: { ...BANNER, shape: 'diamond', mag: 0.2, freqX: 2.2, freqY: 33 },
  hourglass: { ...BANNER, shape: 'hourglass', mag: 0.2, freqX: 4.6, freqY: 24 },
  cone: { ...BANNER, shape: 'cone', mag: 0.2, freqX: 1.8, freqY: 12 },
  infinity: { ...BANNER, shape: 'infinity', mag: 0.16, freqX: 11, freqY: 9 },
  strands: { ...BANNER, shape: 'strands', mag: 0.2, freqX: 2.2, freqY: 16 },
  bands: { ...BANNER, shape: 'bands', mag: 0.2, freqX: 2.6, freqY: 20 },
  spiral: { ...BANNER, shape: 'spiral', mag: 0.2, freqX: 2.8, freqY: 30 },
  blocks: { ...BANNER, shape: 'blocks', mag: 0.19, freqX: 2.4, freqY: 18 },
  opposing: { ...BANNER, shape: 'opposing', mag: 0.19, freqX: 3, freqY: 17 },
  wave: { ...BANNER, shape: 'wave', mag: 0.14, freqX: 2.6, freqY: 24 },
};

/**
 * The Features stage: one wide ribbon above the cards, taller than a banner. It reuses the banner winding with a
 * coarser cell, so a single shape reads from across the page. Keyed by the shape each feature is shown with.
 */
export const STAGE_PRESETS: Record<GlyphShape, GlyphPreset> = Object.fromEntries(
  (Object.entries(BANNER_PRESETS) as Array<[GlyphShape, GlyphPreset]>).map(([shape, preset]) => [
    shape,
    { ...preset, density: 1.0, cols: 56, height: 0.96 },
  ]),
) as Record<GlyphShape, GlyphPreset>;

/**
 * The four "How it works" tiles: simple, solid figures with no sand speckle, so each one reads as a single idea.
 */
const STEP: Omit<GlyphPreset, 'shape' | 'freqX' | 'freqY'> = {
  ...TILE,
  sandMix: 0,
  density: 1.1,
  cols: 20,
  mag: 0.24,
  height: 0.8,
};
export const STEP_PRESETS = {
  /** Supply: a cone, the pool filling up. */
  supply: { ...STEP, shape: 'cone', freqX: 5, freqY: 8 } satisfies GlyphPreset,
  /** Borrow or trade: two strands moving in opposite directions. */
  borrow: { ...STEP, shape: 'opposing', freqX: 6, freqY: 14 } satisfies GlyphPreset,
  /** Auto-Protect: a diamond, a watchful shape. */
  protect: { ...STEP, shape: 'diamond', freqX: 6, freqY: 18 } satisfies GlyphPreset,
  /** Withdraw or close: an hourglass, the position running down. */
  close: { ...STEP, shape: 'hourglass', freqX: 9, freqY: 14 } satisfies GlyphPreset,
};

/**
 * Card emblems: a small ribbon, about 96 by 60 px, that signs a card with the shape of its feature. It is painted
 * as a still and moves only while its card is hovered or focused. Fewer rows and columns than a banner, with the winding
 * rescaled to match, so the shape still reads at that size.
 */
const EMBLEM: Omit<GlyphPreset, 'shape' | 'freqX' | 'freqY'> = {
  ...BASE,
  sandMix: 0,
  density: 0.5,
  cols: 26,
  mag: 0.3,
  height: 0.92,
  lean: 0,
};
// The four shapes that also appear in the How it works tiles take their winding from those (rescaled for 26 columns and
// 22 rows); the rest take it from the banner.
const EMBLEM_WINDING: Partial<Record<GlyphShape, [number, number]>> = {
  cone: [STEP_PRESETS.supply.freqX * (20 / 26), STEP_PRESETS.supply.freqY * (48 / 22)],
  opposing: [STEP_PRESETS.borrow.freqX * (20 / 26), STEP_PRESETS.borrow.freqY * (48 / 22)],
  diamond: [STEP_PRESETS.protect.freqX * (20 / 26), STEP_PRESETS.protect.freqY * (48 / 22)],
  hourglass: [STEP_PRESETS.close.freqX * (20 / 26), STEP_PRESETS.close.freqY * (48 / 22)],
};
export const EMBLEM_PRESETS: Record<GlyphShape, GlyphPreset> = Object.fromEntries(
  (Object.entries(BANNER_PRESETS) as Array<[GlyphShape, GlyphPreset]>).map(([shape, preset]) => {
    const [freqX, freqY] = EMBLEM_WINDING[shape] ?? [preset.freqX * (64 / 26), preset.freqY * (46 / 22)];
    return [shape, { ...EMBLEM, shape, mag: shape === 'infinity' ? 0.4 : shape === 'wave' ? 0.2 : 0.3, freqX, freqY }];
  }),
) as Record<GlyphShape, GlyphPreset>;

/**
 * The ribbon in a feature page's heading: it sits to the right of the title, about 450 by 200 px, so it is taller and
 * narrower than the banner strip. Same winding as the banner, a wider silhouette and slightly coarser cells.
 */
export const HEADING_PRESETS: Record<GlyphShape, GlyphPreset> = Object.fromEntries(
  (Object.entries(BANNER_PRESETS) as Array<[GlyphShape, GlyphPreset]>).map(([shape, preset]) => [
    shape,
    { ...preset, mag: Math.min(preset.mag * 1.5, 0.34), density: 0.9, cols: 52, height: 0.94 },
  ]),
) as Record<GlyphShape, GlyphPreset>;
