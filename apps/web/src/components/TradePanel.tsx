"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { env } from "../env.mjs";
import { marketPath, tradePath } from "../lib/asset-catalog";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { MarketConfig, PositionType } from "@nash/types";
import { TransactionPreviewModal } from "./TransactionPreviewModal";
import { AssetLogo } from "./AssetLogo";
import { useNetworkMode } from "../hooks/useNetworkMode";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { useLeverageTrade } from "../hooks/useLeverageTrade";

interface TradePanelProps {
  markets: MarketConfig[];
  selectedSymbol?: string;
  onPositionCreated?: (positionData: any) => void;
  isLoading?: boolean;
}

export function TradePanelSkeleton() {
  return (
    <div className="bg-surface border border-ink/10 rounded-sm p-6 sm:p-8 font-sans animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Col Shimmer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-3 gap-2">
            <div className="h-10 bg-ink/10 rounded-sm" />
            <div className="h-10 bg-ink/5 rounded-sm" />
            <div className="h-10 bg-ink/5 rounded-sm" />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <div className="h-3 w-36 bg-ink/10 rounded-xs" />
              <div className="h-3 w-28 bg-ink/10 rounded-xs" />
            </div>
            <div className="h-14 bg-ink/5 border border-ink/10 rounded-sm" />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <div className="h-3 w-40 bg-ink/10 rounded-xs" />
              <div className="h-3 w-24 bg-ink/10 rounded-xs" />
            </div>
            <div className="h-14 bg-ink/5 border border-ink/10 rounded-sm" />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <div className="h-3 w-32 bg-ink/10 rounded-xs" />
              <div className="h-5 w-16 bg-brand/20 rounded-xs" />
            </div>
            <div className="h-2 w-full bg-ink/5 rounded-sm" />
          </div>
        </div>

        {/* Right Col Shimmer */}
        <div className="lg:col-span-5 bg-background border border-ink/10 p-6 rounded-sm space-y-5">
          <div className="h-4 w-44 bg-ink/10 rounded-xs pb-2 border-b border-ink/10" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-3 w-32 bg-ink/5 rounded-xs" />
                <div className="h-3 w-20 bg-ink/10 rounded-xs" />
              </div>
            ))}
          </div>
          <div className="h-14 bg-ink/5 rounded-sm border border-ink/10" />
          <div className="h-12 bg-brand/20 rounded-sm" />
        </div>
      </div>
    </div>
  );
}

