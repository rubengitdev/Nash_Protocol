"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppPage, DataState } from "../../../../components/AppPage";
import {
  getChineseAssetBySymbol,
  getChineseMarketBySymbol,
  getChineseProofBySymbol,
  loadStoredChinesePositions,
  saveStoredChinesePositions,
  type ChineseEquityPosition,
} from "../../../../lib/chinese-equities-client";
import { ChinaMarketMetrics } from "../../../../components/china/ChinaMarketMetrics";
import { ChinaSpotTradePanel } from "../../../../components/china/ChinaSpotTradePanel";
import { ChinaLendingPanel } from "../../../../components/china/ChinaLendingPanel";
import { ChinaLeveragePanel } from "../../../../components/china/ChinaLeveragePanel";
import { ChinaProofDossier } from "../../../../components/china/ChinaProofDossier";
import { ChinaPositionsTable } from "../../../../components/china/ChinaPositionsTable";

type WorkspaceTab = "overview" | "trade" | "borrow" | "leverage" | "proof";

export default function ChinaAssetDetailPage({
  params,
}: {
  params: { symbol: string };
}) {
  const symbol = params.symbol.toUpperCase();
  const asset = getChineseAssetBySymbol(symbol);
  const market = getChineseMarketBySymbol(symbol);
  const proof = getChineseProofBySymbol(symbol);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [positions, setPositions] = useState<ChineseEquityPosition[]>([]);

  useEffect(() => {
    setPositions(
      loadStoredChinesePositions().filter(
        (p) => p.assetSymbol.toUpperCase() === symbol
      )
    );
  }, [symbol]);

  if (!asset) {
    return (
      <AppPage
        back
        backHref="/markets/china"
        backLabel="← Chinese Equities Directory"
        eyebrow="Chinese Equities"
        title="Asset Not Found"
        description="The requested tokenized Chinese stock does not exist in the candidate catalog."
      >
        <DataState title="Unknown Asset Identifier">
          Please check the symbol or return to the{" "}
          <Link href="/markets/china" className="text-[#2ee6a6] underline">
            Chinese Equities directory
          </Link>
          .
        </DataState>
      </AppPage>
    );
  }

  const isNative = asset.verificationStatus === "VERIFIED_NATIVE_IDENTITY";
  const isExternal = asset.verificationStatus === "VERIFIED_EXTERNAL_PRODUCT";
  const isResearch = asset.verificationStatus === "RESEARCH_ONLY";

  const handlePositionOpened = (newPos: ChineseEquityPosition) => {
    setPositions((prev) => [newPos, ...prev]);
    const allStored = loadStoredChinesePositions();
    saveStoredChinesePositions([newPos, ...allStored.filter((p) => p.id !== newPos.id)]);
  };

  const handlePositionClosed = (posId: string) => {
    const markClosed = (p: ChineseEquityPosition): ChineseEquityPosition =>
      p.id === posId
        ? {
            ...p,
            status: "CLOSED",
            closedAt: new Date().toISOString(),
            debtUsd: 0,
            currentLtv: 0,
            healthFactor: 99.99,
          }
        : p;

    setPositions((prev) => prev.map(markClosed));
    const allStored = loadStoredChinesePositions();
    saveStoredChinesePositions(allStored.map(markClosed));
  };

  const handlePositionUpdated = (updatedPos: ChineseEquityPosition) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === updatedPos.id ? updatedPos : p))
    );
    const allStored = loadStoredChinesePositions();
    saveStoredChinesePositions(
      allStored.map((p) => (p.id === updatedPos.id ? updatedPos : p))
    );
  };

  return (
    <AppPage
      back
      backHref="/markets/china"
      backLabel="← Chinese Equities Directory"
      eyebrow="Robinhood Chain · Isolated Market"
      title={`${asset.name} (${asset.ticker})`}
      description={`Verified tokenized exposure to ${asset.company} on Robinhood Chain with isolated credit and spot-backed leverage.`}
    >
      {/* ASSET HEADER CARD */}
      <section className="bg-[#080f20] border border-[#16254a] p-5 sm:p-6 rounded-sm mb-6 font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-[#101c37] border border-[#1a2a4d] flex items-center justify-center font-display font-bold text-[#2ee6a6] text-lg shrink-0">
              {asset.ticker.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-[#eef2fa] whitespace-nowrap">
                  {asset.ticker}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-[#101c37] border border-[#1a2a4d] text-[#c3cce0] font-display whitespace-nowrap">
                  {asset.instrumentType} · {asset.underlyingExchange}
                </span>
                {isNative ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-[rgba(46,230,166,0.1)] text-[#2ee6a6] border border-[rgba(46,230,166,0.25)] font-display font-medium whitespace-nowrap">
                    Native 4663
                  </span>
                ) : isExternal ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-[rgba(245,166,35,0.12)] text-[#f5a623] border border-[rgba(245,166,35,0.25)] font-display font-medium whitespace-nowrap">
                    External Product
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-[#161d2e] text-[#8791aa] border border-[#212c45] font-display whitespace-nowrap">
                    Research Pipeline
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8e9bb8] mt-1 max-w-xl">
                {asset.description}
              </p>
            </div>
          </div>

          {/* Session & Oracle Chips */}
          <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#101c37] whitespace-nowrap">
            <div className="flex items-center gap-1.5 font-display text-xs whitespace-nowrap">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  market?.marketSession === "REGULAR" ? "bg-[#2ee6a6] animate-pulse" : "bg-[#8791aa]"
                }`}
              />
              <span className="text-[#eef2fa] font-bold whitespace-nowrap">
                {market?.marketSession === "REGULAR" ? "Session Open" : "Market Closed"}
              </span>
              <span className="text-[#7a859f] whitespace-nowrap">({market?.sessionTimeRemaining})</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono whitespace-nowrap">
              <span className="text-[#8791aa] whitespace-nowrap">Chainlink Feed:</span>
              <span className="text-[#2ee6a6] font-semibold whitespace-nowrap">Healthy (1s)</span>
            </div>
          </div>
        </div>

        {/* 5-TAB WORKSPACE NAVIGATION */}
        <div className="flex items-center gap-2 overflow-x-auto border-t border-[#101c37] mt-6 pt-4 font-display text-xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2 rounded font-bold transition-all whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-[#2ee6a6] text-[#050a18] shadow-[0_0_12px_rgba(46,230,166,0.25)]"
                : "text-[#8e9bb8] hover:text-white bg-[#0d172e] border border-[#182a52]"
            }`}
          >
            01 / Overview &amp; Chart
          </button>
          <button
            onClick={() => setActiveTab("trade")}
            className={`px-3.5 py-2 rounded font-bold transition-all whitespace-nowrap ${
              activeTab === "trade"
                ? "bg-[#2ee6a6] text-[#050a18] shadow-[0_0_12px_rgba(46,230,166,0.25)]"
                : "text-[#8e9bb8] hover:text-white bg-[#0d172e] border border-[#182a52]"
            }`}
          >
            02 / Spot Trade
          </button>
          <button
            onClick={() => setActiveTab("borrow")}
            className={`px-3.5 py-2 rounded font-bold transition-all whitespace-nowrap ${
              activeTab === "borrow"
                ? "bg-[#2ee6a6] text-[#050a18] shadow-[0_0_12px_rgba(46,230,166,0.25)]"
                : "text-[#8e9bb8] hover:text-white bg-[#0d172e] border border-[#182a52]"
            }`}
          >
            03 / Collateral &amp; Borrow
          </button>
          <button
            onClick={() => setActiveTab("leverage")}
            className={`px-3.5 py-2 rounded font-bold transition-all whitespace-nowrap ${
              activeTab === "leverage"
                ? "bg-[#2ee6a6] text-[#050a18] shadow-[0_0_12px_rgba(46,230,166,0.25)]"
                : "text-[#8e9bb8] hover:text-white bg-[#0d172e] border border-[#182a52]"
            }`}
          >
            04 / Leveraged Long
          </button>
          <button
            onClick={() => setActiveTab("proof")}
            className={`px-3.5 py-2 rounded font-bold transition-all whitespace-nowrap ${
              activeTab === "proof"
                ? "bg-[#2ee6a6] text-[#050a18] shadow-[0_0_12px_rgba(46,230,166,0.25)]"
                : "text-[#8e9bb8] hover:text-white bg-[#0d172e] border border-[#182a52]"
            }`}
          >
            05 / Proof &amp; Acceptance Dossier
          </button>
        </div>
      </section>

      {/* SIDE-BY-SIDE PRO TERMINAL WORKSPACE */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10 items-start">
        {/* LEFT COLUMN: LIVE CHART, METRICS & AUDIT DOSSIER */}
        <div className="lg:col-span-7 xl:col-span-8 min-w-0 flex flex-col gap-6">
          {activeTab === "proof" ? (
            <ChinaProofDossier asset={asset} proof={proof} />
          ) : (
            <ChinaMarketMetrics asset={asset} market={market} />
          )}
        </div>

        {/* RIGHT COLUMN: INTERACTIVE TRANSACTION PANELS (STICKY SIDEBAR) */}
        <div className="lg:col-span-5 xl:col-span-4 min-w-0 flex flex-col gap-3 lg:sticky lg:top-20">
          {/* Quick Action Mode Tab Switcher */}
          <div className="bg-[#080f20] border border-[#16254a] p-1 rounded-sm flex items-center gap-1 font-display text-xs">
            <button
              onClick={() => setActiveTab("trade")}
              className={`flex-1 py-1.5 px-1 sm:px-2 text-center rounded transition-all font-medium truncate ${
                activeTab === "trade" || activeTab === "overview" || activeTab === "proof"
                  ? "bg-[#2ee6a6] text-[#050a18] font-bold shadow-[0_0_8px_rgba(46,230,166,0.2)]"
                  : "text-[#8e9bb8] hover:text-white bg-[#0d172e]"
              }`}
            >
              Spot Trade
            </button>
            <button
              onClick={() => setActiveTab("borrow")}
              className={`flex-1 py-1.5 px-1 sm:px-2 text-center rounded transition-all font-medium truncate ${
                activeTab === "borrow"
                  ? "bg-[#2ee6a6] text-[#050a18] font-bold shadow-[0_0_8px_rgba(46,230,166,0.2)]"
                  : "text-[#8e9bb8] hover:text-white bg-[#0d172e]"
              }`}
            >
              Borrow
            </button>
            <button
              onClick={() => setActiveTab("leverage")}
              className={`flex-1 py-1.5 px-1 sm:px-2 text-center rounded transition-all font-medium truncate ${
                activeTab === "leverage"
                  ? "bg-[#2ee6a6] text-[#050a18] font-bold shadow-[0_0_8px_rgba(46,230,166,0.2)]"
                  : "text-[#8e9bb8] hover:text-white bg-[#0d172e]"
              }`}
            >
              Leverage 2x
            </button>
          </div>

          {/* Active Transaction Panel Card */}
          <div className="w-full min-w-0">
            {(activeTab === "trade" || activeTab === "overview" || activeTab === "proof") && (
              <ChinaSpotTradePanel
                asset={asset}
                market={market}
                onPositionOpened={handlePositionOpened}
              />
            )}
            {activeTab === "borrow" && (
              <ChinaLendingPanel
                asset={asset}
                market={market}
                onPositionOpened={handlePositionOpened}
              />
            )}
            {activeTab === "leverage" && (
              <ChinaLeveragePanel
                asset={asset}
                market={market}
                onPositionOpened={handlePositionOpened}
              />
            )}
          </div>
        </div>
      </section>

      {/* POSITIONS & TRADE HISTORY IN THIS MARKET */}
      <div id="positions-table" className="app-section-label scroll-mt-20">
        <span>02 / Positions &amp; Trade History in {asset.ticker}</span>
      </div>

      <section className="mb-10">
        <ChinaPositionsTable
          positions={positions}
          onPositionClosed={handlePositionClosed}
          onPositionUpdated={handlePositionUpdated}
        />
      </section>
    </AppPage>
  );
}
