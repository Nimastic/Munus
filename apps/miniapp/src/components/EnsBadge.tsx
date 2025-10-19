"use client";

import { Check, Copy } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { type Address, createPublicClient, http } from "viem";
import { base, mainnet } from "viem/chains";
import { normalize } from "viem/ens";

interface EnsBadgeProps {
  address: Address;
  showAvatar?: boolean;
  showAddress?: boolean;
  showCopy?: boolean;
}

// Public clients for ENS resolution
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

const baseClient = createPublicClient({
  chain: base,
  transport: http(),
});

/**
 * Display ENS/Basename for an address
 * Tries both Ethereum ENS and Base Basename
 * Falls back to truncated address if no name found
 */
export function EnsBadge({ address, showAvatar = true, showAddress = true, showCopy = true }: EnsBadgeProps) {
  const [copied, setCopied] = useState(false);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolveName() {
      try {
        // Try Base Basename first (jeriel.base.eth resolves on Base)
        try {
          const basename = await baseClient.getEnsName({ address });
          if (basename) {
            setEnsName(basename);
            // Try to get avatar from Base
            try {
              const baseAvatar = await baseClient.getEnsAvatar({ name: normalize(basename) });
              setAvatar(baseAvatar);
            } catch {}
            setLoading(false);
            return;
          }
        } catch {}

        // Fallback: Try Ethereum ENS
        try {
          const ethName = await mainnetClient.getEnsName({ address });
          if (ethName) {
            setEnsName(ethName);
            // Try to get avatar from Ethereum
            try {
              const ethAvatar = await mainnetClient.getEnsAvatar({ name: normalize(ethName) });
              setAvatar(ethAvatar);
            } catch {}
          }
        } catch {}
      } catch (error) {
        console.error("Error resolving ENS/Basename:", error);
      } finally {
        setLoading(false);
      }
    }

    resolveName();
  }, [address]);

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const displayName = loading ? shortAddress : (ensName || shortAddress);

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

