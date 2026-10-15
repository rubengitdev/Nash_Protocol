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
      className={`rounded bg-[#161616] border border-[#262626] flex items-center justify-center font-display font-bold text-[#e5e5e5] shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {cleanSymbol.slice(0, 3)}
    </div>
  );
}
