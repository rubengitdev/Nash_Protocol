"use client";

import React from "react";
import { Position } from "@nash/types";
import { AssetLogo } from "./AssetLogo";

interface OpenPositionsTableProps {
  positions: Position[];
  onClosePosition: (id: string) => void;
  isLoading?: boolean;
}

export function OpenPositionsTable({
  positions,
  onClosePosition,
  isLoading,
}: OpenPositionsTableProps) {
  if (isLoading) {
    return (
      <div className="bg-surface border border-ink/10 rounded-sm overflow-hidden w-full font-sans animate-pulse">
        <div className="p-4 border-b border-ink/10 bg-surface-subtle">
          <div className="h-3.5 w-44 bg-ink/10 rounded-xs" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex justify-between items-center py-3 border-b border-ink/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-ink/10" />
                <div className="h-3 w-20 bg-ink/10 rounded-xs" />
              </div>
              <div className="h-3 w-12 bg-ink/5 rounded-xs" />
              <div className="h-3 w-24 bg-ink/5 rounded-xs" />
              <div className="h-3 w-16 bg-ink/5 rounded-xs" />
              <div className="h-7 w-20 bg-ink/10 rounded-xs" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="bg-surface border border-ink/10 p-8 text-center text-muted space-y-2 font-sans uppercase text-xs rounded-sm">
        <p className="text-ink font-bold">
          NO ACTIVE MARGIN POSITIONS FOUND.
        </p>
        <p className="text-muted">
          OPEN A LONG, SHORT, OR MULTIPLY POSITION ON THE TRADE PAGE TO MANAGE
          EXPOSURE.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-ink/10 rounded-sm overflow-hidden w-full font-sans">
      <div className="p-4 border-b border-ink/10 bg-surface-subtle flex items-center justify-between uppercase">
        <h3 className="text-xs font-bold text-ink flex items-center gap-2">
          <span>ACTIVE OPEN POSITIONS</span>
          <span className="px-2 py-0.5 rounded-sm text-[10px] bg-surface text-brand border border-ink/10 font-sans">
            [{positions.length}]
          </span>
        </h3>
      </div>

      <div className="overflow-x-auto touch-scroll">
        <table className="w-full text-left text-xs tabular-nums uppercase min-w-[740px] sm:min-w-[840px]">
          <thead className="bg-surface-subtle text-[10px] text-muted font-bold uppercase tracking-wider border-b border-ink/10">
            <tr>
              <th className="py-3.5 px-3 sm:px-4 md:px-5 font-sans whitespace-nowrap">POSITION ASSET</th>
              <th className="py-3.5 px-3 sm:px-4 md:px-5 whitespace-nowrap">LEVERAGE</th>
              <th className="py-3.5 px-3 sm:px-4 md:px-5 whitespace-nowrap">EQUITY / EXPOSURE</th>
              <th className="py-3.5 px-3 sm:px-4 md:px-5 whitespace-nowrap">ENTRY PRICE</th>
              <th className="py-3.5 px-3 sm:px-4 md:px-5 whitespace-nowrap">MARK PRICE</th>
              <th className="py-3.5 px-3 sm:px-4 md:px-5 whitespace-nowrap">EST. LIQ PRICE</th>
              <th className="py-3.5 px-3 sm:px-4 md:px-5 whitespace-nowrap">HEALTH</th>
              <th className="py-3.5 px-3 sm:px-4 md:px-5 whitespace-nowrap">UNREALIZED PNL</th>
              <th className="py-3.5 px-3 sm:px-4 md:px-5 text-right font-sans whitespace-nowrap">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10 font-sans text-fg-2">
            {positions.map((pos) => {
              const isLong =
                pos.positionType === "LONG" || pos.positionType === "MULTIPLY";
              return (
                <tr
                  key={pos.id}
                  className="hover:bg-panel transition-colors"
                >
                  <td className="py-3.5 px-3 sm:px-4 md:px-5 font-sans whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <AssetLogo symbol={pos.assetSymbol} size="sm" />
                      <div>
                        <span className="text-ink text-xs font-bold block">
                          {pos.assetSymbol}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border uppercase ${
                            isLong
                              ? "bg-surface-subtle text-brand border-ink/10"
                              : "bg-surface-subtle text-neg-strong border-ink/10"
                          }`}
                        >
                          {pos.positionType}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 md:px-5 font-bold text-brand whitespace-nowrap">
                    {pos.leverage.toFixed(1)}X
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 md:px-5 whitespace-nowrap">
                    <span className="text-ink font-semibold block">
                      ${pos.equityUsd.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted font-normal">
                      EXP: ${pos.exposureUsd.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 md:px-5 text-muted whitespace-nowrap">
                    ${pos.entryPrice.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 md:px-5 text-ink font-semibold whitespace-nowrap">
                    ${pos.markPrice.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 md:px-5 text-neg-strong font-bold whitespace-nowrap">
                    ${pos.liquidationPrice.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 md:px-5 text-brand font-semibold whitespace-nowrap">
                    {pos.healthFactor.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 md:px-5 font-semibold whitespace-nowrap">
                    <span
                      className={
                        pos.pnlUsd >= 0 ? "text-go" : "text-neg-strong"
                      }
                    >
                      {pos.pnlUsd >= 0 ? "+" : ""}${pos.pnlUsd.toFixed(2)} (
                      {pos.pnlPercent >= 0 ? "+" : ""}
                      {pos.pnlPercent.toFixed(2)}%)
                    </span>
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 md:px-5 text-right font-sans whitespace-nowrap">
                    <button
                      onClick={() => onClosePosition(pos.id)}
                      className="px-3 py-1.5 btn-silver text-[11px] font-sans font-bold uppercase"
                    >
                      CLOSE
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
