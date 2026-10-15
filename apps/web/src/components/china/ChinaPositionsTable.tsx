"use client";

import React, { useState, useMemo } from "react";
import {
  type ChineseEquityPosition,
  formatPercent,
} from "../../lib/chinese-equities-client";

interface ChinaPositionsTableProps {
  positions: ChineseEquityPosition[];
  onPositionClosed?: (positionId: string) => void;
  onPositionUpdated?: (updatedPos: ChineseEquityPosition) => void;
}

type StatusFilter = "ALL" | "OPEN" | "CLOSED";

export function ChinaPositionsTable({
  positions,
  onPositionClosed,
  onPositionUpdated,
}: ChinaPositionsTableProps) {
  const [activeModal, setActiveModal] = useState<"CLOSE" | "REPAY" | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<ChineseEquityPosition | null>(null);
  const [repayAmount, setRepayAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // Segregate and sort open and closed positions
  const openPositions = useMemo(() => {
    return positions
      .filter((p) => p.status !== "CLOSED")
      .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }, [positions]);

  const closedPositions = useMemo(() => {
    return positions
      .filter((p) => p.status === "CLOSED")
      .sort((a, b) => {
        const timeA = new Date(a.closedAt || a.openedAt).getTime();
        const timeB = new Date(b.closedAt || b.openedAt).getTime();
        return timeB - timeA;
      });
  }, [positions]);

  // When "ALL": Open positions first, followed by closed positions below
  const displayPositions = useMemo(() => {
    if (statusFilter === "OPEN") return openPositions;
    if (statusFilter === "CLOSED") return closedPositions;
    return [...openPositions, ...closedPositions];
  }, [statusFilter, openPositions, closedPositions]);

  const handleOpenCloseModal = (pos: ChineseEquityPosition) => {
    setSelectedPosition(pos);
    setActiveModal("CLOSE");
  };

  const handleOpenRepayModal = (pos: ChineseEquityPosition) => {
    setSelectedPosition(pos);
    setRepayAmount(pos.debtUsd.toFixed(2));
    setActiveModal("REPAY");
  };

  const handleConfirmClose = () => {
    if (!selectedPosition) return;
    setIsProcessing(true);
    setTimeout(() => {
      if (onPositionClosed) {
        onPositionClosed(selectedPosition.id);
      }
      setIsProcessing(false);
      setActiveModal(null);
      setSelectedPosition(null);
    }, 800);
  };

  const handleConfirmRepay = () => {
    if (!selectedPosition) return;
    const numRepay = parseFloat(repayAmount) || 0;
    if (numRepay <= 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      const newDebt = Math.max(0, selectedPosition.debtUsd - numRepay);
      const newLtv =
        selectedPosition.collateralUsd > 0
          ? (newDebt / selectedPosition.collateralUsd) * 100
          : 0;
      const newHf =
        newDebt > 0
          ? (selectedPosition.collateralUsd *
              (selectedPosition.liquidationThreshold / 100)) /
            newDebt
          : 99.99;

      const updated: ChineseEquityPosition = {
        ...selectedPosition,
        debtUsd: newDebt,
        currentLtv: Number(newLtv.toFixed(2)),
        healthFactor: Number(newHf.toFixed(2)),
        status: newHf < 1.0 ? "CRITICAL" : newHf < 1.3 ? "WARNING" : "HEALTHY",
      };

      if (onPositionUpdated) {
        onPositionUpdated(updated);
      }
      setIsProcessing(false);
      setActiveModal(null);
      setSelectedPosition(null);
    }, 800);
  };

  if (positions.length === 0) {
    return (
      <div className="bg-[#080f20] border border-[#16254a] p-8 text-center rounded-sm font-sans">
        <h4 className="text-sm font-bold font-display text-[#eef2fa]">
          No Open Chinese Equity Positions
        </h4>
        <p className="text-xs text-[#8e9bb8] mt-1.5 leading-relaxed">
          You currently have no active collateral deposits, spot tokens, or leveraged positions in this market.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 font-sans">
      {/* POSITION STATUS & HISTORY FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080f20] border border-[#16254a] p-3 rounded-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-display font-bold uppercase tracking-wider text-[#eef2fa]">
            Position History &amp; Status
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8791aa]">
            <span className="text-[#2ee6a6]">{openPositions.length} Open</span>
            <span>·</span>
            <span className="text-[#98a2ba]">{closedPositions.length} Closed</span>
          </div>
        </div>

        {/* Filter Segmented Pills */}
        <div className="flex items-center gap-1 bg-[#050a18] p-1 border border-[#111622] rounded font-display text-xs">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`py-1 px-3 rounded transition-all font-semibold whitespace-nowrap ${
              statusFilter === "ALL"
                ? "bg-[#2ee6a6] text-[#050a18] shadow-[0_0_8px_rgba(46,230,166,0.2)]"
                : "text-[#8e9bb8] hover:text-white"
            }`}
          >
            All ({positions.length})
          </button>
          <button
            onClick={() => setStatusFilter("OPEN")}
            className={`py-1 px-3 rounded transition-all font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === "OPEN"
                ? "bg-[#2ee6a6] text-[#050a18] shadow-[0_0_8px_rgba(46,230,166,0.2)]"
                : "text-[#8e9bb8] hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ee6a6]" />
            <span>Open ({openPositions.length})</span>
          </button>
          <button
            onClick={() => setStatusFilter("CLOSED")}
            className={`py-1 px-3 rounded transition-all font-semibold whitespace-nowrap ${
              statusFilter === "CLOSED"
                ? "bg-[#2ee6a6] text-[#050a18] shadow-[0_0_8px_rgba(46,230,166,0.2)]"
                : "text-[#8e9bb8] hover:text-white"
            }`}
          >
            Closed ({closedPositions.length})
          </button>
        </div>
      </div>

      {/* FILTER EMPTY STATE */}
      {displayPositions.length === 0 ? (
        <div className="bg-[#080f20] border border-[#16254a] p-8 text-center rounded-sm font-sans">
          <h4 className="text-sm font-bold font-display text-[#eef2fa]">
            {statusFilter === "OPEN" ? "No Active Open Positions" : "No Closed History"}
          </h4>
          <p className="text-xs text-[#8e9bb8] mt-1.5 leading-relaxed">
            {statusFilter === "OPEN"
              ? "All your positions in this asset are currently closed. Switch filter to 'Closed' or 'All' to review historical trades."
              : "You have not closed any positions yet in this asset."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#16254a] rounded-sm bg-[#080f20]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#16254a] bg-[#0b1429] text-[#8e9bb8] font-display tracking-wider uppercase text-[11px] whitespace-nowrap">
                <th className="py-3 px-4 whitespace-nowrap">Market &amp; Type</th>
                <th className="py-3 px-4 whitespace-nowrap">Collateral</th>
                <th className="py-3 px-4 whitespace-nowrap">USDG Debt</th>
                <th className="py-3 px-4 whitespace-nowrap">Health Factor</th>
                <th className="py-3 px-4 whitespace-nowrap">Est. Liq Price</th>
                <th className="py-3 px-4 whitespace-nowrap">Unrealized PnL</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101c37] font-mono">
              {displayPositions.map((pos, index) => {
                const isClosed = pos.status === "CLOSED";
                const isUp = pos.pnlUsd >= 0;
                const isLiquidatable = !isClosed && pos.healthFactor < 1.0;

                return (
                  <React.Fragment key={pos.id}>
                    {/* Visual Section Divider when in ALL mode before the first closed position */}
                    {statusFilter === "ALL" &&
                      openPositions.length > 0 &&
                      index === openPositions.length &&
                      closedPositions.length > 0 && (
                        <tr className="bg-[#0b0e16] border-y border-[#161d2e]">
                          <td
                            colSpan={7}
                            className="py-2 px-4 text-[10px] font-display uppercase tracking-wider text-[#8e9bb8] font-semibold"
                          >
                            <div className="flex items-center gap-2">
                              <span>↓ Historical Closed Positions ({closedPositions.length})</span>
                              <span className="text-[#68728a] font-mono font-normal">· Settled on Robinhood Chain</span>
                            </div>
                          </td>
                        </tr>
                      )}

                    <tr
                      className={`transition-colors ${
                        isClosed
                          ? "bg-[#06080d]/70 opacity-80 hover:opacity-100"
                          : "hover:bg-[#0c1019]"
                      }`}
                    >
                      {/* Market & Type */}
                      <td className="py-3.5 px-4 font-sans whitespace-nowrap">
                        <div className="flex items-center gap-2.5 whitespace-nowrap">
                          <div
                            className={`w-7 h-7 rounded border flex items-center justify-center font-display font-bold text-xs shrink-0 ${
                              isClosed
                                ? "bg-[#0d172e] border-[#161d2e] text-[#7a859f]"
                                : "bg-[#101c37] border-[#1a2a4d] text-[#2ee6a6]"
                            }`}
                          >
                            {pos.assetSymbol.slice(0, 3)}
                          </div>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span
                              className={`font-bold text-sm font-display shrink-0 ${
                                isClosed ? "text-[#b9c2d6]" : "text-[#eef2fa]"
                              }`}
                            >
                              {pos.assetSymbol}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-display whitespace-nowrap shrink-0 ${
                                isClosed
                                  ? "bg-[#101c37] text-[#8791aa] border border-[#182033]"
                                  : pos.positionType === "LONG"
                                  ? "bg-[rgba(46,230,166,0.1)] text-[#2ee6a6] border border-[rgba(46,230,166,0.25)]"
                                  : pos.positionType === "SPOT"
                                  ? "bg-[rgba(46,230,166,0.08)] text-[#2ee6a6] border border-[rgba(46,230,166,0.2)]"
                                  : "bg-[#101520] text-[#c3cce0] border border-[#1a2a4d]"
                              }`}
                            >
                              {isClosed
                                ? "Closed"
                                : pos.positionType === "LONG"
                                ? `${pos.leverage}x Long`
                                : pos.positionType === "SPOT"
                                ? "Spot Hold"
                                : "Isolated"}
                            </span>
                            <span className="text-[#566079] text-xs shrink-0">·</span>
                            <span className="text-[11px] text-[#8791aa] font-mono whitespace-nowrap shrink-0">
                              Entry: ${pos.entryPrice.toFixed(2)}
                              {isClosed && pos.closedAt && (
                                <span className="text-[#68728a] ml-1">
                                  · Closed:{" "}
                                  {new Date(pos.closedAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Collateral */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <span className={isClosed ? "text-[#8791aa]" : "text-[#eef2fa] font-semibold"}>
                          ${pos.collateralUsd.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-[#7a859f] ml-1.5">
                          ({pos.collateralTokens.toFixed(2)} {pos.assetSymbol})
                        </span>
                      </td>

                      {/* Debt */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        {isClosed ? (
                          <span className="text-[#7a859f] text-xs">$0.00 (Settled)</span>
                        ) : (
                          <>
                            <span className="text-[#eef2fa] font-semibold">
                              ${pos.debtUsd.toFixed(2)} USDG
                            </span>
                            <span className="text-[11px] text-[#8791aa] ml-1.5">
                              (LTV: {pos.currentLtv.toFixed(1)}%)
                            </span>
                          </>
                        )}
                      </td>

                      {/* Health Factor */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        {isClosed ? (
                          <span className="text-[11px] text-[#7a859f] px-2 py-0.5 rounded bg-[#0c101a] border border-[#151c2b]">
                            Settled
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${
                                isLiquidatable
                                  ? "bg-[rgba(255,107,107,0.2)] text-[#ff6b6b] border border-[#ff6b6b] animate-pulse"
                                  : pos.healthFactor < 1.3
                                  ? "bg-[rgba(245,166,35,0.1)] text-[#f5a623] border border-[rgba(245,166,35,0.25)]"
                                  : "bg-[rgba(46,230,166,0.1)] text-[#2ee6a6] border border-[rgba(46,230,166,0.25)]"
                              }`}
                            >
                              {pos.healthFactor >= 99 ? "Safe" : pos.healthFactor.toFixed(2)}
                            </span>
                            {isLiquidatable && (
                              <span className="text-[10px] text-[#ff6b6b] font-display font-semibold uppercase whitespace-nowrap">
                                Liquidatable
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Est. Liq Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        {isClosed ? (
                          <span className="text-[#68728a]">—</span>
                        ) : (
                          <span className={isLiquidatable ? "text-[#ff6b6b] font-bold" : "text-[#b9c2d6]"}>
                            {pos.positionType === "SPOT" || pos.liquidationPrice <= 0
                              ? "None (Safe)"
                              : `$${pos.liquidationPrice.toFixed(2)}`}
                          </span>
                        )}
                      </td>

                      {/* PnL */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <span
                          className={`font-bold ${
                            isClosed
                              ? "text-[#8791aa]"
                              : isUp
                              ? "text-[#2ee6a6]"
                              : "text-[#ff6b6b]"
                          }`}
                        >
                          {isUp ? "+" : ""}${pos.pnlUsd.toFixed(2)}
                        </span>
                        <span
                          className={`text-[11px] ml-1.5 ${
                            isClosed
                              ? "text-[#68728a]"
                              : isUp
                              ? "text-[#2ee6a6] opacity-80"
                              : "text-[#ff6b6b] opacity-80"
                          }`}
                        >
                          ({formatPercent(pos.pnlPercent, true)})
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right font-sans whitespace-nowrap">
                        {isClosed ? (
                          <span className="text-[11px] text-[#7a859f] font-mono px-2.5 py-1 rounded bg-[#0c1019] border border-[#131928] inline-block">
                            Settled on Chain
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            {pos.debtUsd > 0 && (
                              <button
                                onClick={() => handleOpenRepayModal(pos)}
                                className="px-2.5 py-1 rounded bg-[#0f1a33] hover:bg-[#151c2b] text-[#c3cce0] hover:text-white border border-[#1a2a4d] text-xs font-display transition-colors whitespace-nowrap cursor-pointer"
                              >
                                Repay
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenCloseModal(pos)}
                              className="px-2.5 py-1 rounded bg-[#1e1414] hover:bg-[#2c1a1a] text-[#ff8888] hover:text-white border border-[#392020] text-xs font-display transition-colors whitespace-nowrap cursor-pointer"
                            >
                              {pos.positionType === "SPOT" ? "Sell Spot" : "Close"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CLOSE POSITION MODAL */}
      {activeModal === "CLOSE" && selectedPosition && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#080f20] border border-[#16254a] rounded-sm max-w-sm w-full p-5 flex flex-col gap-4 font-sans">
            <h3 className="text-sm font-bold font-display text-[#eef2fa]">
              {selectedPosition.positionType === "SPOT" ? "Sell Spot Holdings" : `Close ${selectedPosition.assetSymbol} Position`}
            </h3>
            <p className="text-xs text-[#8e9bb8] leading-relaxed">
              {selectedPosition.positionType === "SPOT" ? (
                <>
                  Confirm selling <strong className="text-[#eef2fa] font-mono">{selectedPosition.collateralTokens.toFixed(4)} {selectedPosition.assetSymbol}</strong> back to USDG at the current reference price.
                </>
              ) : (
                <>
                  Are you sure you want to close this position? Outstanding debt of{" "}
                  <strong className="text-[#eef2fa] font-mono">
                    ${selectedPosition.debtUsd.toFixed(2)} USDG
                  </strong>{" "}
                  will be settled and residual collateral returned.
                </>
              )}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#101c37]">
              <button
                disabled={isProcessing}
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 rounded bg-[#0f1a33] text-[#cdd4e4] border border-[#1a2a4d] text-xs font-display"
              >
                Cancel
              </button>
              <button
                disabled={isProcessing}
                onClick={handleConfirmClose}
                className="px-3 py-1.5 rounded bg-[#e53935] hover:bg-[#d32f2f] text-white font-display text-xs font-medium"
              >
                {isProcessing ? "Closing..." : "Confirm Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPAY MODAL */}
      {activeModal === "REPAY" && selectedPosition && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#080f20] border border-[#16254a] rounded-sm max-w-sm w-full p-5 flex flex-col gap-4 font-sans">
            <h3 className="text-sm font-bold font-display text-[#eef2fa]">
              Repay USDG Debt
            </h3>
            <p className="text-xs text-[#8e9bb8]">
              Enter amount of USDG to repay towards your{" "}
              {selectedPosition.assetSymbol} debt:
            </p>
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#8791aa] mb-1 font-mono">
                <span>Current Debt</span>
                <span>${selectedPosition.debtUsd.toFixed(2)} USDG</span>
              </div>
              <input
                type="number"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                className="w-full bg-[#050a18] border border-[#1a2a4d] rounded px-3 py-2 text-sm text-[#eef2fa] font-mono focus:outline-none focus:border-[#2ee6a6]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#101c37]">
              <button
                disabled={isProcessing}
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 rounded bg-[#0f1a33] text-[#cdd4e4] border border-[#1a2a4d] text-xs font-display"
              >
                Cancel
              </button>
              <button
                disabled={isProcessing}
                onClick={handleConfirmRepay}
                className="px-3 py-1.5 rounded bg-[#2ee6a6] hover:bg-[#39efb2] text-[#050a18] font-display text-xs font-bold"
              >
                {isProcessing ? "Repaying..." : "Confirm Repay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
