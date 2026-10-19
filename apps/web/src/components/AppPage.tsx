import type { ReactNode } from "react";
import Link from "next/link";
import { Emblem } from "./Emblem";
import { PageRibbon } from "./PageRibbon";
import type { GlyphShape } from "./glyph/glyphPresets";

export function AppPage({
  eyebrow,
  title,
  description,
  children,
  back,
  backHref = "/markets",
  backLabel = "← All markets",
  banner,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  back?: boolean;
  backHref?: string;
  backLabel?: string;
  /** The glyph ribbon under the heading: a figure that fits the page (see PageRibbon). */
  banner?: GlyphShape;
}) {
  return (
    <div className="app-page">
      {back && (
        <Link className="app-back" href={backHref}>
          {backLabel}
        </Link>
      )}
      <header className="app-page-heading" data-ribbon={banner ? "true" : undefined}>
        <div className="app-page-heading-copy">
          <span className="app-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {banner && <PageRibbon shape={banner} heading />}
      </header>
      <div className="app-page-content">{children}</div>
    </div>
  );
}

export function DataState({
  title,
  children,
  retry,
  shape = "hourglass",
}: {
  title: string;
  children: ReactNode;
  retry?: () => void;
  /** The figure on the emblem: a waiting hourglass by default. */
  shape?: GlyphShape;
}) {
  return (
    <div className="data-state" role="status" data-glyph-host="">
      <Emblem shape={shape} />
      <h2>{title}</h2>
      <p>{children}</p>
      {retry && (
        <button className="app-button secondary" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
