'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Emblem } from '../Emblem';
import { GlyphField } from '../glyph/GlyphField';
import { STAGE_PRESETS, type GlyphShape } from '../glyph/glyphPresets';
import { useNetworkMode } from '../../hooks/useNetworkMode';
import { PONS_VISIBLE } from '../../lib/pons-visible';
import { EARN_VISIBLE } from '../../lib/earn-visible';
import { CHINA_VISIBLE } from '../../lib/china-visible';

interface Feature {
  id: string;
  title: string;
  shape: GlyphShape;
  href: string;
  body: string;
}

// Copy comes from text already shown elsewhere on the site (landing, FAQ, page headers). {MAXLEV} is filled in from the
// network: mainnet markets launch capped at 1.5x, testnet runs the full 2.5x range.
const ALL_FEATURES: Feature[] = [
  {
    id: 'earn',
    title: 'Earn',
    // Earn opens the stage, so the first figure a visitor sees there is the Nash N itself.
    shape: 'logo',
    href: '/earn',
    body: 'Supply stablecoins to ERC-4626 vaults and earn from borrowers across isolated markets. Risk you can size, one market at a time.',
  },
  {
    id: 'lending',
    title: 'Lending',
    shape: 'lock',
    href: '/lending',
    body: 'Deposit stock tokens as collateral and borrow USDG within a market’s loan ratio. Every pair is its own sealed room, so risk never pools across assets.',
  },
  {
    id: 'trade',
    title: 'Trade',
    shape: 'arrows',
    href: '/trade',
    body: 'Open a long up to {MAXLEV} or a short on TSLA, AMZN, PLTR and AMD in a single transaction. You choose the loan ratio.',
  },
  {
    id: 'china',
    title: 'China Equities',
    shape: 'pagoda',
    href: '/markets/china',
    body: 'Verified tokenized Chinese company exposure through US-listed ADRs on Robinhood Chain: isolated USDG credit, spot swaps and spot-backed leverage.',
  },
  {
    id: 'pons',
    title: 'Pons',
    shape: 'curve',
    href: '/markets/pons',
    body: 'Tokens that completed the Pons bonding curve and meet liquidity, market cap and oracle requirements for leverage trading.',
  },
  {
    id: 'auto-protect',
    title: 'Auto-Protect',
    shape: 'shield',
    href: '/lending',
    body: 'Automated protection for leveraged positions, part of the Nash roadmap and rolling out on Robinhood Chain.',
  },
];
const FEATURES = ALL_FEATURES.filter(
  (feature) =>
    (PONS_VISIBLE || feature.id !== 'pons') &&
    (EARN_VISIBLE || feature.id !== 'earn') &&
    (CHINA_VISIBLE || feature.id !== 'china'),
);

/**
 * Features: one ribbon above, six cards below. Picking a card collapses the ribbon to a stub and regrows it as that
 * feature's figure. The cards are tabs (arrow keys move between them); the stage is the panel they control.
 */
export function LandingFeatures() {
  const { isTestnet } = useNetworkMode();
  const maxLeverage = isTestnet ? '2.5×' : '1.5×';
  const [index, setIndex] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = FEATURES[index];

  const select = (next: number, focus = false) => {
    const i = (next + FEATURES.length) % FEATURES.length;
    setIndex(i);
    if (focus) tabs.current[i]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (step) {
      event.preventDefault();
      select(index + step, true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      select(0, true);
    } else if (event.key === 'End') {
      event.preventDefault();
      select(FEATURES.length - 1, true);
    }
  };

  return (
    <section id="features" className="landing-section" aria-labelledby="features-title">
      <div className="flex flex-col gap-4 max-w-[680px]">
        <h2 id="features-title" className="landing-h2">
          What is Nash Protocol?
        </h2>
        <p className="landing-body">
          Nash Protocol is a credit market for tokenized stocks and ETFs. It is built on one idea from game theory: a
          market holds when no one gains by breaking it. Isolated markets, honest incentives, and risk you can see
          before you take it.
        </p>
      </div>

      <div
        id="features-stage"
        role="tabpanel"
        aria-labelledby={`feature-tab-${active.id}`}
        className="feature-stage"
      >
        <GlyphField preset={STAGE_PRESETS[active.shape]} morphKey={active.id} className="absolute inset-0" />
        <div className="feature-stage-bar">
          <span className="feature-stage-label">
            {String(index + 1).padStart(2, '0')} / {active.title}
          </span>
          <Link href={active.href} className="feature-stage-link">
            Open {active.title}
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="feature-cards" role="tablist" aria-label="Nash Protocol features" onKeyDown={onKeyDown}>
        {FEATURES.map((feature, i) => {
          const selected = i === index;
          return (
            <button
              key={feature.id}
              ref={(node) => {
                tabs.current[i] = node;
              }}
              type="button"
              role="tab"
              id={`feature-tab-${feature.id}`}
              aria-selected={selected}
              aria-controls="features-stage"
              tabIndex={selected ? 0 : -1}
              className="feature-card fx-card"
              onClick={() => select(i)}
            >
              <span className="feature-card-head">
                <Emblem shape={feature.shape} />
                <span className="feature-card-num">{String(i + 1).padStart(2, '0')}</span>
              </span>
              <span className="feature-card-title">{feature.title}</span>
              <span className="landing-body feature-card-body">{feature.body.replace('{MAXLEV}', maxLeverage)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
