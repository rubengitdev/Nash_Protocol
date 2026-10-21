'use client';

import React, { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { env } from '../../env.mjs';
import { buildContractDirectory, explorerAddressUrl, type ContractEntry } from '../../lib/contract-directory';

function ContractRow({ contract }: { contract: ContractEntry }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contract.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the address is on screen and selectable */
    }
  };

  return (
    <li className="contract-row">
      <div className="contract-id">
        <span className="contract-name">{contract.name}</span>
        <code className="contract-address">{contract.address}</code>
      </div>
      <div className="contract-actions">
        <button
          type="button"
          className="ca-chip contract-copy"
          onClick={copy}
          aria-label={`Copy ${contract.name} address`}
          title={copied ? 'Copied' : 'Copy address'}
        >
          {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
        </button>
        <a
          className="ca-chip contract-link"
          href={explorerAddressUrl(contract.address)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${contract.name} on Blockscout`}
        >
          Blockscout
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      </div>
    </li>
  );
}

/**
 * Smart contracts: every contract the app uses on this build's network, each with a copy button and a link to its
 * Blockscout page, so anyone can check the code and activity before they deposit.
 */
export function LandingContracts() {
  const groups = useMemo(() => buildContractDirectory(), []);
  const total = groups.reduce((sum, group) => sum + group.contracts.length, 0);
  if (total === 0) return null;
  const explorer = env.EXPLORER_URL.replace(/\/$/, '');

  return (
    <section id="contracts" className="landing-section" aria-labelledby="contracts-title">
      <div className="contracts-head">
        <div className="flex flex-col gap-4 max-w-[680px]">
          <h2 id="contracts-title" className="landing-h2">
            Smart contracts
          </h2>
          <p className="landing-body">
            All {total} contracts Nash Protocol uses on {env.CHAIN_NAME} (chain ID {env.CHAIN_ID}). Open any address on
            Blockscout to check its code, transactions and balances for yourself.
          </p>
        </div>
        <a className="ca-chip contract-link" href={explorer} target="_blank" rel="noopener noreferrer">
          Open Blockscout
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      </div>

      <div className="contracts-grid">
        {groups.map((group) => (
          <section key={group.id} className="contract-group" aria-labelledby={`contracts-${group.id}`}>
            <header className="contract-group-head">
              <h3 id={`contracts-${group.id}`} className="contract-group-title">
                {group.title}
              </h3>
              <span className="contract-group-count">
                {String(group.contracts.length).padStart(2, '0')}
              </span>
            </header>
            <p className="landing-body contract-group-note">{group.note}</p>
            <ul className="contract-list">
              {group.contracts.map((contract) => (
                <ContractRow key={contract.address} contract={contract} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
