'use client';

import React from 'react';
import { useInView } from './useInView';
import { MAX_LEVERAGE_LABEL } from '../../lib/leverage';

const BLOCKS = [
  {
    numeral: 'i.',
    title: 'Isolated by design.',
    body: 'Every lending pair is its own sealed room. When one asset has a bad day, the damage stays in that room. It cannot travel to your other positions, because there is no shared pool to travel through.',
    note: 'a bad day stays in one room.',
  },
  {
    numeral: 'ii.',
    title: 'Incentives that line up.',
    body: 'Lenders earn yield from borrowers who pay for credit. Borrowers set their own risk, and Auto-Protect acts on that rule before a liquidator ever could. When everyone’s best move is also the system’s best move, the system holds.',
    note: 'best move = the system’s best move.',
  },
  {
    numeral: 'iii.',
    title: 'Leverage without the cliff.',
    body: 'Open a long up to {MAXLEV} or short any listed asset in a single transaction. Choose a loan ratio you are comfortable with and let the protocol watch it for you.',
    note: 'you pick the ratio.',
  },
];

export function Manifesto() {
  const { ref, inView } = useInView<HTMLElement>(0.12);
  const maxLeverage = MAX_LEVERAGE_LABEL;
  return (
    <section
      ref={ref}
      className="nash-manifesto section-wrap"
      id="manifesto"
      data-in={inView}
      aria-labelledby="manifesto-title"
    >
      <div className="section-topline">
        <span>§ 01 / THE ARGUMENT</span>
        <span>PRINCETON, 1950</span>
      </div>

      <h2 id="manifesto-title" className="nash-big">
        A market holds when no one gains <em>by breaking it.</em>
      </h2>

      <div className="nash-manifesto-lede">
        <p>
          In 1950 a graduate student at Princeton published a two-page paper. Its idea: in any game there can be a
          point where every player is already playing their best response, so no one gains by changing strategy
          alone. The world named it the Nash equilibrium.
        </p>
        <p>
          We built a credit market around it. Isolated markets, honest incentives, and risk you can see before you
          take it.
        </p>
        <span className="nash-hand nash-margin-note" aria-hidden="true">
          two pages. a 28&#8209;page thesis. a Nobel, in 1994.
        </span>
      </div>

      <ol className="nash-blocks">
        {BLOCKS.map((block, i) => (
          <li key={block.title} className="nash-block" style={{ transitionDelay: `${i * 110}ms` }}>
            <span className="nash-block-num" aria-hidden="true">
              {block.numeral}
            </span>
            <div className="nash-block-copy">
              <h3>{block.title}</h3>
              <p>{block.body.replace('{MAXLEV}', maxLeverage)}</p>
            </div>
            <span className="nash-hand nash-block-note" aria-hidden="true">
              {block.note}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
