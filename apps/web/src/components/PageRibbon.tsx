import { GlyphField } from "./glyph/GlyphField";
import { BANNER_PRESETS, HEADING_PRESETS, type GlyphShape } from "./glyph/glyphPresets";

/**
 * The slim glyph ribbon at the top of a feature page. Each page has its own figure, the same one its card shows in the
 * landing Features section (the Nash N for earn, a padlock for lending, long and short arrows for trade, a pagoda for
 * China equities, the bonding curve for Pons), plus price candles for the markets, an allocation ring for the portfolio
 * and a bar chart for analytics. It follows the pointer and is decorative.
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