export function TradePanel({
  markets,
  selectedSymbol,
  onPositionCreated,
  isLoading,
}: TradePanelProps) {
  const router = useRouter();
  const { networkMode } = useNetworkMode();
  const {
    usdgBalance,
    balanceAvailable,
    refetch: refetchBalances,
  } = useTokenBalances(networkMode, "USDG");
  const { executeTrade, step, txHash, errorMessage, resetTrade } =
    useLeverageTrade(networkMode);

  const [positionType, setPositionType] = useState<PositionType>("LONG");
  const [currentSymbol] = useState<string>(selectedSymbol ?? "");
  const [collateralAmount, setCollateralAmount] = useState<string>("");
  const [leverage, setLeverage] = useState<number>(2.0);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // 1. Loading state
  if (isLoading || !markets) {
    return <TradePanelSkeleton />;
  }

  // 2. Empty state
  if (markets.length === 0) {
    return (
      <div className="bg-surface border border-dashed border-ink/10 rounded-sm p-16 text-center font-sans space-y-3">
        <span className="text-ink font-bold block text-sm uppercase tracking-wider">
          [NO TRADING MARKETS AVAILABLE]
        </span>
        <p className="text-xs text-muted-dark max-w-md mx-auto">
          No isolated equity or ETF markets are currently online. Please ensure
          backend services are active.
        </p>
      </div>
    );
  }

  const activeMarket =
    markets.find((m) => m.assetSymbol === currentSymbol) || markets[0];

  const numericCollateral = parseFloat(collateralAmount) || 0;
  const markPrice = activeMarket.markPrice;

  const totalExposureUsd = numericCollateral * leverage;
  const borrowedDebtUsd = Math.max(0, totalExposureUsd - numericCollateral);

  const stockExposure = markPrice > 0 ? totalExposureUsd / markPrice : 0;
  const stockDebt = markPrice > 0 ? borrowedDebtUsd / markPrice : 0;
  const liquidationPrice =
    positionType === "SHORT"
      ? stockDebt > 0
        ? (totalExposureUsd * (activeMarket.liquidationLtv / 100)) / stockDebt
        : 0
      : stockExposure > 0
        ? borrowedDebtUsd /
          ((stockExposure * activeMarket.liquidationLtv) / 100)
        : 0;
  const distanceToLiquidation =
    markPrice > 0 && numericCollateral > 0
      ? Math.abs(((markPrice - liquidationPrice) / markPrice) * 100)
      : 0;

  const leverageSteps = [1.25, 1.5, 2.0, 2.5].filter(
    (value) => value <= activeMarket.maxLeverage,
  );

  const isLong = positionType === "LONG";
  const isShort = positionType === "SHORT";
  const isMultiply = positionType === "MULTIPLY";

  const handleConfirmTrade = async () => {
    try {
      const confirmedHash = await executeTrade({
        symbol: currentSymbol,
        positionType,
        collateralAmount: numericCollateral,
        leverage,
        markPrice,
      });

      refetchBalances();

      if (onPositionCreated) {
        onPositionCreated({
          assetSymbol: currentSymbol,
          positionType,
          leverage,
          equityUsd: numericCollateral,
          exposureUsd: totalExposureUsd,
          markPrice,
          liquidationPrice,
          txHash: confirmedHash,
        });
      }
    } catch {
      // The transaction hook exposes a sanitized error in the preview.
    }
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch font-sans">
      {/* Left Column: Market Context & Risk Parameters */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="bg-surface border border-ink/10 p-6 rounded-sm space-y-6 flex-1">
          <div className="flex flex-wrap gap-4 items-center justify-between border-b border-ink/10 pb-4">
            <div className="flex items-center gap-4">
              <AssetLogo
                symbol={activeMarket?.assetSymbol || "NVDA"}
                size="lg"
              />
              <div>
                <h2 className="text-xl font-bold font-sans text-ink uppercase flex items-center gap-3">
                  {activeMarket?.name}
                </h2>
                <span className="text-xs text-muted uppercase">
                  ROBINHOOD CHAIN ISOLATED PAIR
                </span>
              </div>
            </div>

            <div className="text-right tabular-nums">
              <span className="text-xs text-muted uppercase block">
                MARKET SNAPSHOT
              </span>
              <span className="text-2xl font-bold text-ink font-sans">
                ${activeMarket?.markPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Risk Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums uppercase">
            <div className="bg-surface-subtle p-4 rounded-sm border border-ink/10 space-y-1">
              <span className="text-[10px] text-muted block">MAX LTV</span>
              <span className="font-bold text-ink font-sans text-sm">
                {activeMarket?.maxLtv}%
              </span>
            </div>
            <div className="bg-surface-subtle p-4 rounded-sm border border-ink/10 space-y-1">
              <span className="text-[10px] text-muted block">
                LIQUIDATION LTV
              </span>
              <span className="font-bold text-ink font-sans text-sm">
                {activeMarket?.liquidationLtv}%
              </span>
            </div>
            <div className="bg-surface-subtle p-4 rounded-sm border border-ink/10 space-y-1">
              <span className="text-[10px] text-muted block">BORROW APR</span>
              <span className="font-bold text-warn-strong font-sans text-sm">
                {activeMarket?.borrowApr}%
              </span>
            </div>
            <div className="bg-surface-subtle p-4 rounded-sm border border-ink/10 space-y-1">
              <span className="text-[10px] text-muted block">LIQUIDITY</span>
              <span className="font-bold text-ink font-sans text-sm">
                $
                {((activeMarket?.availableLiquidityUsd || 0) / 1000).toFixed(0)}
                K
              </span>
            </div>
          </div>
        </div>

        <Link
          className="text-action"
          href={marketPath(activeMarket.assetSymbol)}
        >
          View market details <span>↗</span>
        </Link>
        {/* Market Asset Switcher */}
        <div className="bg-surface border border-ink/10 p-6 rounded-sm space-y-4">
          <span className="text-xs font-bold text-muted uppercase tracking-wider block font-sans">
            SELECT ASSET MARKET
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {markets.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  router.push(tradePath(m.assetSymbol));
                  setIsPreviewOpen(false);
                  resetTrade();
                }}
                className={`p-3 rounded-sm border text-left transition-all flex items-center gap-3 ${
                  currentSymbol === m.assetSymbol
                    ? "bg-surface-subtle border-brand text-ink"
                    : "bg-surface border-ink/10 text-muted hover:text-ink hover:border-fg-3"
                }`}
              >
                <AssetLogo symbol={m.assetSymbol} size="sm" />
                <div>
                  <div className="font-bold text-xs text-ink font-sans">
                    {m.assetSymbol}
                  </div>
                  <div className="text-[10px] font-sans text-muted">
                    ${m.markPrice.toFixed(2)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Execution Order Form */}
      <div className="lg:col-span-5 bg-surface border border-ink/10 p-6 rounded-sm space-y-6">
        {/* Order Direction Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-surface-subtle p-1.5 rounded-sm border border-ink/10 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setPositionType("LONG")}
            className={`py-3 rounded-sm transition-all ${
              isLong ? "bg-go text-on-go" : "text-muted hover:text-ink"
            }`}
          >
            LONG
          </button>
          <button
            onClick={() => setPositionType("SHORT")}
            className={`py-3 rounded-sm transition-all ${
              isShort
                ? "bg-neg-strong text-ink"
                : "text-muted hover:text-ink"
            }`}
          >
            SHORT
          </button>
          <button
            onClick={() => setPositionType("MULTIPLY")}
            className={`py-3 rounded-sm transition-all ${
              isMultiply
                ? "bg-accent text-on-accent"
                : "text-muted hover:text-ink"
            }`}
          >
            MULTIPLY
          </button>
        </div>

        {/* Collateral Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted uppercase">
              COLLATERAL ({activeMarket ? activeMarket.debtToken : "USDG"})
            </span>
            <div className="flex items-center gap-2">
              <span className="text-muted font-sans">
                BAL:{" "}
                <strong className="text-ink">
                  {balanceAvailable
                    ? `$${usdgBalance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "Unavailable"}
                </strong>
              </span>
              {networkMode === "TESTNET" && (
                <a
                  href={env.USDG_FAUCET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-action"
                  title="Open the USDG faucet"
                >
                  USDG faucet ↗
                </a>
              )}
            </div>
          </div>
          <div className="relative">
            <input
              aria-label="Collateral amount in USDG"
              min="0"
              type="number"
              value={collateralAmount}
              onChange={(e) => setCollateralAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-surface-subtle border border-ink/15 focus:border-brand rounded-sm py-3 px-4 font-sans font-bold text-lg text-ink outline-none tabular-nums"
            />
            <button
              disabled={!balanceAvailable}
              onClick={() => setCollateralAmount(usdgBalance.toString())}
              className="absolute right-3 top-2.5 text-[10px] font-bold text-brand bg-brand/10 border border-brand/30 px-2 py-1 rounded-sm uppercase tracking-wider"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Leverage Selector */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted uppercase">TARGET LEVERAGE</span>
            <span className="font-sans font-bold text-brand">
              {leverage.toFixed(2)}X
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {leverageSteps.map((stepVal) => (
              <button
                key={stepVal}
                onClick={() => setLeverage(stepVal)}
                className={`py-2 rounded-sm text-xs font-sans font-bold transition-all ${
                  leverage === stepVal
                    ? "bg-silver-light text-on-accent"
                    : "bg-surface-subtle border border-ink/10 text-muted hover:text-ink"
                }`}
              >
                {stepVal.toFixed(2)}X
              </button>
            ))}
          </div>
        </div>

        {/* Summary Table */}
        <div className="bg-surface-subtle rounded-sm p-4 border border-ink/10 space-y-2 text-xs font-sans tabular-nums uppercase">
          <div className="flex justify-between text-muted">
            <span>TOTAL EXPOSURE</span>
            <span className="font-bold text-ink">
              ${totalExposureUsd.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-muted">
            <span>BORROWED DEBT</span>
            <span className="font-bold text-warn-strong">
              ${borrowedDebtUsd.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-muted border-t border-ink/10 pt-2">
            <span>EST. LIQUIDATION PRICE</span>
            <span className="font-bold text-neg-strong">
              {numericCollateral > 0 ? `$${liquidationPrice.toFixed(2)}` : "—"}
            </span>
          </div>
          <div className="flex justify-between text-muted">
            <span>LIQUIDATION BUFFER</span>
            <span className="font-bold text-go">
              {numericCollateral > 0
                ? `${distanceToLiquidation.toFixed(1)}%`
                : "—"}
            </span>
          </div>
        </div>

        {/* Market Status Alert Banners */}
        {activeMarket?.status === "REDUCE_ONLY" && (
          <div className="bg-warn-strong/10 border border-warn-strong/30 p-3 rounded-sm text-xs font-sans text-warn-strong space-y-1">
            <div className="font-bold uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-warn-strong animate-pulse inline-block" />
              REDUCE-ONLY MODE ACTIVE
            </div>
            <p className="text-[11px] text-warn-strong/80">
              US Equity market is currently closed. New leverage orders are
              paused until next session.
            </p>
          </div>
        )}

        {activeMarket?.status === "PAUSED" && (
          <div className="bg-neg-strong/10 border border-neg-strong/30 p-3 rounded-sm text-xs font-sans text-neg-strong space-y-1">
            <div className="font-bold uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neg-strong animate-pulse inline-block" />
              CIRCUIT BREAKER ACTIVE (PAUSED)
            </div>
            <p className="text-[11px] text-neg-strong/80">
              Trading is suspended due to extreme volatility or oracle
              protection.
            </p>
          </div>
        )}

        {!env.TRADING_ENABLED && (
          <p className="app-note" role="status">
            Order submission is disabled while contract deployment, pricing, and
            receipt reconciliation are verified. Displayed exposure and
            liquidation levels are indicative calculations, not execution
            quotes.
          </p>
        )}
        {/* Execute Button */}
        <button
          onClick={() => {
            resetTrade();
            setIsPreviewOpen(true);
          }}
          disabled={
            !env.TRADING_ENABLED ||
            !Number.isFinite(numericCollateral) ||
            markPrice <= 0 ||
            leverage > activeMarket.maxLeverage ||
            numericCollateral <= 0 ||
            activeMarket?.status === "REDUCE_ONLY" ||
            activeMarket?.status === "PAUSED"
          }
          className={`w-full py-4 rounded-sm font-sans font-extrabold text-xs uppercase tracking-widest transition-all inline-flex items-center justify-center gap-2 ${
            activeMarket?.status === "REDUCE_ONLY" ||
            activeMarket?.status === "PAUSED"
              ? "bg-ink/10 text-ink/40 cursor-not-allowed border border-ink/10"
              : isShort
                ? "bg-neg-strong text-on-neg hover:bg-neg"
                : isMultiply
                  ? "bg-accent text-on-accent hover:bg-accent-soft"
                  : "bg-go text-on-go hover:bg-go-hover"
          }`}
        >
          {!env.TRADING_ENABLED ? (
            <span>Execution awaiting deployment validation</span>
          ) : activeMarket?.status === "REDUCE_ONLY" ? (
            <span>MARKET CLOSED (REDUCE-ONLY)</span>
          ) : activeMarket?.status === "PAUSED" ? (
            <span>MARKET PAUSED (CIRCUIT BREAKER)</span>
          ) : (
            <>
              <span>
                EXECUTE {positionType} ({leverage.toFixed(1)}X)
              </span>
              <ArrowUpRight className="w-4 h-4" />
            </>
          )}
        </button>

        <TransactionPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onConfirm={handleConfirmTrade}
          assetSymbol={currentSymbol}
          debtToken={activeMarket.debtToken}
          positionType={positionType}
          collateralUsd={numericCollateral}
          leverage={leverage}
          markPrice={markPrice}
          estimatedLiquidationPrice={liquidationPrice}
          borrowApr={activeMarket.borrowApr}
          tradingFeeUsd={numericCollateral * 0.001}
          protocolFeeUsd={1.0}
          step={step}
          txHash={txHash}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  );
}
