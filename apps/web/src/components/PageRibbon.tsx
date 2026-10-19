import { GlyphField } from "./glyph/GlyphField";
import { BANNER_PRESETS, HEADING_PRESETS, type GlyphShape } from "./glyph/glyphPresets";

/**
 * The slim glyph ribbon at the top of a feature page. Each page has its own figure (strands for the market directory,
 * bands for China equities, a spiral for Pons, sealed blocks for lending, opposing strands for trade, a rising cone
 * for earn, layered diamonds for the portfolio, a wave for analytics). It follows the pointer and is decorative.
 * `heading` places it beside the page title (AppPage); `compact` is the thin strip the trade workspace uses.
 */
export function PageRibbon({ shape, compact = false, heading = false }: { shape: GlyphShape; compact?: boolean; heading?: boolean }) {
  const preset = heading ? HEADING_PRESETS[shape] : BANNER_PRESETS[shape];
  return (
    <div className={`app-banner${compact ? " app-banner-compact" : ""}${heading ? " app-banner-heading" : ""}`} aria-hidden="true">
      <GlyphField preset={preset} className="absolute inset-0" />
    </div>
  );
}
