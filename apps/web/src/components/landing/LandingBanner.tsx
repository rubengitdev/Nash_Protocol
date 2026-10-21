'use client';

import React, { useEffect, useRef } from 'react';
import { LandingButton } from './LandingButton';

const OFFSETS = [0, 34, 68];
/** The bright edge along the top of each band sits this far above its centre line. */
const HIGHLIGHT_LIFT = 6;

/**
 * A band's centre line: from P0 a cubic to P1 (controls C1, C2), then a smooth cubic to P2 (control C3; its first
 * control mirrors C2 about P1). Each point is [x, y] in the 700 by 420 viewBox.
 */
const POINTS = [
  [-30, 340], // P0
  [150, 340], // C1
  [200, 90], // C2
  [400, 90], // P1
  [640, 320], // C3
  [740, 120], // P2
] as const;

// The ribbons ripple with a slow wave that travels from left to right; each band trails the one above it a little, so
// the three move like one piece of fabric. Every term is periodic in WAVE_SECONDS, so the loop has no seam.
const WAVE_SECONDS = 9;
const WAVE_AMPLITUDE = 14;
const WAVE_LENGTH = 900;
const WAVE_LAG = 0.35;
// The wave eases in from the still shape, so it never jumps when the motion starts.
const WAVE_EASE_IN = 2.4;

// A soft light sweeps across the silver from left to right. The sheen gradient repeats every SHEEN_PERIOD units, so
// moving it by a whole period looks the same, and the sweep loops without a seam. Its peak starts off the left edge.
const SHEEN_PERIOD = 1400;
const SHEEN_SECONDS = 8;
const SHEEN_START = 400;
const SHEEN_LAG = 70;
// The sheen waits until the bands have drawn in.
const SHEEN_DELAY = 1.8;

function ribbonPath(time: number, band: number, lift: number): string {
  const amplitude = WAVE_AMPLITUDE * smoothstep(time / WAVE_EASE_IN);
  const p = POINTS.map(([x, y]) => {
    const phase = (2 * Math.PI * time) / WAVE_SECONDS - (2 * Math.PI * x) / WAVE_LENGTH - band * WAVE_LAG;
    return `${x} ${(y - lift + amplitude * Math.sin(phase)).toFixed(2)}`;
  });
  return `M${p[0]} C ${p[1]}, ${p[2]}, ${p[3]} S ${p[4]}, ${p[5]}`;
}

function sheenShift(time: number, band: number): string {
  const travelled = (Math.max(0, time - SHEEN_DELAY) / SHEEN_SECONDS) * SHEEN_PERIOD;
  return `translate(${((SHEEN_START + travelled - band * SHEEN_LAG) % SHEEN_PERIOD).toFixed(2)} 0)`;
}

function smoothstep(v: number): number {
  const t = Math.max(0, Math.min(1, v));
  return t * t * (3 - 2 * t);
}

/**
 * Three brushed-silver ribbons, drawn after the three bands of the Nash mark. They draw themselves in from the left the
 * first time the banner scrolls into view, then ripple in a slow wave while a soft light sweeps across them, both in a
 * seamless loop. The motion runs only while the banner is on screen, and not at all with reduced motion (the ribbons
 * are then simply shown). Before the script runs they are shown whole and still, so the banner never depends on it.
 */
function Ribbons() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || typeof IntersectionObserver !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bands = Array.from(svg.querySelectorAll<SVGPathElement>('[data-ribbon-line]'));
    const sheens = Array.from(svg.querySelectorAll<SVGLinearGradientElement>('[data-ribbon-sheen]'));

    // Time only runs while the banner is on screen, so the loop picks up where it left off.
    let time = 0;
    let last = 0;
    let frame = 0;
    const tick = (now: number) => {
      time += Math.min((now - last) / 1000, 0.1);
      last = now;
      for (const path of bands) {
        path.setAttribute('d', ribbonPath(time, Number(path.dataset.band), Number(path.dataset.lift)));
      }
      sheens.forEach((sheen, band) => sheen.setAttribute('gradientTransform', sheenShift(time, band)));
      frame = requestAnimationFrame(tick);
    };

    // Armed: hidden at the start of the draw, waiting to be seen. Playing: on screen, so the animations run.
    svg.setAttribute('data-armed', '');
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? false;
        svg.setAttribute('data-playing', visible ? 'true' : 'false');
        cancelAnimationFrame(frame);
        frame = 0;
        if (!visible) return;
        svg.setAttribute('data-drawn', '');
        last = performance.now();
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.2 },
    );
    observer.observe(svg);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
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
        {OFFSETS.map((dy, i) => (
          <linearGradient
            key={dy}
            id={`nash-sheen-${i}`}
            data-ribbon-sheen=""
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2={SHEEN_PERIOD}
            y2="0"
            spreadMethod="repeat"
            gradientTransform={sheenShift(0, i)}
          >
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {OFFSETS.map((dy, i) => (
        <g key={dy} transform={`translate(0 ${dy})`} style={{ ['--ribbon-i' as string]: i }}>
          <path
            className="ribbon-band"
            data-ribbon-line=""
            data-band={i}
            data-lift={0}
            d={ribbonPath(0, i, 0)}
            pathLength={1}
            fill="none"
            stroke="url(#nash-silver)"
            strokeWidth="15"
            strokeLinecap="round"
          />
          <path
            className="ribbon-band"
            data-ribbon-line=""
            data-band={i}
            data-lift={0}
            d={ribbonPath(0, i, 0)}
            pathLength={1}
            fill="none"
            stroke={`url(#nash-sheen-${i})`}
            strokeWidth="15"
            strokeLinecap="round"
          />
          <path
            className="ribbon-band"
            data-ribbon-line=""
            data-band={i}
            data-lift={HIGHLIGHT_LIFT}
            d={ribbonPath(0, i, HIGHLIGHT_LIFT)}
            pathLength={1}
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
