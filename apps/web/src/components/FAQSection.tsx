"use client";

import React from "react";

import { X_URL, HAS_X } from "../lib/social";
import { useNetworkMode } from "../hooks/useNetworkMode";
const MAINNET_ANSWERS: Record<string, string> = {
  "How does borrowing work?":
    "Deposit collateral into an enabled lending market, then borrow USDG within its LTV limits. TSLA, AMZN, PLTR and AMD markets are live on Robinhood Chain mainnet, each with its own isolated pair and onchain price feed.",
  "Can I trade right now?":
    "Yes. Lending and Long/Short are live on TSLA, AMZN, PLTR and AMD on Robinhood Chain mainnet. More markets, Earn vaults and Auto-Protect are on the Nash roadmap, and the team keeps shipping.",
};
const FAQ_ITEMS = [
  {
    question: "What is Nash Protocol?",
    answer:
      "Nash Protocol is the credit and leverage layer for tokenized assets, designed for Robinhood Chain. Its core products are isolated collateral borrowing, 1-click long and short exposure, and more on the roadmap, including yield vaults and automated position protection.",
  },
  {
    question: "Why “Nash”?",
    answer:
      "John Nash showed that a system is stable when no participant can do better by changing strategy alone. We design markets the same way: isolated pairs so one asset’s bad day stays contained, and incentives that make the individually rational move the one that keeps the system healthy.",
  },
  {
    question: "How does borrowing work?",
    answer:
      "Deposit collateral into an enabled lending market, then borrow USDG within its LTV limits. The market needs a fresh oracle price and available liquidity. Each market is a separate pair, so risk never pools across assets.",
  },
  {
    question: "What is Auto-Protect?",
    answer:
      "Auto-Protect is the planned protection layer for leveraged positions: it partially deleverages a position as it nears a risk threshold you define. It is part of the Nash roadmap and rolls out on Robinhood Chain as it is ready.",
  },
  {
    question: "How does leverage work?",
    answer:
      "Leverage amplifies results in both directions. You pick the loan ratio, and isolated markets keep each asset’s risk inside its own pair.",
  },
  {
    question: "Can I trade right now?",
    answer:
      "Lending and Long/Short are available market by market once a market’s price feed, liquidity and launch checks pass. Earn and Auto-Protect open as each is verified. Markets that are not open yet are shown as paused.",
  },
];

export function FAQSection() {
  const { isTestnet } = useNetworkMode();
  return (
    <section className="faq-section section-wrap" id="faq">
      <div>
        <div className="section-topline">
          <span>§ 10 / THE DETAILS</span>
        </div>
        <h2 className="section-title">
          A little
          <br />
          <span>more clarity.</span>
        </h2>

        {HAS_X ? (
          <p className="faq-contact">
            Still have questions?{" "}
            <a href={X_URL} target="_blank" rel="noopener noreferrer">
              Reach out on X ↗
            </a>
          </p>
        ) : (
          <p className="faq-contact">Still have questions? Everything the protocol does is public on-chain.</p>
        )}
      </div>

      <div className="faq-list">
        {FAQ_ITEMS.map((item, idx) => (
          <details key={idx}>
            <summary>
              {item.question}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{(!isTestnet && MAINNET_ANSWERS[item.question]) || item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
