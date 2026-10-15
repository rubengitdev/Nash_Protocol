'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { CABadge } from '../CABadge';
import { env } from '../../env.mjs';
import { useNetworkMode } from '../../hooks/useNetworkMode';
import { HeroFormulas } from './HeroFormulas';

// three.js is only needed here, and only in the browser.
const NashHeroScene = dynamic(() => import('./NashHeroScene'), { ssr: false });

export function NashHero() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onFail = useCallback(() => setFailed(true), []);
  const tokenCA = env.TOKEN_CA ?? '';
  const hero = useRef<HTMLElement>(null);
  const { isTestnet } = useNetworkMode();
  // Mainnet markets launch capped at 1.5x; testnet runs the full 2.5x range.
  const maxLeverage = isTestnet ? '2.5×' : '1.5×';

  // Pointer parallax for the formula layer: two CSS variables, updated at most once per frame.
  useEffect(() => {
    const el = hero.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(pointer: coarse)').matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        el.style.setProperty('--px', String((e.clientX / window.innerWidth) * 2 - 1));
        el.style.setProperty('--py', String((e.clientY / window.innerHeight) * 2 - 1));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={hero} className="nash-hero" data-ready={ready || failed ? 'true' : 'false'} aria-labelledby="hero-title">
      <div className="nash-hero-grid" aria-hidden="true" />
      {failed ? (
        <div className="nash-hero-fallback" aria-hidden="true">
          <img src="/brand/nash-mark.png" alt="" width={420} height={388} />
        </div>
      ) : (
        <NashHeroScene onReady={onReady} onFail={onFail} />
      )}
      <div className="nash-hero-scrim" aria-hidden="true" />
      <HeroFormulas />

      <div className="nash-hero-inner">
        <div className="nash-hero-top">
          <span className="nash-eyebrow">
            <i className="live-dot" aria-hidden="true" />
            Nash Protocol <b>·</b> Robinhood Chain
          </span>
          {tokenCA ? <CABadge address={tokenCA} truncate={false} /> : null}
          <span className="nash-eyebrow nash-eyebrow-right">Credit &amp; leverage for tokenized assets</span>
        </div>

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
