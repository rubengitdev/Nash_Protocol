'use client';

import React from 'react';
import { useNetworkMode } from '../../hooks/useNetworkMode';

/** The leverage cap of this deployment: mainnet markets launch capped at 1.5x, testnet runs the full 2.5x range. */
export function MaxLeverage() {
  const { isTestnet } = useNetworkMode();
  return <>{isTestnet ? '2.5×' : '1.5×'}</>;
}

/** What is open on this deployment right now. The sentences are the ones the FAQ already gives. */
export function NetworkStatus() {
  const { isTestnet } = useNetworkMode();
  return (
    <p>
      {isTestnet
        ? 'Lending and Long/Short are available market by market once a market’s price feed, liquidity and launch checks pass. Earn and Auto-Protect open as each is verified. Markets that are not open yet are shown as paused.'
        : 'Lending and Long/Short are live on Robinhood Chain mainnet for TSLA, AMZN, PLTR and AMD, with more markets, Earn vaults and Auto-Protect on the Nash roadmap. Nash Protocol is actively maintained and shipping.'}
    </p>
  );
}
