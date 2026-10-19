"use client";

import React from "react";

interface ChinaAssetLogoProps {
  symbol: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-5 h-5 text-[9px]",
  md: "w-6 h-6 text-[10px]",
  lg: "w-8 h-8 text-xs",
};

export function ChinaAssetLogo({ symbol, size = "md", className = "" }: ChinaAssetLogoProps) {
  const cleanSymbol = symbol ? symbol.toUpperCase().slice(0, 4) : "CN";
  return (
    <div
      className={`rounded bg-panel-subtle border border-line flex items-center justify-center font-display font-bold text-fg-2 shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {cleanSymbol.slice(0, 3)}
    </div>
  );
}
