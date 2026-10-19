'use client';

import React from 'react';
import { GlyphField } from '../glyph/GlyphField';
import { STEP_PRESETS } from '../glyph/glyphPresets';

// Each step restates something the protocol already says elsewhere: the earn and lending page headers, the FAQ and
// the product copy. The figure names the idea: a cone filling, two strands crossing, a watchful diamond, an hourglass.
const STEPS = [
  {
    title: 'Supply',
    body: 'Supply stablecoins to an ERC-4626 vault. Borrowers pay for credit, and you earn from it.',
    preset: STEP_PRESETS.supply,
  },
  {
    title: 'Borrow or trade',
    body: 'Deposit collateral and borrow USDG within a market’s loan ratio, or go long or short in a single transaction.',
    preset: STEP_PRESETS.borrow,
  },
  {
    title: 'Auto-Protect watches',
    body: 'Set the risk threshold you are comfortable with. Keepers deleverage you before a liquidator could.',
    preset: STEP_PRESETS.protect,
  },
  {
    title: 'Repay and withdraw',
    body: 'Repay your debt and withdraw your collateral, or take your supplied assets back out of the vault.',
    preset: STEP_PRESETS.close,
  },
];

/** How it works: four steps, each one a single solid figure, read left to right. */
export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="landing-section" aria-labelledby="how-title">
      <div className="flex flex-col gap-4 max-w-[680px]">
        <h2 id="how-title" className="landing-h2">
          How it works
        </h2>
        <p className="landing-body">Four steps from supply to withdrawal. Every market is its own room, so each step stays contained.</p>
      </div>

      <ol className="steps">
        {STEPS.map((step, i) => (
          <li key={step.title} className="step fx-card">
            <div className="step-tile" aria-hidden="true">
              <GlyphField preset={step.preset} interactive={false} className="absolute inset-0" />
            </div>
            <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="step-title">{step.title}</h3>
            <p className="landing-body">{step.body}</p>
            {i < STEPS.length - 1 && (
              <span className="step-arrow" aria-hidden="true">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
