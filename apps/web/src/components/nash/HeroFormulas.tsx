'use client';

import React from 'react';
import 'katex/dist/katex.min.css';
import { FORMULA_HTML } from './formulas.generated';

/**
 * The hero's "blackboard": formulas that connect Nash's game theory to Nakamoto's protocol and to this
 * protocol. Purely decorative (aria-hidden); typeset at build time by scripts/render-formulas.mjs.
 *
 * Silver items are Nash's, emerald items are Nakamoto's. Each carries its source in the tag.
 */

interface Item {
  id: keyof typeof FORMULA_HTML;
  slot: string;
  tone: 'nash' | 'satoshi';
  tag: string;
  note?: string;
  depth: number;
}

const ITEMS: Item[] = [
  { id: 'nash-equilibrium', slot: 'a1', tone: 'nash', tag: 'Nash equilibrium · 1950', note: 'the whole idea, in one line.', depth: 0.5 },
  { id: 'fixed-point', slot: 'a2', tone: 'nash', tag: 'a fixed point · 1950', depth: 0.7 },
  { id: 'bargaining', slot: 'a3', tone: 'nash', tag: 'the bargaining problem · 1950', depth: 0.4 },
  { id: 'pow', slot: 'b0', tone: 'satoshi', tag: 'proof-of-work · 2008', depth: 1 },
  { id: 'catch-up', slot: 'b2', tone: 'satoshi', tag: 'honest majority · §11', note: 'play by the rules.', depth: 1.1 },
  { id: 'cipher', slot: 'b3', tone: 'nash', tag: 'the attacker’s effort · NSA, 1955', depth: 0.8 },
];

export function HeroFormulas() {
  return (
    <div className="nash-formulas" aria-hidden="true">
      {ITEMS.map((item, i) => (
        <figure
          key={item.id}
          className={`nash-eq nash-eq-${item.tone} eq-${item.slot}`}
          style={{ '--d': item.depth, '--i': i } as React.CSSProperties}
        >
          <div className="nash-eq-in">
            <div className="nash-eq-body">
              <figcaption className="nash-eq-tag">{item.tag}</figcaption>
              <span className="nash-eq-math" dangerouslySetInnerHTML={{ __html: FORMULA_HTML[item.id] }} />
              {item.note ? <span className="nash-hand nash-eq-note">{item.note}</span> : null}
            </div>
          </div>
        </figure>
      ))}

      <figure className="nash-eq nash-eq-hand eq-face" style={{ '--d': 1.2, '--i': 7 } as React.CSSProperties}>
        <div className="nash-eq-in">
          <div className="nash-eq-body">
            <span className="nash-hand nash-hand-big">the math doesn&rsquo;t need a face.</span>
          </div>
        </div>
      </figure>
    </div>
  );
}
