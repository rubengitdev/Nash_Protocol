'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import type { NetworkMode } from '@nash/types';
import { useNetworkMode } from '../hooks/useNetworkMode';
import { networkSwitchHref } from '../lib/network-switch';

const OPTIONS: Array<{ mode: NetworkMode; label: string; name: string }> = [
  { mode: 'MAINNET', label: 'Mainnet', name: 'Robinhood Chain Mainnet' },
  { mode: 'TESTNET', label: 'Testnet', name: 'Robinhood Chain Testnet' },
];

/**
 * Network switch. The network is fixed when the app is built (NETWORK_MODE), so the active side is a status label and
 * the other side opens the same page on the other deployment (www for mainnet, testnet. for testnet).
 */
export function NetworkBadge({ className = '' }: { className?: string }) {
  const { networkMode } = useNetworkMode();
  const pathname = usePathname() || '/';
  return (
    <div className={`net-switch ${className}`} role="group" aria-label="Network">
      {OPTIONS.map(({ mode, label, name }) => {
        const dot = <span className="net-badge-dot" aria-hidden="true" />;
        if (mode === networkMode) {
          return (
            <span key={mode} className="net-switch-option" data-active="true" data-network={mode.toLowerCase()} aria-current="true" title={`${name}. You are on this network.`}>
              {dot}
              {label}
            </span>
          );
        }
        return (
          <a
            key={mode}
            className="net-switch-option"
            data-network={mode.toLowerCase()}
            data-nav-item=""
            href={networkSwitchHref(mode, pathname)}
            title={`Switch to ${name}`}
            aria-label={`Switch to ${name}`}
          >
            {dot}
            {label}
          </a>
        );
      })}
    </div>
  );
}
