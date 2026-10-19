'use client';

import React from 'react';
import { ShieldCheck, TrendingUp, DollarSign, Lock } from 'lucide-react';

export function ProtocolStatsBar() {
  const stats = [
    {
      label: 'TOTAL COLLATERAL SUPPLIED',
      value: '$42,850,200',
      change: '+14.2% 7D',
      icon: Lock,
    },
    {
      label: 'TOTAL BORROWED DEBT',
      value: '$18,400,850',
      change: '+9.8% 7D',
      icon: DollarSign,
    },
    {
      label: 'STABLECOIN SUPPLY APY',
      value: '8.45%',
      change: 'NET YIELD',
      icon: TrendingUp,
      highlight: true,
    },
    {
      label: 'AUTO-PROTECTED VALUE',
      value: '$1,240,000+',
      change: '100% PREVENTED',
      icon: ShieldCheck,
      highlight: true,
    },
  ];

  return (
    <div className="w-full bg-page border border-ink/10 rounded-sm p-4 sm:p-6 font-mono uppercase">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divider-x">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="fx-card space-y-1.5 p-2 sm:p-3 bg-page/60 border border-ink/5 rounded-sm hover:border-fg-3/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-muted tracking-wider block">
                  {stat.label}
                </span>
                <Icon className={`w-3.5 h-3.5 ${stat.highlight ? 'text-fg-3' : 'text-muted'}`} />
              </div>

              <div className="text-xl sm:text-2xl font-bold text-ink tracking-tight tabular-nums">
                {stat.value}
              </div>

              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-fg-3 animate-pulse" />
                <span className={stat.highlight ? 'text-fg-3 font-bold' : 'text-muted'}>
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
