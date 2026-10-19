"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";

export interface WalletTxDetails {
  title: string;
  actionName: string;
  assetSymbol: string;
  details: { label: string; value: string }[];
  gasEstimateEth?: string;
}

interface ChinaWalletSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmed: (txHash: string) => void;
  txDetails: WalletTxDetails;
}

export function ChinaWalletSignatureModal({
  isOpen,
  onClose,
  onConfirmed,
  txDetails,
}: ChinaWalletSignatureModalProps) {
  const { address } = useAccount();
  const [step, setStep] = useState<"READY" | "SIGNING" | "BROADCASTING">("READY");

  if (!isOpen) return null;

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "0x7a2...4e91";

  const handleConfirmSign = () => {
    setStep("SIGNING");

    setTimeout(() => {
      setStep("BROADCASTING");

      setTimeout(() => {
        const generatedHash = `0x${Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("")}`;
        setStep("READY");
        onConfirmed(generatedHash);
      }, 900);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 bg-page/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-raised border border-line shadow-[0_0_40px_color-mix(in_srgb,var(--bg)_80%,transparent)] rounded-sm max-w-md w-full p-5 flex flex-col gap-4 font-sans text-xs animate-in fade-in zoom-in-95 duration-150">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-line-soft pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-go animate-pulse" />
            <h3 className="text-sm font-bold font-display text-fg uppercase tracking-wider">
              Wallet Signature Request
            </h3>
          </div>
          {step === "READY" && (
            <button
              onClick={onClose}
              className="text-muted hover:text-ink transition-colors"
              aria-label="Close dialog"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* NETWORK & ACCOUNT BADGE */}
        <div className="flex items-center justify-between bg-panel-subtle border border-line p-2.5 rounded-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-accent text-on-accent font-bold font-display flex items-center justify-center text-[10px]">
              RH
            </div>
            <div>
              <span className="text-[10px] text-muted block font-display">Target Network</span>
              <span className="font-mono text-fg text-[11px]">Robinhood Chain (4663)</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted block font-display">Account</span>
            <span className="font-mono text-fg-2 text-[11px]">{displayAddress}</span>
          </div>
        </div>

        {/* TRANSACTION SPECIFICATION */}
        <div className="bg-page border border-line-soft p-3.5 rounded-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-line-soft pb-2">
            <span className="text-muted font-display uppercase text-[10px]">Contract Method</span>
            <span className="text-fg font-mono text-[11px] font-semibold">
              {txDetails.actionName}
            </span>
          </div>

          {txDetails.details.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-[11px]">
              <span className="text-muted">{item.label}</span>
              <span className="font-mono text-fg">{item.value}</span>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2 border-t border-line-soft text-[11px]">
            <span className="text-muted">Network Gas Fee</span>
            <span className="font-mono text-fg-3">
              {txDetails.gasEstimateEth || "~0.00018 ETH ($0.45)"}
            </span>
          </div>
        </div>

        {/* STATUS STEP INDICATOR */}
        {step === "SIGNING" && (
          <div className="p-3 bg-panel border border-line rounded text-center flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-fg-2 font-display font-medium text-[11px]">
              Awaiting Signature in Wallet...
            </span>
            <span className="text-[10px] text-muted">
              Please confirm the transaction request in your wallet extension.
            </span>
          </div>
        )}

        {step === "BROADCASTING" && (
          <div className="p-3 bg-panel border border-line rounded text-center flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-fg-2 font-display font-medium text-[11px]">
              Broadcasting to Robinhood Chain...
            </span>
            <span className="text-[10px] text-muted">
              Submitting transaction to block inclusion.
            </span>
          </div>
        )}

        {/* ACTIONS */}
        {step === "READY" && (
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-panel hover:bg-panel-hover text-fg-2 border border-line font-display text-xs transition-colors"
            >
              Reject
            </button>
            <button
              onClick={handleConfirmSign}
              className="px-4 py-1.5 rounded btn-silver font-display font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <span>Sign &amp; Confirm in Wallet</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
