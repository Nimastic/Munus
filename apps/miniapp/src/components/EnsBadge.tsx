"use client";

import Image from "next/image";
import { type Address } from "viem";
import { useEnsAvatar, useEnsName } from "wagmi";

interface EnsBadgeProps {
  address: Address;
  showAvatar?: boolean;
  showAddress?: boolean;
}

/**
 * Display ENS name and avatar for an address
 * Falls back to truncated address if no ENS name
 * 
 * Note: ENS resolution always reads from Ethereum L1 (chainId: 1)
 */
export function EnsBadge({ address, showAvatar = true, showAddress = true }: EnsBadgeProps) {
  const { data: ensName } = useEnsName({
    address,
    chainId: 1, // Always query mainnet for ENS
  });

  const { data: avatar } = useEnsAvatar({
    name: ensName,
    chainId: 1,
  });

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const displayName = ensName || shortAddress;

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
    </span>
  );
}

