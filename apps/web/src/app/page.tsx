"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { marketPath } from "../lib/asset-catalog";
import { useNetworkMode } from "../hooks/useNetworkMode";
import { useNashMarkets } from "../hooks/useNashMarkets";
import { useNashVault } from "../hooks/useNashVault";
import { NashHero } from "../components/nash/NashHero";
import { StatBand } from "../components/StatBand";
import { ProductTabs } from "../components/ProductTabs";
import { HowItWorks } from "../components/HowItWorks";
import { ComparisonMatrix } from "../components/ComparisonMatrix";
import { MarketGrid } from "../components/MarketGrid";
import { ClosingCta } from "../components/ClosingCta";
import { FAQSection } from "../components/FAQSection";
import { Manifesto } from "../components/nash/Manifesto";
import { HexBoard } from "../components/nash/HexBoard";
import { TheLetter } from "../components/nash/TheLetter";
import { Participate } from "../components/nash/Participate";
import { Roadmap } from "../components/nash/Roadmap";

export default function HomePage() {
  const { networkMode } = useNetworkMode();
  const { markets } = useNashMarkets(networkMode);
  const { vaults } = useNashVault(networkMode);

  const router = useRouter();
  const openMarket = (ticker: string) => router.push(marketPath(ticker));

  return (
    <div className="w-full">
      {/* HERO: hooded figure inside a three-ribbon ring */}
      <NashHero />

      {/* Nash at a glance */}
      <StatBand />

      {/* § 01 The argument */}
      <Manifesto />

      {/* § 02 Products: borrow, earn, leverage */}
      <ProductTabs markets={markets} vaults={vaults} onSelectMarket={openMarket} />

      {/* § 03 Isolation, shown on a Hex board */}
      <HexBoard />

      {/* § 04 How it works */}
      <HowItWorks />

      {/* § 05 The 1955 letter */}
      <TheLetter />

      {/* § 06 Nash vs. traditional DeFi */}
      <ComparisonMatrix />

      {/* § 07 Markets with live oracle prices */}
      <MarketGrid markets={markets} onSelectAsset={openMarket} />

      {/* § 08 Participate */}
      <Participate />

      {/* § 09 Roadmap */}
      <Roadmap />

      <ClosingCta />

      {/* § 10 FAQ */}
      <FAQSection />
    </div>
  );
}
