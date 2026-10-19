'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Calculator, ShieldCheck, Zap } from 'lucide-react';
import { AssetLogo } from './AssetLogo';
import { MarketConfig } from '@nash/types';

interface MarketOption {
  symbol: string;
  name: string;
  price: number;
  maxLtv: number;
  borrowApr: number;
}

interface LeverageCalculatorProps {
  markets?: MarketConfig[];
  isLoading?: boolean;
}

/**
 * Shimmer Loading Skeleton for LeverageCalculator
 * Displayed while real-time market data is being fetched from the backend API and oracle.
 */
export function LeverageCalculatorSkeleton() {
  return (
    <section className="space-y-8 font-mono">
      <div className="border-b border-ink/10 pb-4 flex justify-between items-end">
        <div>
          <span className="text-xs text-fg-3 font-bold block uppercase tracking-widest animate-pulse">
            [STRATEGY SIMULATOR — SYNCING ORACLE FEEDS]
          </span>
          <h2 className="text-2xl sm:text-4xl font-normal tracking-tight text-ink uppercase font-mono mt-1">
            LEVERAGE & BORROW CALCULATOR
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted uppercase hidden sm:flex">
          <span className="w-2 h-2 rounded-full bg-fg-3 animate-pulse" />
          <span>CONNECTING ROBINHOOD DATA...</span>
        </div>
      </div>

      <div className="bg-page border border-ink/15 rounded-sm p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column Shimmer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="h-3 w-52 bg-ink/10 rounded-sm animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-ink/5 border border-ink/10 rounded-sm animate-pulse" />
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <div className="h-3 w-40 bg-ink/10 rounded-sm animate-pulse" />
              <div className="h-5 w-24 bg-ink/10 rounded-sm animate-pulse" />
            </div>
            <div className="h-2 w-full bg-ink/5 rounded-sm animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-6 w-12 bg-ink/5 rounded-sm animate-pulse" />
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <div className="h-3 w-48 bg-ink/10 rounded-sm animate-pulse" />
              <div className="h-5 w-16 bg-ink/10 rounded-sm animate-pulse" />
            </div>
            <div className="h-2 w-full bg-ink/5 rounded-sm animate-pulse" />
          </div>
        </div>

        {/* Right Column Shimmer */}
        <div className="lg:col-span-5 bg-page border border-ink/10 p-6 rounded-sm space-y-5">
          <div className="h-4 w-52 bg-ink/10 rounded-sm animate-pulse pb-2 border-b border-ink/10" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-3 w-36 bg-ink/5 rounded-sm animate-pulse" />
                <div className="h-3 w-20 bg-ink/10 rounded-sm animate-pulse" />
              </div>
            ))}
          </div>
          <div className="h-14 bg-ink/5 rounded-sm animate-pulse border border-fg-3/20" />
          <div className="h-12 bg-fg-3/20 rounded-sm animate-pulse" />
        </div>
      </div>
    </section>
  );
}

