'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';
import { FORMULA_HTML } from './nash/formulas.generated';

/**
 * "How it works" as an instrument board. One position, three figures, each a small piece of Nash's
 * mathematics applied to it:
 *   1. Deposit: collateral defines a safe strategy set, convex and closed (the kind of set Nash's 1950
 *      existence proof works on).
 *   2. Borrow or trade: you pick a point in the set, and a side and a size.
 *   3. Auto-Protect: pushed off balance, the position returns to a safe point.
 * All numbers are illustrative, in dollars of collateral. Nothing here is live data.
 */

const LLTV = 0.8;
const GUARD = 1.15; // guard triggers below this health factor
const SAFE = 1.3; // and trims back up to this one
const C0 = 1000;
const D0 = 600;
const LEVERAGE = 2;

// Plot geometry (viewBox units).
const W = 640;
const H = 420;
const X0 = 64;
const Y0 = 28;
const PW = 548;
const PH = 328;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const seg = (p: number, start: number, end: number) => clamp01((p - start) / (end - start));
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

interface Tone {
  tag: string;
  fig: string;
  title: string;
  note: string;
  formula: keyof typeof FORMULA_HTML;
}

const TONES: Tone[] = [
  {
    tag: 'STEP 01',
    fig: 'FIG. 1 · THE STRATEGY SET',
    title: 'Collateral draws the safe region.',
    note: 'A convex, closed set: the kind of strategy set Nash’s 1950 existence proof works on.',
    formula: 'hiw-set',
  },
  {
    tag: 'STEP 02',
    fig: 'FIG. 2 · A POINT AND A PAYOFF',
    title: 'You choose where to stand, and which side.',
    note: 'Your strategy is a side and a size. The rules decide the rest.',
    formula: 'hiw-payoff',
  },
  {
    tag: 'STEP 03',
    fig: 'FIG. 3 · RETURN TO EQUILIBRIUM',
    title: 'Pushed off balance, the position steps back.',
    note: 'A fixed point: after every shock the guard returns the position to where it was safe.',
    formula: 'hiw-guard',
  },
];

// Step 3 is a deterministic simulation: a price path, the position's health, and the guard's trims.
interface Sample {
  t: number;
  price: number;
  hf: number;
  hfRaw: number;
  debt: number;
  collateral: number;
  trims: number;
}

function simulate(n = 160): { samples: Sample[]; trimAt: number[]; liqAt: number } {
  const samples: Sample[] = [];
  const trimAt: number[] = [];
  let liqAt = -1;
  let shares = 1;
  let debt = D0;
  let trims = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const price =
      1000 -
      290 * easeInOut(seg(t, 0.12, 0.66)) +
      46 * easeInOut(seg(t, 0.8, 1)) +
      9 * Math.sin(t * 41) * (0.4 + t) +
      5 * Math.sin(t * 97);
    let collateral = shares * price;
    let hf = (collateral * LLTV) / debt;
    if (hf < GUARD && trims < 2) {
      const newDebt = (LLTV * (collateral - debt)) / (SAFE - LLTV);
      shares -= (debt - newDebt) / price;
      debt = newDebt;
      trims += 1;
      trimAt.push(i);
      collateral = shares * price;
      hf = (collateral * LLTV) / debt;
    }
    const hfRaw = (price * LLTV) / D0;
    if (liqAt < 0 && hfRaw < 1) liqAt = i;
    samples.push({ t, price, hf, hfRaw, debt, collateral, trims });
  }
  return { samples, trimAt, liqAt };
}

interface Props {
  step: number;
  active: boolean;
  reduceMotion: boolean;
  cycleMs: number;
}

