"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  chineseEquitiesCatalog,
  chineseEquitiesMarkets,
  chinaMarketPath,
  formatPercent,
  formatUnderlyingPrice,
  type ChineseEquityAsset,
  type ChineseEquityMarket,
} from "../../lib/chinese-equities-client";

type FilterTrack = "ALL" | "US_LISTED_ADR" | "HONG_KONG_CANDIDATE" | "MAINLAND_A_SHARE";
type StatusFilter = "ALL" | "VERIFIED_NATIVE_IDENTITY" | "VERIFIED_EXTERNAL_PRODUCT" | "RESEARCH_ONLY";

export function ChinaMarketTable() {
  const [selectedTrack, setSelectedTrack] = useState<FilterTrack>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const trackCounts = useMemo(() => {
    return {
      all: chineseEquitiesCatalog.length,
      adr: chineseEquitiesCatalog.filter((a) => a.track === "US_LISTED_ADR").length,
      hk: chineseEquitiesCatalog.filter((a) => a.track === "HONG_KONG_CANDIDATE").length,
      ashare: chineseEquitiesCatalog.filter((a) => a.track === "MAINLAND_A_SHARE").length,
    };
  }, []);

  const filteredItems = useMemo(() => {
    return chineseEquitiesCatalog.filter((asset) => {
      // Track filter
      if (selectedTrack !== "ALL" && asset.track !== selectedTrack) {
        return false;
      }
      // Status filter
      if (statusFilter !== "ALL" && asset.verificationStatus !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTicker = asset.ticker.toLowerCase().includes(q);
        const matchName = asset.name.toLowerCase().includes(q);
        const matchCompany = asset.company.toLowerCase().includes(q);
        if (!matchTicker && !matchName && !matchCompany) return false;
      }
      return true;
    });
  }, [selectedTrack, statusFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      {/* FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#090c14] border border-[#16254a] p-4 rounded-sm">
        {/* Track Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 font-display text-xs">
          <button
            onClick={() => setSelectedTrack("ALL")}
            className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
              selectedTrack === "ALL"
                ? "bg-[#2ee6a6] text-[#050a18] font-bold shadow-[0_0_10px_rgba(46,230,166,0.2)]"
                : "text-[#8e9bb8] hover:text-white bg-[#0f1a33] border border-[#1a2a4d]"
            }`}
          >
            All Candidates ({trackCounts.all})
          </button>
          <button
            onClick={() => setSelectedTrack("US_LISTED_ADR")}
            className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
              selectedTrack === "US_LISTED_ADR"
                ? "bg-[#2ee6a6] text-[#050a18] font-bold shadow-[0_0_10px_rgba(46,230,166,0.2)]"
                : "text-[#8e9bb8] hover:text-white bg-[#0f1a33] border border-[#1a2a4d]"
            }`}
          >
            US ADRs ({trackCounts.adr})
          </button>
          <button
            onClick={() => setSelectedTrack("HONG_KONG_CANDIDATE")}
            className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
              selectedTrack === "HONG_KONG_CANDIDATE"
                ? "bg-[#2ee6a6] text-[#050a18] font-bold shadow-[0_0_10px_rgba(46,230,166,0.2)]"
                : "text-[#8e9bb8] hover:text-white bg-[#0f1a33] border border-[#1a2a4d]"
            }`}
          >
            Hong Kong xStocks ({trackCounts.hk})
          </button>
          <button
            onClick={() => setSelectedTrack("MAINLAND_A_SHARE")}
            className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
              selectedTrack === "MAINLAND_A_SHARE"
                ? "bg-[#2ee6a6] text-[#050a18] font-bold shadow-[0_0_10px_rgba(46,230,166,0.2)]"
                : "text-[#8e9bb8] hover:text-white bg-[#0f1a33] border border-[#1a2a4d]"
            }`}
          >
            Mainland A-Shares ({trackCounts.ashare})
          </button>
        </div>

        {/* Search & Verification Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <input
              type="text"
              placeholder="Search ticker, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#050a18] border border-[#1a2a4d] rounded px-3 py-1.5 text-xs text-[#eef2fa] placeholder-[#68728a] focus:outline-none focus:border-[#2ee6a6] transition-colors font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-[#7a859f] hover:text-white"
                aria-label="Clear search"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-[#050a18] border border-[#1a2a4d] rounded px-2.5 py-1.5 text-xs text-[#8e9bb8] focus:outline-none focus:border-[#2ee6a6] font-display"
          >
            <option value="ALL">All Categories</option>
            <option value="VERIFIED_NATIVE_IDENTITY">Robinhood Chain Native</option>
            <option value="VERIFIED_EXTERNAL_PRODUCT">External Tokenized Products</option>
            <option value="RESEARCH_ONLY">Research Pipeline</option>
          </select>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block overflow-x-auto border border-[#16254a] rounded-sm bg-[#080f20]">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="border-b border-[#16254a] bg-[#0b1429] text-[#8e9bb8] font-display tracking-wider uppercase text-[11px] whitespace-nowrap">
              <th className="py-3 px-4 whitespace-nowrap">Instrument &amp; Structure</th>
              <th className="py-3 px-4 whitespace-nowrap">Underlying Ref</th>
              <th className="py-3 px-4 whitespace-nowrap">Token Ref Price</th>
              <th className="py-3 px-4 whitespace-nowrap">24h Change</th>
              <th className="py-3 px-4 whitespace-nowrap">Market Status</th>
              <th className="py-3 px-4 whitespace-nowrap">Capabilities</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#101c37]">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#8e9bb8] whitespace-nowrap">
                  No Chinese equity candidates matching current filters.
                </td>
              </tr>
            ) : (
              filteredItems.map((asset) => {
                const market = chineseEquitiesMarkets.find(
                  (m) => m.assetSymbol === asset.ticker
                );
                return (
                  <MarketTableRow key={asset.assetId} asset={asset} market={market} />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE / TABLET CARD VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#8e9bb8] bg-[#080f20] border border-[#16254a] rounded p-6">
            No Chinese equity candidates matching current filters.
          </div>
        ) : (
          filteredItems.map((asset) => {
            const market = chineseEquitiesMarkets.find(
              (m) => m.assetSymbol === asset.ticker
            );
            return <MarketCardView key={asset.assetId} asset={asset} market={market} />;
          })
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Row Component
// -------------------------------------------------------------

function MarketTableRow({
  asset,
  market,
}: {
  asset: ChineseEquityAsset;
  market?: ChineseEquityMarket;
}) {
  const isNative = asset.verificationStatus === "VERIFIED_NATIVE_IDENTITY";
  const isExternal = asset.verificationStatus === "VERIFIED_EXTERNAL_PRODUCT";
  const isUp = (market?.priceChange24hPercent ?? 0) >= 0;

  return (
    <tr className="hover:bg-[#0c1019] transition-colors group">
      {/* Instrument & Structure */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-3 whitespace-nowrap">
          <div className="w-8 h-8 rounded bg-[#101c37] border border-[#1a2a4d] flex items-center justify-center font-display font-bold text-[#2ee6a6] text-xs shrink-0">
            {asset.ticker.slice(0, 3)}
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-bold text-[#eef2fa] text-sm group-hover:text-[#2ee6a6] transition-colors font-display tracking-wide shrink-0">
              {asset.ticker}
            </span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#121724] border border-[#1b2438] text-[#c3cce0] font-display shrink-0">
              {asset.instrumentType}
            </span>
            {isNative ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(46,230,166,0.1)] text-[#2ee6a6] border border-[rgba(46,230,166,0.25)] font-display font-medium shrink-0">
                Native 4663
              </span>
            ) : isExternal ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(245,166,35,0.12)] text-[#f5a623] border border-[rgba(245,166,35,0.25)] font-display shrink-0">
                External
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#161d2e] text-[#8791aa] border border-[#212c45] font-display shrink-0">
                Research
              </span>
            )}
            <span className="text-[#566079] text-xs shrink-0">·</span>
            <span className="text-xs text-[#8e9bb8] font-normal shrink-0">
              {asset.name}
            </span>
            <span className="text-[11px] text-[#68728a] shrink-0">
              ({asset.underlyingExchange})
            </span>
          </div>
        </div>
      </td>

      {/* Underlying Reference */}
      <td className="py-3.5 px-4 font-mono text-[#cdd5e6] whitespace-nowrap">
        {market && market.underlyingReferencePrice > 0 ? (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-semibold text-white">
              {formatUnderlyingPrice(market.underlyingReferencePrice, market.underlyingCurrency)}
            </span>
            <span className="text-[11px] text-[#7a859f]">
              ({asset.underlyingExchange} Tape)
            </span>
          </div>
        ) : (
          <span className="text-[#68728a] font-mono">—</span>
        )}
      </td>

      {/* Token Reference Price */}
      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
        {market && market.tokenReferencePriceUsd > 0 ? (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[#eef2fa] font-semibold">
              ${market.tokenReferencePriceUsd.toFixed(2)}
            </span>
            <span className="text-[11px] text-[#8e9bb8]">
              USDG
            </span>
          </div>
        ) : (
          <span className="text-[#68728a] font-mono">—</span>
        )}
      </td>

      {/* 24h Change */}
      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
        {market && market.priceChange24hPercent !== 0 ? (
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${
              isUp
                ? "text-[#2ee6a6] bg-[rgba(46,230,166,0.08)]"
                : "text-[#ff6b6b] bg-[rgba(255,107,107,0.08)]"
            }`}
          >
            {formatPercent(market.priceChange24hPercent, true)}
          </span>
        ) : (
          <span className="text-[#68728a] font-mono">—</span>
        )}
      </td>

      {/* Market Status */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        {market?.status === "NORMAL" ? (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ee6a6] animate-pulse shrink-0" />
            <span className="text-xs font-display font-medium text-[#2ee6a6]">Active</span>
            <span className="text-[#566079] text-xs">·</span>
            <span className="text-[11px] text-[#8e9bb8] font-mono">Regular Hours</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7a859f] shrink-0" />
            <span className="text-xs font-display text-[#98a2ba]">Research</span>
            <span className="text-[#566079] text-xs">·</span>
            <span className="text-[11px] text-[#68728a] font-mono">Pipeline</span>
          </div>
        )}
      </td>

      {/* Capabilities */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5 font-mono text-[10px] whitespace-nowrap">
          {market?.capabilities.spot ? (
            <span className="px-1.5 py-0.5 rounded bg-[#131823] text-[#2ee6a6] border border-[#2d6c57] shrink-0">
              Spot
            </span>
          ) : null}
          {market?.capabilities.borrow ? (
            <span className="px-1.5 py-0.5 rounded bg-[#131823] text-[#2ee6a6] border border-[#2d6c57] shrink-0">
              Borrow
            </span>
          ) : null}
          {market?.capabilities.long ? (
            <span className="px-1.5 py-0.5 rounded bg-[#131823] text-[#2ee6a6] border border-[#2d6c57] shrink-0">
              Long {market.maxLeverage}x
            </span>
          ) : null}
          <span
            title="Short inventory unavailable"
            className="px-1.5 py-0.5 rounded bg-[#0f141f] text-[#7a859f] border border-[#171f30] shrink-0"
          >
            Short Off
          </span>
        </div>
      </td>

      {/* Action */}
      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <Link
          href={chinaMarketPath(asset.ticker)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#111623] hover:bg-[#2ee6a6] text-[#c3cce0] hover:text-[#050a18] border border-[#1e283f] hover:border-[#2ee6a6] font-display font-medium text-xs transition-all whitespace-nowrap"
        >
          <span>{market?.capabilities.spot ? "Trade / Borrow" : "Inspect"}</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </td>
    </tr>
  );
}

// -------------------------------------------------------------
// Card View (Mobile / Tablet)
// -------------------------------------------------------------

function MarketCardView({
  asset,
  market,
}: {
  asset: ChineseEquityAsset;
  market?: ChineseEquityMarket;
}) {
  const isNative = asset.verificationStatus === "VERIFIED_NATIVE_IDENTITY";
  const isExternal = asset.verificationStatus === "VERIFIED_EXTERNAL_PRODUCT";
  const isUp = (market?.priceChange24hPercent ?? 0) >= 0;

  return (
    <div className="bg-[#080f20] border border-[#16254a] hover:border-[#2f3329] p-4 rounded-sm flex flex-col justify-between gap-4 transition-colors">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-[#101c37] border border-[#1a2a4d] flex items-center justify-center font-display font-bold text-[#2ee6a6] text-sm shrink-0">
              {asset.ticker.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#eef2fa] text-base font-display">
                  {asset.ticker}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#121724] border border-[#1b2438] text-[#9ba4b9] font-display">
                  {asset.instrumentType}
                </span>
              </div>
              <span className="text-xs text-[#8e9bb8] block mt-0.5">{asset.name}</span>
            </div>
          </div>
          {isNative ? (
            <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(46,230,166,0.1)] text-[#2ee6a6] border border-[rgba(46,230,166,0.25)] font-display font-medium">
              Native 4663
            </span>
          ) : isExternal ? (
            <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(245,166,35,0.12)] text-[#f5a623] border border-[rgba(245,166,35,0.25)] font-display">
              External
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#161d2e] text-[#8791aa] border border-[#212c45] font-display">
              Research
            </span>
          )}
        </div>

        {/* Pricing Rows */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#101c37] font-mono text-xs">
          <div>
            <span className="text-[10px] text-[#7a859f] block uppercase font-sans whitespace-nowrap">
              Token Price (Chainlink)
            </span>
            <span className="text-sm font-bold text-[#eef2fa] whitespace-nowrap">
              {market && market.tokenReferencePriceUsd > 0
                ? `$${market.tokenReferencePriceUsd.toFixed(2)}`
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#7a859f] block uppercase font-sans whitespace-nowrap">
              Underlying Reference
            </span>
            <span className="text-sm text-[#b9c2d6] whitespace-nowrap">
              {market && market.underlyingReferencePrice > 0
                ? formatUnderlyingPrice(market.underlyingReferencePrice, market.underlyingCurrency)
                : "—"}
            </span>
          </div>
        </div>

        {/* 24h Change & Status */}
        <div className="flex items-center justify-between mt-3 text-xs whitespace-nowrap">
          <div className="whitespace-nowrap">
            <span className="text-[10px] text-[#7a859f] block whitespace-nowrap">24h Change</span>
            {market && market.priceChange24hPercent !== 0 ? (
              <span
                className={`font-mono text-xs font-semibold whitespace-nowrap ${
                  isUp ? "text-[#2ee6a6]" : "text-[#ff6b6b]"
                }`}
              >
                {formatPercent(market.priceChange24hPercent, true)}
              </span>
            ) : (
              <span className="text-[#68728a] font-mono whitespace-nowrap">—</span>
            )}
          </div>
          <div className="text-right whitespace-nowrap">
            <span className="text-[10px] text-[#7a859f] block whitespace-nowrap">Status</span>
            <span className="font-mono text-[11px] text-[#2ee6a6] whitespace-nowrap">
              {market?.status === "NORMAL" ? "Active" : "Research Pipeline"}
            </span>
          </div>
        </div>
      </div>

      <Link
        href={chinaMarketPath(asset.ticker)}
        className="w-full flex items-center justify-center gap-1 py-2 rounded bg-[#101520] hover:bg-[#2ee6a6] text-[#c3cce0] hover:text-[#050a18] border border-[#1e283f] hover:border-[#2ee6a6] font-display font-medium text-xs transition-all whitespace-nowrap"
      >
        <span>Open Market Workspace</span>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
