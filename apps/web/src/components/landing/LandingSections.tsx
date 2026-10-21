'use client';

import React from 'react';
import { GlyphField } from '../glyph/GlyphField';
import { HERO_MORPH_FROM_HEIGHT, HERO_PRESET } from '../glyph/glyphPresets';
import { LandingButton } from './LandingButton';

/**
 * Hero: the infinity ribbon fills the first screen below the header and scales to fit it whole; the copy sits on a soft
 * scrim so it stays readable over the glyphs. On phones the copy comes first and the ribbon sits beneath it.
 */
export function LandingHero() {
  return (
    <section className="landing-hero" aria-labelledby="hero-title">
      {/* The ribbon spans the same width as the header and the page sections, not the whole viewport. */}
      <div className="landing-hero-field">
        <GlyphField preset={HERO_PRESET} morphFromHeight={HERO_MORPH_FROM_HEIGHT} />
      </div>

      <div className="landing-hero-copy">
        <div className="landing-stack">
          <div className="landing-scrim" aria-hidden="true" />
          <h1 id="hero-title" className="landing-h1 rise" style={{ ['--rise-delay' as string]: '0.1s' }}>
            Equilibrium for Onchain Equities
          </h1>
          <p className="landing-lede rise" style={{ ['--rise-delay' as string]: '0.25s' }}>
            The credit and leverage layer for tokenized stocks and ETFs on Robinhood Chain. Isolated markets,
            aligned incentives.
          </p>
          <div className="landing-ctas rise" style={{ ['--rise-delay' as string]: '0.45s' }}>
            <LandingButton href="/markets" variant="silver">
              Explore markets
            </LandingButton>
            <LandingButton href="#features" variant="outline">
              What is Nash?
            </LandingButton>
          </div>
        </div>
      </div>
    </section>
  );
}
