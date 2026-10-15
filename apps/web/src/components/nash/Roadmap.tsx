'use client';

import React from 'react';
import { useInView } from './useInView';

type Status = 'live' | 'building' | 'planned';

const PHASES: Array<{ n: string; title: string; body: string; status: Status }> = [
  {
    n: 'I',
    title: 'Isolated markets',
    body: 'Launch isolated lending markets for 5 to 10 major tokenized assets.',
    status: 'building',
  },
  {
    n: 'II',
    title: 'Leverage & liquidity',
    body: 'Integrate with major DEXs and add long and short leverage.',
    status: 'planned',
  },
  {
    n: 'III',
    title: 'New assets, new chains',
    body: 'Expand to new asset classes and chains, and launch a native trading interface.',
    status: 'planned',
  },
  {
    n: 'IV',
    title: 'Community governance',
    body: 'Hand the protocol to its holders with on-chain voting and liquidity staking.',
    status: 'planned',
  },
  {
    n: 'V',
    title: 'Real-world assets',
    body: 'Bring traditional finance onchain with access to real-world assets.',
    status: 'planned',
  },
];

const LABEL: Record<Status, string> = { live: 'Live on testnet', building: 'In progress', planned: 'Planned' };

export function Roadmap() {
  const { ref, inView } = useInView<HTMLElement>(0.2);
  return (
    <section ref={ref} className="nash-roadmap section-wrap" id="roadmap" data-in={inView} aria-labelledby="roadmap-title">
      <div className="section-topline">
        <span>§ 09 / THE ROAD</span>
        <span>FIVE PHASES</span>
      </div>
      <h2 id="roadmap-title" className="nash-big nash-big-sm">
        One equilibrium at a time. <em>Then the next.</em>
      </h2>

      <ol className="nash-phases">
        {PHASES.map((phase, i) => (
          <li key={phase.n} className={`is-${phase.status}`} style={{ transitionDelay: `${i * 100}ms` }}>
            <span className="nash-phase-n" aria-hidden="true">
              {phase.n}
            </span>
            <span className="nash-phase-status">{LABEL[phase.status]}</span>
            <h3>{phase.title}</h3>
            <p>{phase.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
