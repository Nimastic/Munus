# Civic Embedded Wallet Setup Guide

This miniapp uses **Civic's Embedded Wallet** feature, which automatically provides users with a non-custodial Web3 wallet when they log in.

## What is Civic Embedded Wallet?

- **Non-custodial**: Neither Civic nor your app has access to users' private keys
- **Automatic**: Wallets are created automatically when users log in with Civic
- **No seed phrases**: Users don't need to remember or manage seed phrases
- **Multi-chain support**: Works with 18+ EVM chains including Ethereum, Base, Polygon, Arbitrum, and more
- **SSO-linked**: Each wallet is linked to the user's SSO provider (Google, etc.)

## Setup Steps

### 1. Get Your Civic Client ID

1. Go to [auth.civic.com](https://auth.civic.com)
2. Sign up or log in
3. Create a new project or select an existing one
4. **IMPORTANT**: Enable the "Web3 wallet" option in your project settings
5. Copy your Client ID

### 2. Configure Environment Variables

Create a `.env.local` file in the `apps/miniapp` directory:

```bash
NEXT_PUBLIC_CIVIC_CLIENT_ID=your_civic_client_id_here
```

You can also copy from `.env.example`:

```bash
cp .env.example .env.local
```

### 3. Run the Application

```bash
pnpm install
pnpm dev
```

Visit `http://localhost:3000` and log in with Civic. An embedded wallet will be created for you automatically!

## How It Works

1. **User logs in** with Civic (Google, etc.)
2. **Civic creates a wallet** automatically (non-custodial, EOA wallet)
3. **User can transact** immediately without connecting MetaMask or any external wallet
4. **Wallet persists** across sessions, linked to the user's SSO account

## Code Implementation

### Provider Setup (`src/app/providers.tsx`)

```tsx
import { CivicAuthProvider } from "@civic/auth-web3/react";
import { base, baseSepolia } from "viem/chains";

<CivicAuthProvider 
  clientId={civicClientId}
  chain={baseSepolia} // Default chain
  chains={[base, baseSepolia]} // Supported chains
>
  {children}
</CivicAuthProvider>
```

### Using the Wallet in Components

```tsx
import { useWallet, useUser } from "@civic/auth-web3/react";

function MyComponent() {
  const { user } = useUser();
  const wallet = useWallet();
  
  // Get wallet address
  const address = wallet?.address;
  
  // Send a transaction
  const hash = await wallet.sendTransaction({
    to: "0x...",
    data: wallet.encodeFunctionData({
      abi: myAbi,
      functionName: "myFunction",
      args: [arg1, arg2],
    }),
    value: parseEther("0.01"),
  });
}
```

## Benefits

✅ **Better UX**: Users don't need to install MetaMask or manage seed phrases
✅ **Faster onboarding**: One-click login with Google, instant wallet
✅ **Secure**: Non-custodial, only user has access to private keys
✅ **Multi-chain**: Works across 18+ EVM chains
✅ **Recovery**: Built-in recovery features in case of service interruption

## Resources

- [Civic Auth Docs](https://docs.civic.com/auth)
- [Embedded Wallets Guide](https://docs.civic.com/auth/web3/embedded-wallets)
- [Civic Dashboard](https://auth.civic.com/dashboard)
- [Developer Community](https://discord.gg/civic)

## Troubleshooting

### "Web3 wallet option not enabled"

Make sure you've enabled the "Web3 wallet" option in your Civic dashboard project settings.

### "wallet is undefined"

The wallet is only available after the user logs in. Check that `user` is not null before accessing `wallet`.

### "Transaction failed"

Ensure you're on the correct network (Base Sepolia for testnet). The embedded wallet will automatically switch to the configured chain.

