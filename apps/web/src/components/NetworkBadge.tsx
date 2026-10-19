'use client';

import React from 'react';
import { useNetworkMode } from '../hooks/useNetworkMode';

/**
 * Shows which network this deployment talks to. The network is fixed when the app is built (NETWORK_MODE), so this
 * is a status label and not a switch: reaching the other network means opening the other deployment.
 */
export function NetworkBadge({ className = '' }: { className?: string }) {
  const { isTestnet } = useNetworkMode();
  const label = isTestnet ? 'Robinhood Chain Testnet' : 'Robinhood Chain Mainnet';
  return (
    <span
      className={`net-badge ${className}`}
      data-network={isTestnet ? 'testnet' : 'mainnet'}
      role="status"
      data-nav-item=""
      title={`${label}. The network is set by the deployment you are on.`}
    >
      <span className="net-badge-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
