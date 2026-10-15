"use client";

import React, { useState, useMemo } from "react";
import {
  type ChineseEquityAsset,
  type ChineseEquityMarket,
  type ChineseEquityPosition,
  calculateHealthFactor,
  calculateLiquidationPrice,
  formatCurrency,
  loadStoredChinesePositions,
} from "../../lib/chinese-equities-client";
import { ChinaWalletSignatureModal } from "./ChinaWalletSignatureModal";
import { ChinaAssetLogo } from "./ChinaAssetLogo";

export function ChinaLeveragePanel({
  asset,
  market,
  onPositionOpened,
}: {
  asset: ChineseEquityAsset;
  market?: ChineseEquityMarket;
  onPositionOpened?: (newPos: ChineseEquityPosition) => void;
}) {
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [marginUsd, setMarginUsd] = useState<string>("150");
  const [leverage, setLeverage] = useState<number>(2.0);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [confirmedTxHash, setConfirmedTxHash] = useState<string | null>(null);
  const [executedPosition, setExecutedPosition] = useState<ChineseEquityPosition | null>(null);

  const activeStoredPosition = useMemo(() => {
    if (typeof window === "undefined") return null;
    const stored = loadStoredChinesePositions();
    return (
      stored.find(
        (p) =>
          p.assetSymbol.toUpperCase() === asset.ticker.toUpperCase() &&
          p.positionType === "LONG"
      ) || null
    );
  }, [asset.ticker, confirmedTxHash]);

  const tokenPrice = market?.tokenReferencePriceUsd ?? 85.0;
  const maxLeverage = market?.maxLeverage ?? 2.0;
  const liquidationThreshold = market?.liquidationThreshold ?? 45.0;
  const isMarketOpen = market?.marketSession === "REGULAR" || market?.marketSession === "PRE_MARKET";
  const isLongEnabled = market?.capabilities.long ?? false;

  // Numerical inputs & derived calculations
  const numMargin = parseFloat(marginUsd) || 0;
  const totalExposureUsd = numMargin * leverage;
  const borrowedUsdg = totalExposureUsd - numMargin;
  const tokensAcquired = tokenPrice > 0 ? totalExposureUsd / tokenPrice : 0;

  // Health Factor & Liquidation Price
  const estimatedHf = calculateHealthFactor(totalExposureUsd, liquidationThreshold, borrowedUsdg);
  const estimatedLiqPrice = calculateLiquidationPrice(borrowedUsdg, tokensAcquired, liquidationThreshold);

  // Daily borrow interest
  const borrowApr = market?.borrowApr ?? 7.8;
  const dailyInterestUsd = (borrowedUsdg * (borrowApr / 100)) / 365;

  const handleOpenModal = () => {
    if (numMargin <= 0) return;
    setIsSignatureModalOpen(true);
  };

  const handleWalletConfirmed = (txHash: string) => {
    setConfirmedTxHash(txHash);
    setIsSignatureModalOpen(false);

    if (onPositionOpened) {
      const newPos: ChineseEquityPosition = {
        id: `pos-${asset.ticker.toLowerCase()}-${Date.now().toString().slice(-4)}`,
        marketId: market?.marketId ?? null,
        assetSymbol: asset.ticker,
        name: `${asset.ticker} / USDG`,
        positionType: "LONG",
        leverage,
        collateralTokens: Number(tokensAcquired.toFixed(4)),
        collateralUsd: Number(totalExposureUsd.toFixed(2)),
        debtUsd: Number(borrowedUsdg.toFixed(2)),
        equityUsd: Number(numMargin.toFixed(2)),
        entryPrice: Number(tokenPrice.toFixed(2)),
        markPrice: Number(tokenPrice.toFixed(2)),
        liquidationPrice: Number(estimatedLiqPrice.toFixed(2)),
        healthFactor: Number(estimatedHf.toFixed(2)),
        currentLtv: Number(((borrowedUsdg / totalExposureUsd) * 100).toFixed(2)),
        liquidationThreshold,
        pnlUsd: 0,
        pnlPercent: 0,
        accruedInterestUsd: 0,
        openedAt: new Date().toISOString(),
        status: estimatedHf < 1.0 ? "CRITICAL" : estimatedHf < 1.3 ? "WARNING" : "HEALTHY",
        riskTier: market?.riskTier ?? "Tier A",
      };
      setExecutedPosition(newPos);
      onPositionOpened(newPos);
    }
  };

  return (
    <div className="w-full bg-[#0a0a0a] border border-[#222222] p-4 sm:p-5 rounded-sm font-sans box-border overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2 pb-3.5 mb-4 border-b border-[#161616]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-[#858585] uppercase font-display tracking-wider truncate">
            Spot-Backed Leverage · Isolated
          </span>
          <span className="text-[10px] font-mono text-[#919191] shrink-0">
            {asset.ticker}: <strong className="text-[#f5f5f5]">${tokenPrice.toFixed(2)}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2.5 min-w-0">
          <ChinaAssetLogo symbol={asset.ticker} size="md" />
          <h3 className="text-base font-bold font-display text-[#f5f5f5] truncate">
            {direction === "LONG"
              ? `Leveraged Long ${asset.ticker} (Up to ${maxLeverage}x)`
              : `Short ${asset.ticker}`}
          </h3>
        </div>
      </div>

      {/* Direction Tabs: Long vs Short */}
      <div className="grid grid-cols-2 gap-1 mb-4 bg-[#000000] p-1 border border-[#161616] rounded-sm font-display text-xs">
        <button
          onClick={() => setDirection("LONG")}
          className={`py-1.5 px-2 rounded text-center transition-all font-medium truncate ${
            direction === "LONG"
              ? "bg-[#e5e5e5] text-[#000000] font-bold shadow-[0_0_8px_rgba(229,229,229,0.2)]"
              : "text-[#8d8d8d] hover:text-white hover:bg-[#0e0e0e]"
          }`}
        >
          Spot Long (2x)
        </button>
        <button
          onClick={() => setDirection("SHORT")}
          className={`py-1.5 px-2 rounded text-center transition-all font-medium truncate flex items-center justify-center gap-1.5 ${
            direction === "SHORT"
              ? "bg-[#e5e5e5] text-[#000000] font-bold shadow-[0_0_8px_rgba(229,229,229,0.2)]"
              : "text-[#8d8d8d] hover:text-white hover:bg-[#0e0e0e]"
          }`}
        >
          <span>Short</span>
          <span
            className={`text-[9px] px-1 py-0.2 rounded border shrink-0 ${
              direction === "SHORT"
                ? "bg-[#101010] text-[#e5e5e5] border-[#262626]"
                : "bg-[#2a1414] text-[#ff6b6b] border-[#3e1e1e]"
            }`}
          >
            Restricted
          </span>
        </button>
      </div>

      {/* Warning if SHORT is selected */}
      {direction === "SHORT" ? (
        <div className="flex flex-col gap-3.5 mb-4 font-sans">
          {/* Pro Risk Card */}
          <div className="bg-[#0e0e0e] border border-[#232323] p-3.5 sm:p-4 rounded-sm">
            <div className="flex flex-col gap-1.5 pb-2.5 border-b border-[#191919]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <svg className="w-3.5 h-3.5 text-[#ff6b6b] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-display font-bold text-xs text-[#f5f5f5] uppercase tracking-wide truncate">
                    Short Selling Unavailable
                  </span>
                </div>
                <span className="text-[9px] bg-[#221010] text-[#ff6b6b] border border-[#3e1e1e] px-1.5 py-0.5 rounded font-mono shrink-0">
                  SHORT_INVENTORY_UNAVAILABLE
                </span>
              </div>
            </div>

            <p className="mt-2.5 text-xs text-[#cacaca] leading-relaxed">
              In compliance with the implementation specification, synthetic short positions
              without confirmed underlying borrow inventory are disabled. True spot shorting
              requires a separate stock lending inventory pool on Robinhood Chain.
            </p>

            {/* Protocol Rule Details */}
            <div className="mt-3 pt-2.5 border-t border-[#191919] flex flex-col gap-1.5 text-[11px] font-mono">
              <div className="bg-[#030303] border border-[#201111] px-2.5 py-1.5 rounded flex items-center justify-between gap-2">
                <span className="text-[#919191] truncate">Borrow Inventory</span>
                <span className="text-[#ff6b6b] font-semibold shrink-0">0 Confirmed Locates</span>
              </div>
              <div className="bg-[#030303] border border-[#201111] px-2.5 py-1.5 rounded flex items-center justify-between gap-2">
                <span className="text-[#919191] truncate">Synthetic Shorts</span>
                <span className="text-[#ff6b6b] font-semibold shrink-0">Strictly Prohibited</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col gap-2">
            <button
              disabled
              className="w-full py-3 px-3 rounded bg-[#151515] text-[#ff6b6b] border border-[#222222] font-display font-bold text-xs uppercase cursor-not-allowed truncate"
            >
              Short Execution Disabled
            </button>
            <button
              onClick={() => setDirection("LONG")}
              className="w-full py-2.5 px-3 rounded bg-[#131313] hover:bg-[#1e1e1e] text-[#e5e5e5] border border-[#272727] font-display font-medium text-xs transition-colors truncate"
            >
              Switch to Spot Long (Buy &amp; Borrow)
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* User Margin Input Box */}
          <div className="bg-[#000000] border border-[#222222] p-3 sm:p-3.5 rounded-sm mb-4">
            <div className="flex items-center justify-between text-xs mb-2 gap-2">
              <span className="text-[#919191] font-display text-[11px] truncate">Deposit Margin Equity</span>
              <span className="text-[#858585] font-mono text-[10px] truncate text-right">Available: $1,250 USDG</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <input
                type="number"
                min="10"
                step="10"
                value={marginUsd}
                onChange={(e) => setMarginUsd(e.target.value)}
                placeholder="0.00"
                className="w-full min-w-0 bg-transparent font-mono text-xl sm:text-2xl text-[#f5f5f5] focus:outline-none placeholder-[#3a3a3a]"
              />
              <span className="font-display font-bold text-xs px-2.5 py-1 bg-[#141414] text-[#e5e5e5] border border-[#262626] rounded shrink-0">
                USDG
              </span>
            </div>
          </div>

          {/* Leverage Slider */}
          <div className="bg-[#060606] border border-[#222222] p-3 sm:p-3.5 rounded-sm mb-4">
            <div className="flex items-center justify-between text-xs mb-2 gap-2">
              <span className="text-[#919191] font-display text-[11px] truncate">Target Leverage Ratio</span>
              <span className="font-mono text-base font-bold text-[#e5e5e5] shrink-0">
                {leverage.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="1.1"
              max={maxLeverage}
              step="0.1"
              value={leverage}
              onChange={(e) => setLeverage(parseFloat(e.target.value))}
              className="w-full accent-[#e5e5e5] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#727272] font-mono mt-1.5">
              <span>1.1x</span>
              <span>1.5x</span>
              <span>{maxLeverage.toFixed(1)}x Max</span>
            </div>
          </div>

          {/* Risk Metrics & Exposure Card */}
          <div className="bg-[#000000] border border-[#161616] p-3 sm:p-3.5 rounded-sm mb-4 font-mono text-xs divide-y divide-[#0e0e0e]">
            <div className="flex items-center justify-between pb-2 gap-2">
              <span className="text-[#858585] font-sans truncate">Total Market Exposure</span>
              <div className="text-right shrink-0">
                <span className="text-[#f5f5f5] font-semibold">${totalExposureUsd.toFixed(2)}</span>{" "}
                <span className="text-[#858585] text-[10px]">({tokensAcquired.toFixed(4)} {asset.ticker})</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 gap-2">
              <span className="text-[#858585] font-sans truncate">USDG Borrowed</span>
              <span className="text-[#f5f5f5] shrink-0">${borrowedUsdg.toFixed(2)} USDG</span>
            </div>
            <div className="flex items-center justify-between py-2 gap-2">
              <span className="text-[#858585] font-sans truncate">Health Factor</span>
              <span
                className={`font-bold shrink-0 ${
                  estimatedHf > 1.5 ? "text-[#e5e5e5]" : estimatedHf > 1.2 ? "text-[#f5a623]" : "text-[#ff6b6b]"
                }`}
              >
                {estimatedHf.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 gap-2">
              <span className="text-[#858585] font-sans truncate">Estimated Liq Price</span>
              <span className="text-[#f5a623] font-bold shrink-0">${estimatedLiqPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 text-[11px] gap-2">
              <span className="text-[#727272] font-sans truncate">Daily Borrow Fee</span>
              <span className="text-[#919191] shrink-0">
                ${dailyInterestUsd.toFixed(3)}/day ({borrowApr}%)
              </span>
            </div>
          </div>

          {/* Action Button */}
          {!isMarketOpen ? (
            <button
              disabled
              className="w-full py-3 px-3 rounded bg-[#141414] text-[#ff6b6b] border border-[#1f1f1f] font-display font-bold text-xs uppercase cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="truncate">Market Closed (Session Inactive)</span>
              <span className="text-[10px] bg-[#2a1414] px-1.5 py-0.5 rounded font-mono shrink-0">
                CLOSED
              </span>
            </button>
          ) : (
            <button
              onClick={handleOpenModal}
              disabled={numMargin <= 0}
              className={`w-full py-3 px-4 rounded font-display font-bold text-xs uppercase transition-all tracking-wider ${
                numMargin > 0
                  ? "bg-[#e5e5e5] hover:bg-[#ffffff] text-[#000000] shadow-[0_0_14px_rgba(229,229,229,0.25)] cursor-pointer"
                  : "bg-[#161616] text-[#727272] border border-[#1f1f1f] cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 truncate">
                <span>Open {leverage.toFixed(1)}x Long {asset.ticker}</span>
                <span className="font-mono text-[11px] opacity-85">
                  (${marginUsd || "0"} Margin)
                </span>
              </div>
            </button>
          )}

          {/* Confirmation Feedback Banner & Open Position Card */}
          {confirmedTxHash && (
            <div className="mt-4 p-3.5 bg-[rgba(229,229,229,0.06)] border border-[rgba(229,229,229,0.3)] rounded-sm text-xs font-mono text-[#e5e5e5] flex flex-col gap-3">
              <div>
                <div className="font-bold font-display uppercase tracking-wide flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#e5e5e5] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Long Position Successfully Opened</span>
                </div>
                <div className="text-[11px] text-[#8d8d8d] mt-1 break-all font-mono">
                  Tx Hash: {confirmedTxHash}
                </div>
                <div className="text-[10px] text-[#919191] mt-0.5">
                  Settled in atomic transaction · Block #8b8b8b · Synced to Local Storage
                </div>
              </div>

              {/* ACTIVE OPEN POSITION DETAILS CARD */}
              {(executedPosition || activeStoredPosition) && (
                <div className="bg-[#000000] border border-[rgba(229,229,229,0.25)] p-3 rounded-sm text-xs text-[#f5f5f5] flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-[#181818] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#e5e5e5] animate-pulse shrink-0" />
                      <span className="font-display font-bold text-xs uppercase tracking-wider text-[#e5e5e5]">
                        Active Open Position
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(229,229,229,0.12)] text-[#e5e5e5] font-display font-semibold">
                      {(executedPosition || activeStoredPosition)?.leverage.toFixed(1)}x Long
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-[#0b0b0b] p-2 rounded border border-[#181818]">
                      <span className="text-[#858585] block text-[10px] uppercase font-sans">Market Exposure</span>
                      <span className="text-[#f5f5f5] font-bold text-xs">
                        ${(executedPosition || activeStoredPosition)?.collateralUsd.toFixed(2)}
                      </span>
                      <span className="text-[#858585] text-[10px] block">
                        ({(executedPosition || activeStoredPosition)?.collateralTokens.toFixed(4)} {asset.ticker})
                      </span>
                    </div>
                    <div className="bg-[#0b0b0b] p-2 rounded border border-[#181818]">
                      <span className="text-[#858585] block text-[10px] uppercase font-sans">Margin Equity</span>
                      <span className="text-[#e5e5e5] font-bold text-xs">
                        ${(executedPosition || activeStoredPosition)?.equityUsd.toFixed(2)} USDG
                      </span>
                      <span className="text-[#919191] text-[10px] block">
                        Debt: ${(executedPosition || activeStoredPosition)?.debtUsd.toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-[#0b0b0b] p-2 rounded border border-[#181818]">
                      <span className="text-[#858585] block text-[10px] uppercase font-sans">Health Factor</span>
                      <span className="text-[#e5e5e5] font-bold">
                        {(executedPosition || activeStoredPosition)?.healthFactor.toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-[#0b0b0b] p-2 rounded border border-[#181818]">
                      <span className="text-[#858585] block text-[10px] uppercase font-sans">Liq Reference</span>
                      <span className="text-[#f5a623] font-bold">
                        ${(executedPosition || activeStoredPosition)?.liquidationPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <a
                    href="#positions-table"
                    className="mt-1 py-1.5 px-2.5 rounded bg-[#131313] hover:bg-[#1a1a1a] text-[#e5e5e5] border border-[#252525] font-display font-semibold text-[11px] text-center transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>View in Your Active Positions Table</span>
                    <span>↓</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* WALLET SIGNATURE CONFIRMATION MODAL */}
      <ChinaWalletSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onConfirmed={handleWalletConfirmed}
        txDetails={{
          title: `Open ${leverage.toFixed(1)}x Long ${asset.ticker}`,
          actionName: "executeAtomicLeverageLong",
          assetSymbol: asset.ticker,
          details: [
            { label: "Margin Deposit", value: `$${numMargin.toFixed(2)} USDG` },
            { label: "Borrowed Capital", value: `$${borrowedUsdg.toFixed(2)} USDG` },
            { label: "Total Exposure", value: `$${totalExposureUsd.toFixed(2)} USDG (${tokensAcquired.toFixed(4)} ${asset.ticker})` },
            { label: "Effective Leverage", value: `${leverage.toFixed(1)}x` },
            { label: "Estimated Health Factor", value: estimatedHf.toFixed(2) },
            { label: "Estimated Liq Price", value: `$${estimatedLiqPrice.toFixed(2)}` },
          ],
        }}
      />
    </div>
  );
}
