'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { assetCatalog } from '../../lib/asset-catalog';
import { useInView } from './useInView';

// Pointy-top hexagons on an odd-r offset grid: the board Nash liked, used to show what isolation buys.
const ROWS = 5;
const COLS = 7;
const R = 40;
const W = Math.sqrt(3) * R;
const WIDTH = W * (COLS + 0.5);
const HEIGHT = (ROWS * 1.5 + 0.5) * R;

type Mode = 'pooled' | 'isolated';
type CellState = 'ok' | 'shock' | 'spill';

const idx = (r: number, c: number) => r * COLS + c;

function neighbours(r: number, c: number) {
  const odd = r % 2 === 1;
  const candidates: Array<[number, number]> = [
    [r, c - 1],
    [r, c + 1],
    odd ? [r - 1, c] : [r - 1, c - 1],
    odd ? [r - 1, c + 1] : [r - 1, c],
    odd ? [r + 1, c] : [r + 1, c - 1],
    odd ? [r + 1, c + 1] : [r + 1, c],
  ];
  return candidates.filter(([rr, cc]) => rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS);
}

function hexPoints(cx: number, cy: number, radius: number) {
  return Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 180) * (60 * k - 30);
    return `${(cx + radius * Math.cos(a)).toFixed(2)},${(cy + radius * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

// Listed markets sit near the middle of the board; every other cell is an unlisted slot.
const LISTED_SLOTS = [idx(1, 2), idx(1, 4), idx(2, 3), idx(3, 2), idx(3, 4)];

export function HexBoard() {
  const { ref, inView } = useInView<HTMLElement>(0.35);
  const [mode, setMode] = useState<Mode>('isolated');
  const [cells, setCells] = useState<CellState[]>(() => Array(ROWS * COLS).fill('ok'));
  const [shockedAt, setShockedAt] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const demoRan = useRef(false);

  const labels = useMemo(() => {
    const map = new Map<number, string>();
    assetCatalog.slice(0, LISTED_SLOTS.length).forEach((asset, i) => map.set(LISTED_SLOTS[i], asset.ticker));
    return map;
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setCells(Array(ROWS * COLS).fill('ok'));
    setShockedAt(null);
  }, [clearTimers]);

  const shock = useCallback(
    (index: number, activeMode: Mode) => {
      clearTimers();
      const next: CellState[] = Array(ROWS * COLS).fill('ok');
      next[index] = 'shock';
      setCells(next);
      setShockedAt(index);
      if (activeMode === 'isolated') return;

      // Pooled liquidity: stress hops to every neighbour, ring by ring.
      const origin: [number, number] = [Math.floor(index / COLS), index % COLS];
      const seen = new Set<number>([index]);
      let frontier: Array<[number, number]> = [origin];
      for (let ring = 1; ring <= 3; ring++) {
        const found: Array<[number, number]> = [];
        for (const [r, c] of frontier) {
          for (const [rr, cc] of neighbours(r, c)) {
            const k = idx(rr, cc);
            if (!seen.has(k)) {
              seen.add(k);
              found.push([rr, cc]);
            }
          }
        }
        frontier = found;
        const batch = found.map(([rr, cc]) => idx(rr, cc));
        timers.current.push(
          window.setTimeout(() => {
            setCells((prev) => prev.map((s, i) => (batch.includes(i) ? 'spill' : s)));
          }, ring * 330),
        );
      }
    },
    [clearTimers],
  );

  // One automatic demonstration the first time the board scrolls into view.
  useEffect(() => {
    if (!inView || demoRan.current) return;
    demoRan.current = true;
    const t = window.setTimeout(() => shock(LISTED_SLOTS[0], 'isolated'), 600);
    return () => window.clearTimeout(t);
  }, [inView, shock]);

  useEffect(() => clearTimers, [clearTimers]);

  const switchMode = (next: Mode) => {
    setMode(next);
    if (shockedAt !== null) shock(shockedAt, next);
  };

  const affected = cells.filter((s) => s !== 'ok').length;

  return (
    <section ref={ref} className="nash-hex section-wrap" id="isolation" data-in={inView} aria-labelledby="hex-title">
      <div className="section-topline">
        <span>§ 03 / ISOLATION</span>
        <span>HEX · PRINCETON</span>
      </div>

      <div className="nash-hex-layout">
        <div className="nash-hex-copy">
          <h2 id="hex-title" className="nash-big nash-big-sm">
            Contagion needs a path. <em>We removed the path.</em>
          </h2>
          <p>
            At Princeton, students played a board game of hexagonal cells where a draw is impossible. They called it
            &ldquo;Nash.&rdquo; We borrowed the board. Each cell is a lending market. Shock one and watch what happens
            next.
          </p>

          <div className="nash-hex-controls" role="group" aria-label="Lending model">
            <button
              type="button"
              className={mode === 'pooled' ? 'is-active' : ''}
              aria-pressed={mode === 'pooled'}
              onClick={() => switchMode('pooled')}
            >
              Pooled lending
            </button>
            <button
              type="button"
              className={mode === 'isolated' ? 'is-active' : ''}
              aria-pressed={mode === 'isolated'}
              onClick={() => switchMode('isolated')}
            >
              Nash · Isolated
            </button>
          </div>

          <dl className="nash-hex-readout" aria-live="polite">
            <div>
              <dt>Markets hit</dt>
              <dd className="tabular-nums">
                {affected} <small>/ {ROWS * COLS}</small>
              </dd>
            </div>
            <div>
              <dt>Contained</dt>
              <dd className={shockedAt === null ? '' : affected <= 1 ? 'is-good' : 'is-bad'}>
                {shockedAt === null ? '—' : affected <= 1 ? 'Yes' : 'No'}
              </dd>
            </div>
          </dl>

          <div className="nash-hex-actions">
            <span className="nash-hand">tap any cell to shock it →</span>
            <button type="button" className="nash-link" onClick={reset} disabled={shockedAt === null}>
              Reset board
            </button>
          </div>
        </div>

        <div className="nash-hex-board">
          <svg viewBox={`0 0 ${WIDTH.toFixed(1)} ${HEIGHT.toFixed(1)}`} role="group" aria-label="Board of lending markets">
            {Array.from({ length: ROWS * COLS }, (_, i) => {
              const r = Math.floor(i / COLS);
              const c = i % COLS;
              const cx = W * (c + 0.5) + (r % 2 === 1 ? W / 2 : 0);
              const cy = R * (1 + 1.5 * r);
              const label = labels.get(i);
              const state = cells[i];
              return (
                <g
                  key={i}
                  className={`nash-cell is-${state}${label ? ' is-listed' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${label ?? 'Unlisted market'}: ${state === 'ok' ? 'healthy' : state === 'shock' ? 'shocked' : 'affected by contagion'}. Activate to shock.`}
                  onClick={() => shock(i, mode)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      shock(i, mode);
                    }
                  }}
                >
                  <polygon points={hexPoints(cx, cy, R - 3)} />
                  {label ? (
                    <text x={cx} y={cy + 4} textAnchor="middle">
                      {label}
                    </text>
                  ) : (
                    <circle cx={cx} cy={cy} r={2} />
                  )}
                </g>
              );
            })}
          </svg>
          <p className="nash-hex-caption">
            Illustrative board. Labelled cells are listed Nash markets; the rest are slots for markets to come.
          </p>
        </div>
      </div>
    </section>
  );
}