export function LeverageCalculator({ markets, isLoading }: LeverageCalculatorProps = {}) {
  // 1. Loading Shimmer Skeleton
  if (isLoading || !markets) {
    return <LeverageCalculatorSkeleton />;
  }

  // 2. Empty State
  if (markets.length === 0) {
    return (
      <section className="space-y-8 font-mono">
        <div className="border-b border-ink/10 pb-4">
          <span className="text-xs text-fg-3 font-bold block uppercase tracking-widest">
            [STRATEGY SIMULATOR]
          </span>
          <h2 className="text-2xl sm:text-4xl font-normal tracking-tight text-ink uppercase font-mono mt-1">
            LEVERAGE & BORROW CALCULATOR
          </h2>
        </div>
        <div className="bg-page border border-dashed border-ink/10 rounded-sm p-12 text-center space-y-2">
          <p className="text-ink font-bold text-sm tracking-wider">[NO ACTIVE ASSETS TO SIMULATE]</p>
          <p className="text-xs text-dim">
            Market oracle configuration is currently unavailable. Please verify backend API status.
          </p>
        </div>
      </section>
    );
  }

  const marketOptions: MarketOption[] = markets.map((m) => ({
    symbol: m.assetSymbol,
    name: m.name,
    price: m.markPrice || 100,
    maxLtv: m.maxLtv || 75,
    borrowApr: m.borrowApr || 6.0,
  }));

  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [collateralUsd, setCollateralUsd] = useState<number>(10000);
  const [leverageMultiplier, setLeverageMultiplier] = useState<number>(2.0);

  const currentSymbol = selectedSymbol || (marketOptions[0]?.symbol ?? 'NVDA');
  const currentMarket = marketOptions.find((m) => m.symbol === currentSymbol) || marketOptions[0];

  // Calculation Logic
  const totalPositionSize = collateralUsd * leverageMultiplier;
  const borrowedAmount = totalPositionSize - collateralUsd;
  const currentLtvPercent = (borrowedAmount / totalPositionSize) * 100;
  const autoProtectLtv = Math.min(88, currentMarket.maxLtv + 8);
  const estimatedShares = totalPositionSize / (currentMarket.price || 1);
  const annualInterestFee = borrowedAmount * (currentMarket.borrowApr / 100);

  return (
    <section className="space-y-8 font-mono">
      <div className="border-b border-ink/10 pb-4 flex justify-between items-end">
        <div>
          <span className="text-xs text-fg-3 font-bold block uppercase tracking-widest">
            [STRATEGY SIMULATOR]
          </span>
          <h2 className="text-2xl sm:text-4xl font-normal tracking-tight text-ink uppercase font-mono mt-1">
            LEVERAGE & BORROW CALCULATOR
          </h2>
        </div>
        <span className="text-xs text-muted uppercase hidden sm:block">
          [ESTIMATE POWER & SAFEGUARDS]
        </span>
      </div>

      <div className="bg-page border border-ink/15 rounded-sm p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Asset Selection */}
          <div className="space-y-3">
            <label className="text-xs text-muted block uppercase tracking-wider">
              1. SELECT TOKENIZED EQUITY COLLATERAL
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {marketOptions.map((m) => {
                const isActive = m.symbol === currentSymbol;
                return (
                  <button
                    key={m.symbol}
                    type="button"
                    onClick={() => setSelectedSymbol(m.symbol)}
                    className={`flex items-center gap-2.5 p-3 border rounded-sm transition-all text-left ${
                      isActive
                        ? 'bg-fg-3/10 border-fg-3 text-ink'
                        : 'bg-page border-ink/10 text-muted hover:border-ink/30'
                    }`}
                  >
                    <AssetLogo symbol={m.symbol} size="sm" />
                    <div>
                      <span className="text-xs font-bold text-ink block">{m.symbol}</span>
                      <span className="text-[10px] text-muted block">${m.price.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Collateral Amount Input & Presets */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs uppercase">
              <label className="text-muted">2. DEPOSIT COLLATERAL (USD)</label>
              <span className="text-ink font-bold text-base tabular-nums">
                ${collateralUsd.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={500}
              max={100000}
              step={500}
              value={collateralUsd}
              onChange={(e) => setCollateralUsd(Number(e.target.value))}
              className="w-full h-1.5 bg-page accent-fg-3 cursor-pointer rounded-lg border border-ink/10"
            />
            <div className="flex gap-2">
              {[1000, 5000, 10000, 25000, 50000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCollateralUsd(preset)}
                  className="px-2.5 py-1 text-[10px] bg-page border border-ink/10 hover:border-fg-3 text-muted hover:text-ink rounded-sm transition-colors"
                >
                  ${(preset / 1000).toFixed(0)}K
                </button>
              ))}
            </div>
          </div>

          {/* 3. Leverage Multiplier Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs uppercase">
              <label className="text-muted">3. TARGET LEVERAGE MULTIPLIER</label>
              <span className="text-fg-3 font-bold text-lg tabular-nums">
                {leverageMultiplier.toFixed(1)}X
              </span>
            </div>
            <input
              type="range"
              min={1.0}
              max={2.5}
              step={0.1}
              value={leverageMultiplier}
              onChange={(e) => setLeverageMultiplier(Number(e.target.value))}
              className="w-full h-1.5 bg-page accent-fg-3 cursor-pointer rounded-lg border border-ink/10"
            />
            <div className="flex justify-between text-[10px] text-muted">
              <span>1.0X (NO LEVERAGE)</span>
              <span>1.5X</span>
              <span>2.0X (RECOMMENDED)</span>
              <span>2.5X (MAX CAP)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Results & CTA */}
        <div className="lg:col-span-5 bg-page border border-ink/10 p-6 rounded-sm space-y-6">
          <div className="flex items-center gap-2 text-xs text-fg-3 font-bold uppercase tracking-wider pb-3 border-b border-ink/10">
            <Calculator className="w-4 h-4" />
            <span>ESTIMATED POSITION BREAKDOWN</span>
          </div>

          <div className="space-y-4 text-xs uppercase">
            <div className="flex justify-between items-center">
              <span className="text-muted">INITIAL COLLATERAL:</span>
              <span className="text-ink font-bold">${collateralUsd.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted">STABLECOIN BORROW:</span>
              <span className="text-ink font-bold">${borrowedAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted">TOTAL EXPOSURE:</span>
              <span className="text-fg-3 text-lg font-bold">
                ${totalPositionSize.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted">EQUITY EXPOSURE SHARES:</span>
              <span className="text-ink font-bold">{estimatedShares.toFixed(2)} {currentMarket.symbol}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-ink/5">
              <span className="text-muted">BORROW APR:</span>
              <span className="text-ink font-bold">{currentMarket.borrowApr}% / YR</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted">ESTIMATED INT. COST:</span>
              <span className="text-ink font-bold">${annualInterestFee.toFixed(2)} / YR</span>
            </div>

            <div className="p-3 bg-page border border-fg-3/30 rounded-sm space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-fg-3 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AUTO-PROTECT SAFEGUARD TRIGGER</span>
              </div>
              <p className="text-[10px] text-muted normal-case leading-snug">
                Positions automatically deleverage if LTV reaches{' '}
                <strong className="text-ink">{autoProtectLtv}%</strong> to protect your principal.
              </p>
            </div>
          </div>

          <Link
            href="/trade"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-fg-3 hover:bg-muted text-on-accent font-mono font-bold text-xs uppercase tracking-widest rounded-sm transition-all shadow-md hover:shadow-[0_0_15px_color-mix(in_srgb,var(--text-3)_40%,transparent)]"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>TRADE THIS STRATEGY NOW</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
