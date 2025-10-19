"use client";

import { Check, Copy } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { type Address } from "viem";
import { useEnsAvatar, useEnsName } from "wagmi";

interface EnsBadgeProps {
  address: Address;
  showAvatar?: boolean;
  showAddress?: boolean;
  showCopy?: boolean;
}

/**
 * Display ENS name and avatar for an address
 * Falls back to truncated address if no ENS name
 * 
 * Note: ENS resolution always reads from Ethereum L1 (chainId: 1)
 */
export function EnsBadge({ address, showAvatar = true, showAddress = true, showCopy = true }: EnsBadgeProps) {
  const [copied, setCopied] = useState(false);

  const { data: ensName } = useEnsName({
    address,
    chainId: 1, // Always query mainnet for ENS
  });

  const { data: avatar } = useEnsAvatar({
    name: ensName ?? undefined,
    chainId: 1,
  });

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const displayName = ensName || shortAddress;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className="inline-flex items-center gap-2">
      {showAvatar && avatar && (
        <Image
          src={avatar}
          alt={ensName || "avatar"}
          width={20}
          height={20}
          className="rounded-full"
        />
      )}
      <span className="font-medium">{displayName}</span>
      {showAddress && ensName && (
        <span className="text-xs text-muted-foreground">({shortAddress})</span>
      )}
      {showCopy && (
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title={copied ? "Copied!" : "Copy full address"}
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-600" />
          ) : (
            <Copy className="w-3 h-3 text-gray-400" />
          )}
        </button>
      )}
    </span>
  );
}

