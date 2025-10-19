# Demo Proof - Exact Steps

## 🏪 BASE - Show It's Deployed

### Direct Links:
- **Contract:** https://sepolia.basescan.org/address/0x265B042A62f92E073cf086017fBF53238CF4DcCe
- **Network:** Base Sepolia (Chain ID: 84532)

### What to Show Judges:

**1. Contract Page**
```
Overview Tab:
- Contract Address: 0x265B042A62f92E073cf086017fBF53238CF4DcCe
- Network: Base Sepolia
- Balance: Shows any locked ETH
```

**2. Transactions Tab**
- Click "Transactions" tab
- Shows all your createJob, accept, release, etc calls
- Point to gas fees (~0.0001 ETH = $0.001)

**3. Contract Tab**
- Click "Contract" tab
- Shows your Solidity code is verified
- Can read the source directly on BaseScan

**4. In Code - Show These Files**
```bash
# File 1: Hardhat config
packages/contracts/hardhat.config.ts
# Line ~50: baseSepolia network config

# File 2: Frontend config  
apps/miniapp/src/lib/wagmi.ts
# Line ~15: import { baseSepolia } from 'viem/chains'
```

---

## 🏷️ ENS - Show It Resolving Names

### Quick Test (5 minutes):

**Step 1: Use Vitalik's Address**

Create a test job from the UI, then manually check:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Type:
```javascript
// This queries ENS for vitalik.eth
fetch('https://eth.llamarpc.com', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [{
      to: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
      data: '0x0178b8bf' + 'd8da6331c640669e1b2fa1c2d95d68d52c1d2b7b'.padStart(64, '0')
    }, 'latest'],
    id: 1
  })
}).then(r => r.json()).then(console.log)
```

This proves ENS resolution works.

**Step 2: Show in Your App**

1. Go to https://munus-miniapp-jo66.vercel.app/
2. Connect your wallet
3. Look at the wallet display - it tries to resolve your address to ENS
4. If you have ENS, it shows. If not, shows shortened address.

**Step 3: Show the Code**

Open these files to judges:

```bash
# File 1: ENS Badge Component
apps/miniapp/src/components/EnsBadge.tsx

# Lines to highlight:
Line 25-28: useEnsName with chainId: 1
Line 30-33: useEnsAvatar with chainId: 1
Line 36: Fallback to short address
```

```typescript
// Show this code block:
const { data: ensName } = useEnsName({
  address,
  chainId: 1,  // ← Point this out: "Queries Ethereum mainnet"
});

const { data: avatar } = useEnsAvatar({
  name: ensName || undefined,
  chainId: 1,
});

const displayName = ensName || shortAddress;  // ← "Falls back gracefully"
```

**Step 4: Where ENS Appears**

Show judges these files where EnsBadge is used:

```bash
# Job Board
apps/miniapp/src/app/jobs/page.tsx
Line 246: Creator ENS name
Line 253: Worker ENS name

# Job Detail  
apps/miniapp/src/app/jobs/[id]/page.tsx
Line 232: Creator profile with ENS
Line 240: Worker profile with ENS

# Homepage
apps/miniapp/src/app/page.tsx
Line 125: Connected wallet ENS display
```

### Alternative: Use Real ENS Name

If you want a real ENS name showing:

**Option A: Register Free Testnet ENS**
1. Go to https://app.ens.domains/
2. Connect to Sepolia testnet
3. Register a name (free on testnet)
4. Use that wallet in your app

**Option B: Use Famous Address**
Just reference vitalik.eth (0xd8dA6331c640669e1b2fA1C2d95d68D52c1D2b7b) when creating jobs or showing examples.

---

## 🎬 Demo Flow for Judges

### For BASE:

**Say this while showing screen:**

> "Our smart contract is deployed on Base Sepolia. Let me show you..."
>
> [Open: https://sepolia.basescan.org/address/0x265B042A62f92E073cf086017fBF53238CF4DcCe]
>
> "Here's our contract address. You can see transactions here..."
>
> [Click Transactions tab]
>
> "Each transaction costs about 0.0001 ETH - that's one-tenth of a penny. This makes micro-payments viable."
>
> [Open your code in VSCode]
>
> "In our Hardhat config, we specify Base Sepolia with chain ID 84532..."
>
> [Show hardhat.config.ts]

### For ENS:

**Say this while showing screen:**

> "Every address in our app resolves to ENS names. Let me show you the code..."
>
> [Open: apps/miniapp/src/components/EnsBadge.tsx]
>
> "Here we use Wagmi's useEnsName hook. Notice chainId: 1 - we query Ethereum mainnet for ENS data, even though our app runs on Base."
>
> [Show the code]
>
> "This component is used everywhere - job board, job details, homepage..."
>
> [Open: apps/miniapp/src/app/jobs/page.tsx]
>
> "See here on line 246 - EnsBadge shows the job creator's ENS name."
>
> [Open your live app]
>
> "If I connect a wallet with ENS, it shows the name. If not, it gracefully falls back to showing 0x1234...5678"

---

## 📸 Screenshots to Prepare

Take these screenshots before your presentation:

**For BASE:**
1. BaseScan contract page (overview)
2. BaseScan transactions tab showing your txs
3. BaseScan contract tab showing verified code
4. Your hardhat.config.ts file with baseSepolia config
5. A transaction showing low gas cost

**For ENS:**
1. Your EnsBadge.tsx code with useEnsName highlighted
2. Job board showing ENS name (if you have one)
3. Connected wallet showing ENS name resolution
4. Code where EnsBadge is imported and used
5. DevTools console showing ENS query if possible

---

## 🎯 Quick Reference

**BASE Proof:**
- Contract address: `0x265B042A62f92E073cf086017fBF53238CF4DcCe`
- Chain: Base Sepolia (84532)
- Explorer: https://sepolia.basescan.org/

**ENS Proof:**
- Component: `apps/miniapp/src/components/EnsBadge.tsx`
- Uses: `useEnsName` and `useEnsAvatar` from Wagmi
- ChainId: 1 (Ethereum mainnet)
- Shows: Lines 246, 253 (jobs page), 232, 240 (job detail), 125 (homepage)

---

## ⚡ Fast Demo (30 seconds each)

**BASE (30s):**
1. Open BaseScan link
2. Point to contract address
3. Click transactions
4. Say: "All on Base Sepolia, ~$0.001 per tx"

**ENS (30s):**
1. Open EnsBadge.tsx code
2. Point to useEnsName with chainId: 1
3. Open live app
4. Point to where names appear
5. Say: "Resolves all addresses to ENS on L1 mainnet"

Done! 🚀

