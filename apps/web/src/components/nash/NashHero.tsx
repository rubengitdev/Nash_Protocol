'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { CABadge } from '../CABadge';
import { env } from '../../env.mjs';
import { useNetworkMode } from '../../hooks/useNetworkMode';

// three.js is only needed here, and only in the browser.
const NashHeroScene = dynamic(() => import('./NashHeroScene'), { ssr: false });

export function NashHero() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onFail = useCallback(() => setFailed(true), []);
  const tokenCA = env.TOKEN_CA ?? '';
  const { isTestnet } = useNetworkMode();
  // Mainnet markets launch capped at 1.5x; testnet runs the full 2.5x range.
  const maxLeverage = isTestnet ? '2.5×' : '1.5×';

  return (
    <section className="nash-hero" data-ready={ready || failed ? 'true' : 'false'} aria-labelledby="hero-title">
      <div className="nash-hero-grid" aria-hidden="true" />
      {failed ? (
        <div className="nash-hero-fallback" aria-hidden="true">
          <img src="/brand/nash-mark.png" alt="" width={420} height={388} />
        </div>
      ) : (
        <NashHeroScene onReady={onReady} onFail={onFail} />
      )}
      <div className="nash-hero-scrim" aria-hidden="true" />

      <div className="nash-hero-inner">
        <div className="nash-hero-top">
          <span className="nash-eyebrow">
            <i className="live-dot" aria-hidden="true" />
            Nash Protocol <b>·</b> Robinhood Chain
          </span>
          {tokenCA ? <CABadge address={tokenCA} truncate={false} /> : null}
          <span className="nash-eyebrow nash-eyebrow-right">Credit &amp; leverage for tokenized assets</span>
        </div>

        <figure className="nash-note nash-note-left" aria-hidden="true">
          <span className="nash-equation">
            ∀&thinsp;<i>i</i> : u<sub><i>i</i></sub>(<i>s</i>*) ≥ u<sub><i>i</i></sub>(<i>s<sub>i</sub></i>, <i>s</i>*<sub>−<i>i</i></sub>)
          </span>
          <figcaption className="nash-hand">the whole idea, in one line.</figcaption>
        </figure>

        <figure className="nash-note nash-note-right" aria-hidden="true">
          <span className="nash-hand nash-hand-big">the math doesn&rsquo;t need a face.</span>
        </figure>

        <div className="nash-hero-copy">
          <h1 id="hero-title">
            Leverage, at <em>equilibrium.</em>
          </h1>
          <p>
            The credit and leverage layer for tokenized stocks and ETFs. Isolated markets, aligned incentives, and
            positions that protect themselves.
          </p>
          <div className="nash-cta-row">
            <Link href="/markets" className="nash-btn nash-btn-primary">
              Launch app <span aria-hidden="true">↗</span>
            </Link>
            <a href="#manifesto" className="nash-btn nash-btn-ghost">
              Read the argument
            </a>
          </div>
          <ul className="nash-hero-facts" aria-label="Protocol highlights">
            <li>Long up to {maxLeverage}</li>
            <li>Short any listed asset</li>
            <li>Auto-Protect</li>
            <li>Isolated pairs</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
