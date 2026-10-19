import React from 'react';
import { LandingButton } from './LandingButton';

const OFFSETS = [0, 34, 68];

/** Three brushed-silver ribbons, drawn after the three bands of the Nash mark. */
function Ribbons() {
  return (
    <svg className="landing-banner-ribbons" viewBox="0 0 700 420" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="nash-silver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6f6f4" />
          <stop offset="0.22" stopColor="#a9abac" />
          <stop offset="0.46" stopColor="#f2f2f1" />
          <stop offset="0.7" stopColor="#7f8284" />
          <stop offset="1" stopColor="#dedfdf" />
        </linearGradient>
      </defs>
      {OFFSETS.map((dy) => (
        <g key={dy} transform={`translate(0 ${dy})`}>
          <path
            d="M-30 340 C 150 340, 200 90, 400 90 S 640 320, 740 120"
            fill="none"
            stroke="url(#nash-silver)"
            strokeWidth="15"
            strokeLinecap="round"
          />
          <path
            d="M-30 334 C 150 334, 200 84, 400 84 S 640 314, 740 114"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.55"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
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
