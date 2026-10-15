'use client';

import React from 'react';
import Link from 'next/link';

export function ClosingCta() {
  return (
    <section className="cta-band" aria-labelledby="cta-title">
      <div className="cta-band-inner section-wrap">
        <h2 id="cta-title">
          Find your <em>equilibrium.</em>
        </h2>
        <p className="nash-cta-sub">Isolated markets. Aligned incentives. Leverage you can see the edges of.</p>
        <div className="nash-cta-row">
          <Link href="/markets" className="nash-btn nash-btn-primary">
            Explore markets <span aria-hidden="true">↗</span>
          </Link>
          <a href="#manifesto" className="nash-btn nash-btn-ghost">
            Read the argument
          </a>
        </div>
      </div>
    </section>
  );
}
