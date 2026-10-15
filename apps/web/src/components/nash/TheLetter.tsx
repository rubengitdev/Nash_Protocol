'use client';

import React from 'react';
import { useInView } from './useInView';

export function TheLetter() {
  const { ref, inView } = useInView<HTMLElement>(0.2);
  return (
    <section ref={ref} className="nash-letter section-wrap" id="letter" data-in={inView} aria-labelledby="letter-title">
      <div className="section-topline">
        <span>§ 05 / THE LETTER</span>
        <span>NSA · 1955</span>
      </div>

      <div className="nash-letter-layout">
        <div className="nash-letter-copy">
          <h2 id="letter-title" className="nash-big nash-big-sm">
            He didn&rsquo;t ask anyone to trust the machine. <em>He asked them to do the math.</em>
          </h2>
          <p>
            In 1955 Nash wrote by hand to the US National Security Agency about a cipher machine of his own design.
            His claim was simple and radical: design a cipher so that the effort needed to break it grows
            exponentially with the length of the key, and breaking it stops being practical. The letters stayed
            classified until 2012.
          </p>
          <p>
            Nash Protocol asks the same of you. Do not trust us. Verify. Every position, price and parameter lives
            on-chain where anyone can read it, and the rules do not change because someone wants them to.
          </p>
          <ul className="nash-letter-more">
            <li>
              <b>2002 · Ideal Money.</b> Nash treated money as a technology: something to be engineered for
              stability.
            </li>
            <li>
              <b>1994 · Nobel.</b> For the analysis of equilibria in non-cooperative games.
            </li>
          </ul>
        </div>

        <figure className="nash-letter-card" aria-label="Excerpt from John Nash’s 1955 letter to the NSA">
          <div className="nash-letter-stamp" aria-hidden="true">
            DECLASSIFIED · 2012
          </div>
          <header>
            <span>FROM</span> J. F. NASH, JR.
            <br />
            <span>TO</span> U.S. NATIONAL SECURITY AGENCY
            <br />
            <span>RE</span> AN ENCIPHERING MACHINE
          </header>
          <blockquote>
            <p>
              &ldquo;It means that it is quite feasible to design ciphers that are effectively unbreakable.&rdquo;
            </p>
          </blockquote>
          <figcaption>
            John Nash, 1955. Handwritten. The NSA&rsquo;s replies were typed.
          </figcaption>
          <span className="nash-hand nash-letter-note" aria-hidden="true">
            exponential for them. cheap for us.
          </span>
        </figure>
      </div>
    </section>
  );
}
