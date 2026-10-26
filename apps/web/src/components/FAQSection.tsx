"use client";

import React from "react";

import { X_URL, HAS_X } from "../lib/social";
import { useNetworkMode } from "../hooks/useNetworkMode";
const MAINNET_ANSWERS: Record<string, string> = {
  "How does borrowing work?":
    "Deposit collateral into an enabled lending market, then borrow USDG within its LTV limits. TSLA, AMZN, PLTR and AMD markets are open on Robinhood Chain mainnet at launch caps, so size limits are small. Prices come from Chainlink.",
  "Can I trade in this preview?":
    "Yes, at launch caps. Lending and Long/Short are open on TSLA, AMZN, PLTR and AMD on Robinhood Chain mainnet. Auto-Protect opens once its keeper is verified. Earn is not available yet.",
};
const FAQ_ITEMS = [
  {
    question: "What is Nash Protocol?",
    answer:
      "Nash Protocol is the credit and leverage layer for tokenized assets, designed for Robinhood Chain. Its core products are isolated collateral borrowing, ERC-4626 stablecoin yield vaults, 1-click long and short exposure, and keeper-automated position management.",
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
      "Auto-Protect is an automated keeper defense that partially deleverages your position when it approaches a risk threshold you define. Keeper nodes repay debt before a third-party liquidation can occur, protecting your equity.",
  },
  {
    question: "Is leverage risky?",
    answer:
      "Yes. Leverage magnifies losses as well as gains, and you can lose some or all of your collateral. Isolated markets limit how far a shock can spread, but they do not remove market risk. Start small and pick a loan ratio you are comfortable with.",
  },
  {
    question: "Can I trade in this preview?",
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
