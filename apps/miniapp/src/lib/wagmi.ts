import { createConfig, http } from "wagmi";
import { base, baseSepolia, mainnet } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";

// IMPORTANT: Users connect their own wallets
// Civic Auth is still used for SSO/identity (separate from wallet connection)

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia, mainnet], // mainnet needed for ENS lookups
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC || "https://mainnet.base.org"),
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org"
    ),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC || "https://eth.llamarpc.com"),
  },
  connectors: [
    injected({ shimDisconnect: true }), // MetaMask, Coinbase Wallet, etc.
    coinbaseWallet({
      appName: "Munus",
      appLogoUrl: "https://munus.vercel.app/logo.png",
    }),
  ],
});

