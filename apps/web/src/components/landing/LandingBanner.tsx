'use client';

import React, { useEffect, useRef } from 'react';
import { LandingButton } from './LandingButton';

const OFFSETS = [0, 34, 68];
const RIBBON = 'M-30 340 C 150 340, 200 90, 400 90 S 640 320, 740 120';
const HIGHLIGHT = 'M-30 334 C 150 334, 200 84, 400 84 S 640 314, 740 114';

/**
 * Three brushed-silver ribbons, drawn after the three bands of the Nash mark. They draw themselves in from the left the
 * first time the banner scrolls into view, then keep a slow drift with a glint running along each band. The motion
 * runs only while the banner is on screen, and not at all with reduced motion (the ribbons are then simply shown).
 * Before the script runs they are shown whole, so the banner never depends on it.
 */
function Ribbons() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || typeof IntersectionObserver !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Armed: hidden at the start of the draw, waiting to be seen. Playing: on screen, so the animations run.
    svg.setAttribute('data-armed', '');
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? false;
        svg.setAttribute('data-playing', visible ? 'true' : 'false');
        if (visible) svg.setAttribute('data-drawn', '');
      },
      { threshold: 0.2 },
    );
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      className="landing-banner-ribbons"
      viewBox="0 0 700 420"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nash-silver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6f6f4" />
          <stop offset="0.22" stopColor="#a9abac" />
          <stop offset="0.46" stopColor="#f2f2f1" />
          <stop offset="0.7" stopColor="#7f8284" />
          <stop offset="1" stopColor="#dedfdf" />
        </linearGradient>
      </defs>
      {OFFSETS.map((dy, i) => (
        <g key={dy} transform={`translate(0 ${dy})`}>
          <g className="ribbon" style={{ ['--ribbon-i' as string]: i }}>
            <path
              className="ribbon-band"
              d={RIBBON}
              pathLength={1}
              fill="none"
              stroke="url(#nash-silver)"
              strokeWidth="15"
              strokeLinecap="round"
            />
            <path
              className="ribbon-band"
              d={HIGHLIGHT}
              pathLength={1}
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              className="ribbon-glint"
              d={RIBBON}
              pathLength={1}
              fill="none"
              stroke="#ffffff"
              strokeWidth="9"
              strokeLinecap="round"
            />
          </g>
        </g>
      ))}
    </svg>
  );
}

/** The closing banner: black in both themes (the silver mark is only placed on black), three ribbons, one button. */
export function LandingBanner() {
  return (
    <section id="get-started" className="landing-banner-wrap" aria-labelledby="get-started-title">
      <div className="landing-banner theme-black">
        <Ribbons />
        <div className="landing-banner-copy">
          <h2 id="get-started-title" className="landing-h2">
            Get started with Nash Protocol
          </h2>
          <p className="landing-body">
            Browse the markets and compare their parameters, then lend, borrow or trade on Robinhood Chain.
          </p>
          <LandingButton href="/markets">Open App</LandingButton>
        </div>
      </div>
    </section>
  );
}
