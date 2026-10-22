'use client';

import React from 'react';
import { env } from '../../env.mjs';
import { ContractGroupCard, useContractDirectory } from '../ContractDirectory';
import { LandingButton } from './LandingButton';

/**
 * Smart contracts: the core protocol contracts on this build's network, each with a copy button and a link to its
 * Blockscout page. View all opens /contracts, which lists every contract the app uses, market by market.
 */
export function LandingContracts() {
  const { groups, total } = useContractDirectory();
  const core = groups.find((group) => group.id === 'core');
  if (!core) return null;

  return (
    <section id="contracts" className="landing-section" aria-labelledby="contracts-title">
      <div className="contracts-head">
        <div className="flex flex-col gap-4 max-w-[680px]">
          <h2 id="contracts-title" className="landing-h2">
            Smart contracts
          </h2>
          <p className="landing-body">
            The core contracts behind every Nash Protocol market on {env.CHAIN_NAME} (chain ID {env.CHAIN_ID}). Open any
            address on Blockscout to check its code, transactions and balances for yourself.
          </p>
        </div>
        <LandingButton href="/contracts" variant="outline">
          {`View all ${total} contracts`}
        </LandingButton>
      </div>

      <div className="contracts-grid">
        <ContractGroupCard group={core} />
      </div>
    </section>
  );
}