export function HowItWorksBoard({ step, active, reduceMotion, cycleMs }: Props) {
  // p runs 0 to 1 across one step. Reduced motion shows the finished state.
  const [p, setP] = useState(reduceMotion ? 1 : 0);
  const sim = useMemo(() => simulate(), []);
  const raf = useRef(0);

  useEffect(() => {
    if (reduceMotion) {
      setP(1);
      return;
    }
    setP(0);
    if (!active) return;
    const start = performance.now();
    let last = 0;
    const tick = (now: number) => {
      // About 30 fps is plenty for a chart.
      if (now - last > 32) {
        last = now;
        setP(clamp01((now - start) / (cycleMs * 0.92)));
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [step, active, reduceMotion, cycleMs]);

  const tone = TONES[step];

  return (
    <div className="hiwb" data-step={step}>
      <div className="hiwb-plot">
        <svg className="hiwb-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${tone.fig}. ${tone.title}`}>
          <defs>
            <linearGradient id="hiwb-safe" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#2ee6a6" stopOpacity="0.04" />
              <stop offset="1" stopColor="#2ee6a6" stopOpacity="0.28" />
            </linearGradient>
            <pattern id="hiwb-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="9" stroke="#d6153c" strokeWidth="1" strokeOpacity="0.22" />
            </pattern>
            <clipPath id="hiwb-clip"><rect x={X0} y={Y0} width={PW} height={PH} /></clipPath>
          </defs>

          <Frame step={step} />
          {step === 0 && <Figure1 p={p} />}
          {step === 1 && <Figure2 p={p} />}
          {step === 2 && <Figure3 p={p} sim={sim} />}
          <text className="hiwb-fig" x={X0} y={H - 6}>{tone.fig}</text>
          <text className="hiwb-fig hiwb-fig-r" x={X0 + PW} y={H - 6}>ILLUSTRATIVE UNITS · NOT LIVE DATA</text>
        </svg>
      </div>

      <aside className="hiwb-panel">
        <div className="hiwb-step">
          <span>{tone.tag}</span>
          <span>{String(Math.round(p * 100)).padStart(3, '0')}%</span>
        </div>
        <h3 className="hiwb-title">{tone.title}</h3>
        <div className="hiwb-formula" dangerouslySetInnerHTML={{ __html: FORMULA_HTML[tone.formula] }} />
        {step === 1 && <Payoff p={p} />}
        <Rows step={step} p={p} sim={sim} />
        <p className="hiwb-note">{tone.note}</p>
      </aside>
    </div>
  );
}

// --- shared frame: blueprint grid, axes, ticks -------------------------------------------------------

function Frame({ step }: { step: number }) {
  const cols = 10;
  const rows = 8;
  const xLabel = step === 2 ? 'time' : 'collateral value C ($)';
  const yLabel = step === 2 ? 'health factor' : 'debt D ($)';
  const xTicks = step === 2 ? ['t0', '', '', '', '', 'now'] : ['0', '200', '400', '600', '800', '1,000', '1,200'];
  const yTicks = step === 2 ? ['0.8', '0.9', '1.0', '1.1', '1.2', '1.3', '1.4', '1.5'] : ['0', '200', '400', '600', '800', '1,000'];
  return (
    <g>
      {Array.from({ length: cols * 4 + 1 }, (_, i) => (
        <line key={`vx${i}`} className={i % 4 === 0 ? 'hiwb-grid-major' : 'hiwb-grid'} x1={X0 + (PW / (cols * 4)) * i} y1={Y0} x2={X0 + (PW / (cols * 4)) * i} y2={Y0 + PH} />
      ))}
      {Array.from({ length: rows * 4 + 1 }, (_, i) => (
        <line key={`hy${i}`} className={i % 4 === 0 ? 'hiwb-grid-major' : 'hiwb-grid'} x1={X0} y1={Y0 + (PH / (rows * 4)) * i} x2={X0 + PW} y2={Y0 + (PH / (rows * 4)) * i} />
      ))}
      <rect className="hiwb-box" x={X0} y={Y0} width={PW} height={PH} />
      {xTicks.map((t, i) => (
        <text key={`xt${i}`} className="hiwb-tick" x={X0 + (PW / (xTicks.length - 1)) * i} y={Y0 + PH + 16} textAnchor="middle">{t}</text>
      ))}
      {yTicks.map((t, i) => (
        <text key={`yt${i}`} className="hiwb-tick" x={X0 - 8} y={Y0 + PH - (PH / (yTicks.length - 1)) * i + 3} textAnchor="end">{t}</text>
      ))}
      <text className="hiwb-axis" x={X0 + PW / 2} y={Y0 + PH + 32} textAnchor="middle">{xLabel}</text>
      <text className="hiwb-axis" transform={`translate(16 ${Y0 + PH / 2}) rotate(-90)`} textAnchor="middle">{yLabel}</text>
      {/* registration marks */}
      {[[X0, Y0], [X0 + PW, Y0], [X0, Y0 + PH], [X0 + PW, Y0 + PH]].map(([x, y], i) => (
        <path key={i} className="hiwb-reg" d={`M${x - 7} ${y}H${x + 7}M${x} ${y - 7}V${y + 7}`} />
      ))}
    </g>
  );
}

// --- Figure 1: the strategy set ------------------------------------------------------------------------

const CMAX = 1200;
const DMAX = 1000;
const px = (c: number) => X0 + (c / CMAX) * PW;
const py = (d: number) => Y0 + PH - (d / DMAX) * PH;

function Figure1({ p }: { p: number }) {
  const c = lerp(0, C0, easeInOut(seg(p, 0.05, 0.7)));
  const cap = c * LLTV;
  const lineEnd = { x: px(CMAX), y: py(CMAX * LLTV) };
  const settled = seg(p, 0.7, 1);
  return (
    <g clipPath="url(#hiwb-clip)">
      {/* unsafe side */}
      <path d={`M${px(0)} ${py(0)}L${lineEnd.x} ${lineEnd.y}L${px(CMAX)} ${py(DMAX)}L${px(0)} ${py(DMAX)}Z`} fill="url(#hiwb-hatch)" />
      {/* the safe set grows with the deposit */}
      <path d={`M${px(0)} ${py(0)}L${px(c)} ${py(0)}L${px(c)} ${py(cap)}Z`} fill="url(#hiwb-safe)" />
      <line className="hiwb-liq" x1={px(0)} y1={py(0)} x2={lineEnd.x} y2={lineEnd.y} />
      <text className="hiwb-label hiwb-label-danger" x={px(330)} y={py(330 * LLTV) - 14} transform={`rotate(-${(Math.atan((LLTV * PH * CMAX) / (DMAX * PW)) * 180) / Math.PI} ${px(330)} ${py(330 * LLTV) - 14})`}>D = LLTV · C · liquidation boundary</text>
      <text className="hiwb-label hiwb-label-danger" x={px(40)} y={py(930)}>UNSAFE</text>
      {/* deposit marker on the x axis and the capacity it opens */}
      <line className="hiwb-guide" x1={px(c)} y1={py(0)} x2={px(c)} y2={py(cap)} />
      <line className="hiwb-halo" x1={px(c)} y1={py(0)} x2={px(c)} y2={py(cap)} />
      <line className="hiwb-cap" x1={px(c)} y1={py(0)} x2={px(c)} y2={py(cap)} />
      <circle className="hiwb-dot-halo" cx={px(c)} cy={py(0)} r="12" />
      <circle className="hiwb-dot" cx={px(c)} cy={py(0)} r="6" />
      <circle className="hiwb-dot-hollow" cx={px(c)} cy={py(cap)} r="5" />
      <g opacity={0.35 + 0.65 * settled}>
        <text className="hiwb-label hiwb-label-em" x={px(c) - 12} y={py(cap / 2) + 4} textAnchor="end">capacity {usd(cap)}</text>
      </g>
      <text className="hiwb-label hiwb-label-em" x={px(70)} y={py(60)}>SAFE · S</text>
      {/* sweeping crosshair */}
      <path className="hiwb-cross" d={`M${px(c) - 10} ${py(0)}H${px(c) + 10}`} />
    </g>
  );
}

// --- Figure 2: choose a point -------------------------------------------------------------------------

function Figure2({ p }: { p: number }) {
  const borrow = lerp(0, D0, ease(seg(p, 0.05, 0.5)));
  const lineEnd = { x: px(CMAX), y: py(CMAX * LLTV) };
  const trail = Array.from({ length: 24 }, (_, i) => {
    const d = (borrow * i) / 23;
    return `${i ? 'L' : 'M'}${px(C0)} ${py(d)}`;
  }).join('');
  const hf = borrow > 0 ? (C0 * LLTV) / borrow : Infinity;
  const used = borrow / (C0 * LLTV);
  return (
    <g clipPath="url(#hiwb-clip)">
      <path d={`M${px(0)} ${py(0)}L${lineEnd.x} ${lineEnd.y}L${px(CMAX)} ${py(DMAX)}L${px(0)} ${py(DMAX)}Z`} fill="url(#hiwb-hatch)" />
      <path d={`M${px(0)} ${py(0)}L${px(C0)} ${py(0)}L${px(C0)} ${py(C0 * LLTV)}Z`} fill="url(#hiwb-safe)" />
      <line className="hiwb-liq" x1={px(0)} y1={py(0)} x2={lineEnd.x} y2={lineEnd.y} />
      {/* the whole segment you could stand on */}
      <line className="hiwb-guide" x1={px(C0)} y1={py(0)} x2={px(C0)} y2={py(C0 * LLTV)} />
      <path className="hiwb-halo" d={trail} />
      <path className="hiwb-cap" d={trail} />
      {/* the guard margin: where the guard starts to act */}
      <line className="hiwb-guard-line" x1={px(C0)} y1={py((C0 * LLTV) / GUARD)} x2={px(C0) + 90} y2={py((C0 * LLTV) / GUARD)} />
      <text className="hiwb-label hiwb-label-em" x={px(C0) + 96} y={py((C0 * LLTV) / GUARD) + 4}>guard · HF {GUARD.toFixed(2)}</text>
      <circle className="hiwb-pulse" cx={px(C0)} cy={py(borrow)} r="6" />
      <circle className="hiwb-dot-halo" cx={px(C0)} cy={py(borrow)} r="14" />
      <circle className="hiwb-dot" cx={px(C0)} cy={py(borrow)} r="7" />
      <text className="hiwb-label" x={px(C0) - 14} y={py(borrow * 0.42)} textAnchor="end">borrow {usd(borrow)}</text>
      <text className="hiwb-label hiwb-label-dim" x={px(C0) - 14} y={py(borrow * 0.42) + 16} textAnchor="end">
        {hf === Infinity ? 'HF ∞' : `HF ${hf.toFixed(2)}`} · {Math.round(used * 100)}% of capacity
      </text>
      <circle className="hiwb-dot-hollow" cx={px(C0)} cy={py(C0 * LLTV)} r="5" />
      <text className="hiwb-label hiwb-label-danger" x={px(40)} y={py(930)}>UNSAFE</text>
    </g>
  );
}

// The mini payoff chart in the side panel (step 2).
function Payoff({ p }: { p: number }) {
  const w = 280;
  const h = 132;
  const top = 24;
  const bottom = h - 18;
  const mid = (top + bottom) / 2;
  const m = 0.1 * Math.sin(Math.PI * 2 * clamp01(seg(p, 0.45, 1)));
  const x = (v: number) => w / 2 + (v / 0.12) * (w / 2 - 10);
  const y = (v: number) => mid - (v / (LEVERAGE * 0.12)) * ((bottom - top) / 2);
  const long = LEVERAGE * m;
  const short = -LEVERAGE * m;
  const pct = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
  return (
    <svg className="hiwb-payoff" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <line className="hiwb-grid-major" x1="0" y1={mid} x2={w} y2={mid} />
      <line className="hiwb-grid-major" x1={w / 2} y1={top - 4} x2={w / 2} y2={bottom + 4} />
      <line className="hiwb-pay-long" x1={x(-0.12)} y1={y(-LEVERAGE * 0.12)} x2={x(0.12)} y2={y(LEVERAGE * 0.12)} />
      <line className="hiwb-pay-short" x1={x(-0.12)} y1={y(LEVERAGE * 0.12)} x2={x(0.12)} y2={y(-LEVERAGE * 0.12)} />
      <circle className="hiwb-dot" cx={x(m)} cy={y(long)} r="4.5" />
      <circle className="hiwb-dot-short" cx={x(m)} cy={y(short)} r="4.5" />
      <text className="hiwb-label hiwb-label-em" x="8" y="14">LONG {LEVERAGE}× {pct(long)}</text>
      <text className="hiwb-label hiwb-label-sil" x={w - 8} y="14" textAnchor="end">SHORT {LEVERAGE}× {pct(short)}</text>
      <text className="hiwb-tick" x="8" y={h - 5}>PnL</text>
      <text className="hiwb-tick" x={w - 8} y={h - 5} textAnchor="end">price move m  →</text>
    </svg>
  );
}

// --- Figure 3: return to equilibrium -------------------------------------------------------------------

const HF_MIN = 0.8;
const HF_MAX = 1.5;
const hy = (hf: number) => Y0 + PH - ((hf - HF_MIN) / (HF_MAX - HF_MIN)) * PH;

function Figure3({ p, sim }: { p: number; sim: ReturnType<typeof simulate> }) {
  const n = sim.samples.length - 1;
  const idx = Math.min(n, Math.floor(p * n));
  const sx = (i: number) => X0 + (i / n) * PW;
  const path = (key: 'hf' | 'hfRaw', upto: number) => {
    let d = '';
    for (let i = 0; i <= upto; i++) {
      const v = Math.min(HF_MAX, Math.max(HF_MIN, sim.samples[i][key]));
      d += `${i ? 'L' : 'M'}${sx(i).toFixed(1)} ${hy(v).toFixed(1)}`;
    }
    return d;
  };
  const cur = sim.samples[idx];
  const showLiq = sim.liqAt >= 0 && idx >= sim.liqAt;
  return (
    <g clipPath="url(#hiwb-clip)">
      <rect x={X0} y={hy(1)} width={PW} height={Y0 + PH - hy(1)} fill="url(#hiwb-hatch)" />
      <line className="hiwb-liq" x1={X0} y1={hy(1)} x2={X0 + PW} y2={hy(1)} />
      <line className="hiwb-guard-line" x1={X0} y1={hy(GUARD)} x2={X0 + PW} y2={hy(GUARD)} />
      <line className="hiwb-guard-line hiwb-guard-safe" x1={X0} y1={hy(SAFE)} x2={X0 + PW} y2={hy(SAFE)} />
      <text className="hiwb-label hiwb-label-danger" x={X0 + 8} y={hy(1) + 15}>HF 1.00 · liquidation</text>
      <text className="hiwb-label hiwb-label-em" x={X0 + 8} y={hy(GUARD) - 6}>HF {GUARD.toFixed(2)} · guard acts</text>
      <text className="hiwb-label hiwb-label-dim" x={X0 + 8} y={hy(SAFE) + 15}>HF {SAFE.toFixed(2)} · target</text>
      {/* the same position with no guard */}
      <path className="hiwb-raw" d={path('hfRaw', idx)} />
      <path className="hiwb-halo" d={path('hf', idx)} />
      <path className="hiwb-hf" d={path('hf', idx)} />
      {sim.trimAt.filter((i) => i <= idx).map((i, k) => (
        <g key={i}>
          <line className="hiwb-trim" x1={sx(i)} y1={hy(sim.samples[i - 1]?.hf ?? GUARD)} x2={sx(i)} y2={hy(sim.samples[i].hf)} />
          <circle className="hiwb-ring" cx={sx(i)} cy={hy(sim.samples[i].hf)} r="9" />
          <text className="hiwb-label hiwb-label-em" x={sx(i)} y={hy(sim.samples[i].hf) - 16} textAnchor="middle">trim {k + 1}</text>
        </g>
      ))}
      {showLiq && (
        <g>
          <path className="hiwb-x" d={`M${sx(sim.liqAt) - 6} ${hy(1) - 6}l12 12m0 -12l-12 12`} />
          <text className="hiwb-label hiwb-label-danger" x={sx(sim.liqAt) - 10} y={hy(1) + 30} textAnchor="end">no guard: liquidated</text>
        </g>
      )}
      <line className="hiwb-guide" x1={sx(idx)} y1={Y0} x2={sx(idx)} y2={Y0 + PH} />
      <circle className="hiwb-dot-halo" cx={sx(idx)} cy={hy(Math.min(HF_MAX, Math.max(HF_MIN, cur.hf)))} r="12" />
      <circle className="hiwb-dot" cx={sx(idx)} cy={hy(Math.min(HF_MAX, Math.max(HF_MIN, cur.hf)))} r="6" />
    </g>
  );
}

// --- the readout rows ---------------------------------------------------------------------------------

function Rows({ step, p, sim }: { step: number; p: number; sim: ReturnType<typeof simulate> }) {
  let rows: Array<[string, string, string?]>;
  if (step === 0) {
    const c = lerp(0, C0, easeInOut(seg(p, 0.05, 0.7)));
    rows = [
      ['collateral C', usd(c)],
      ['LLTV', LLTV.toFixed(2)],
      ['borrowing capacity', usd(c * LLTV), 'em'],
      ['set', 'convex · closed'],
    ];
  } else if (step === 1) {
    const d = lerp(0, D0, ease(seg(p, 0.05, 0.5)));
    const hf = d > 0 ? (C0 * LLTV) / d : Infinity;
    rows = [
      ['collateral C', usd(C0)],
      ['debt D', usd(d)],
      ['health factor', hf === Infinity ? '∞' : hf.toFixed(2), hf < GUARD ? 'danger' : 'em'],
      ['leverage L', `${LEVERAGE.toFixed(1)}×`],
    ];
  } else {
    const n = sim.samples.length - 1;
    const s = sim.samples[Math.min(n, Math.floor(p * n))];
    rows = [
      ['price', usd(s.price)],
      ['collateral C', usd(s.collateral)],
      ['debt D', usd(s.debt)],
      ['health factor', s.hf.toFixed(2), s.hf < GUARD ? 'danger' : 'em'],
      ['guard', s.trims ? `trimmed ×${s.trims}` : 'armed', s.trims ? 'em' : undefined],
    ];
  }
  return (
    <dl className="hiwb-rows">
      {rows.map(([k, v, tone]) => (
        <div key={k} className={tone ? `is-${tone}` : undefined}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
