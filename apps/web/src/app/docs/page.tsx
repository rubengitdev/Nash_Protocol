import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { MaxLeverage, NetworkStatus } from "../../components/docs/NetworkText";
import { PONS_VISIBLE } from "../../lib/pons-visible";

export const metadata: Metadata = {
  title: "Docs",
  description: "How Nash Protocol works: isolated markets, Earn, Lending, Trade, Auto-Protect and the risks.",
};

// Every sentence here restates copy the site already shows (landing, FAQ, page headers). Nothing is added that the
// product does not already say about itself.
const SECTIONS = [
  { id: "overview", title: "Overview" },
  { id: "how-it-works", title: "How it works" },
  { id: "markets", title: "Markets" },
  { id: "earn", title: "Earn" },
  { id: "lending", title: "Lending" },
  { id: "trade", title: "Trade" },
  { id: "auto-protect", title: "Auto-Protect" },
  { id: "risks", title: "Risks" },
  { id: "status", title: "Status" },
];

export default function DocsPage() {
  return (
    <div className="docs">
      <header className="docs-head">
        <p className="landing-label">Docs</p>
        <h1 className="landing-h2">Nash Protocol documentation</h1>
        <p className="landing-body">
          What the protocol is, what each part does, and what to know before you use it.
        </p>
      </header>

      <div className="docs-layout">
        <nav className="docs-toc" aria-label="On this page">
          <span className="docs-toc-label">On this page</span>
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
        </nav>

        <article className="docs-body">
          <section id="overview">
            <h2>Overview</h2>
            <p>
              Nash Protocol is the credit and leverage layer for tokenized assets, designed for Robinhood Chain. Its
              core products are isolated collateral borrowing, ERC-4626 stablecoin yield vaults, 1-click long and
              short exposure, and keeper-automated position management.
            </p>
            <p>
              It is built on one idea from game theory. John Nash showed that a system is stable when no participant
              can do better by changing strategy alone. Nash Protocol designs markets the same way: isolated pairs so
              one asset’s bad day stays contained, and incentives that make the individually rational move the one that
              keeps the system healthy.
            </p>
            <h3>Isolated by design</h3>
            <p>
              Every lending pair is its own sealed room. When one asset has a bad day, the damage stays in that room.
              There is no shared pool for it to travel through.
            </p>
            <h3>Incentives that line up</h3>
            <p>
              Lenders earn yield from borrowers who pay for credit. Borrowers set their own risk, and Auto-Protect acts
              on that rule before a liquidator ever could.
            </p>
            <h3>Leverage without the cliff</h3>
            <p>
              Open a long up to <MaxLeverage /> or short any listed asset in a single transaction. Choose a loan ratio
              you are comfortable with and let the protocol watch it for you.
            </p>
          </section>

          <section id="how-it-works">
            <h2>How it works</h2>
            <ol>
              <li>
                <strong>Supply.</strong> Supply stablecoins to an ERC-4626 vault. Borrowers pay for credit, and you earn
                from it.
              </li>
              <li>
                <strong>Borrow or trade.</strong> Deposit collateral and borrow USDG within a market’s loan ratio, or go
                long or short in a single transaction.
              </li>
              <li>
                <strong>Auto-Protect watches.</strong> Set the risk threshold you are comfortable with. Keepers
                deleverage you before a liquidator could.
              </li>
              <li>
                <strong>Repay and withdraw.</strong> Repay your debt and withdraw your collateral, or take your supplied
                assets back out of the vault.
              </li>
            </ol>
          </section>

          <section id="markets">
            <h2>Markets</h2>
            <p>
              Each market is a separate pair, so risk never pools across assets. A market needs a fresh oracle price and
              available liquidity before it takes new exposure; stale prices or paused markets block it.
            </p>
            <p>
              Explore tokenized equities, compare market parameters, and choose where to put your assets to work in the{" "}
              <Link href="/markets">market directory</Link>.
            </p>
            <h3>Chinese equities</h3>
            <p>
              Access verified tokenized Chinese company exposure through US-listed ADRs on Robinhood Chain, featuring
              isolated USDG credit, spot swaps, and spot-backed leverage. See{" "}
              <Link href="/markets/china">Chinese equities</Link>.
            </p>
            {PONS_VISIBLE && (
              <>
                <h3>Pons</h3>
                <p>
                  Tokens that completed the Pons bonding curve and meet liquidity, market cap, and oracle requirements for
                  leverage trading. See <Link href="/markets/pons">Pons markets</Link>.
                </p>
              </>
            )}
          </section>

          <section id="earn">
            <h2>Earn</h2>
            <p>
              Supply stablecoins to ERC-4626 vaults and earn from borrowers across isolated markets. Review each
              vault’s allocation, utilization, and withdrawal conditions before you deposit. Risk you can size, one
              market at a time. Browse the <Link href="/earn">vaults</Link>.
            </p>
          </section>

          <section id="lending">
            <h2>Lending</h2>
            <p>
              Deposit collateral into an enabled lending market, then borrow USDG within its LTV limits. The market needs
              a fresh oracle price and available liquidity. Manage repayment and withdrawals from the same page. Start in{" "}
              <Link href="/lending">Lending</Link>.
            </p>
          </section>

          <section id="trade">
            <h2>Trade</h2>
            <p>
              Go long or short tokenized stocks in a single transaction, with Auto-Protect watching the downside while you
              watch the tape. Longs go up to <MaxLeverage /> on this deployment. Quotes include swap fees and price
              impact; stale prices or paused markets block new exposure. Open <Link href="/trade">Trade</Link>.
            </p>
          </section>

          <section id="auto-protect">
            <h2>Auto-Protect</h2>
            <p>
              Auto-Protect is an automated keeper defense that partially deleverages your position when it approaches a
              risk threshold you define. Keeper nodes repay debt before a third-party liquidation can occur, protecting
              your equity.
            </p>
          </section>

          <section id="risks">
            <h2>Risks</h2>
            <p>
              Leverage magnifies losses as well as gains, and you can lose some or all of your collateral. Isolated
              markets limit how far a shock can spread, but they do not remove market risk. Start small and pick a loan
              ratio you are comfortable with.
            </p>
            <p>
              Nash Protocol is experimental software on Robinhood Chain. Leverage can lose all of your collateral. Nothing
              here is financial advice.
            </p>
          </section>

          <section id="status">
            <h2>Status</h2>
            <NetworkStatus />
            <p>
              More answers are in the <Link href="/faq">FAQ</Link>.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
