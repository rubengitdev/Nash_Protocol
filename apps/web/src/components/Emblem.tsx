'use client';

import { GlyphField } from './glyph/GlyphField';
import { EMBLEM_PRESETS, type GlyphShape } from './glyph/glyphPresets';

/**
 * A card's signature: a small glyph ribbon in a hairline frame. It sits still until the card around it (.fx-card or
 * [data-glyph-host]) is hovered or focused, then drifts. Decorative.
 */
export function Emblem({ shape, className = '' }: { shape: GlyphShape; className?: string }) {
  return (
    <span className={`emblem ${className}`} aria-hidden="true">
      <GlyphField preset={EMBLEM_PRESETS[shape]} interactive={false} liveOnHover />
    </span>
  );
}
