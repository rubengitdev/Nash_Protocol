'use client';

import React from 'react';
import Link from 'next/link';
import { useInView } from './useInView';

const PERSONAS = [
  {
    role: 'The DeFi day trader',
    line: 'Long or short tokenized stocks in one transaction, with Auto-Protect watching the downside while you watch the tape.',
    cta: 'Open Trade',
    href: '/trade',
  },
  {
    role: 'The yield seeker',
    line: 'Supply stablecoins to ERC-4626 vaults and earn from borrowers across isolated markets. Risk you can size, one market at a time.',
    cta: 'See vaults',
    href: '/earn',
  },
  {
    role: 'The newcomer',
    line: 'Start with an idea you already know: borrow against what you own. Pick a loan ratio you are comfortable with. We keep an eye on it.',
    cta: 'Try lending',
    href: '/lending',
  },
  {
    role: 'The builder',
    line: 'Modular contracts, typed ABIs and a read-only API. Build a dapp on isolated markets without inheriting anyone else’s risk.',
    cta: 'Read the data',
    href: '/analytics',
  },
];

const PRINCIPLES = [
  ['Decentralized', 'Governed by the community, for the community.'],
  ['Transparent', 'Every transaction and every decision is public on-chain.'],
  ['Resilient', 'Isolated markets cap the blast radius of any shock.'],
  ['Efficient', 'Incentives reward honest prices and sensible capital.'],
  ['Accessible', 'Anyone with an internet connection can take part.'],
];

export function Participate() {
  const { ref, inView } = useInView<HTMLElement>(0.15);
  return (
    <section ref={ref} className="nash-participate section-wrap" id="participate" data-in={inView} aria-labelledby="participate-title">
      <div className="section-topline">
        <span>§ 08 / PARTICIPATE</span>
        <span>FOUR WAYS IN</span>
      </div>
      <h2 id="participate-title" className="nash-big nash-big-sm">
        Built for everyone <em>at the table.</em>
      </h2>

      <ul className="nash-persona-grid">
        {PERSONAS.map((p, i) => (
          <li key={p.role} style={{ transitionDelay: `${i * 90}ms` }}>
            <Link href={p.href} className="nash-persona">
              <span className="nash-persona-idx" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3>{p.role}</h3>
              <p>{p.line}</p>
              <span className="nash-persona-cta">
                {p.cta} <span aria-hidden="true">↗</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <dl className="nash-principles">
        {PRINCIPLES.map(([name, text]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
