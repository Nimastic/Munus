# Munus — Deployment Guide

Step-by-step instructions to deploy Munus to production.

---

## Prerequisites

- Node.js 18+ and pnpm
- Wallet with Base Sepolia ETH ([faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet))
- Vercel account (free)
- Railway/Render account (for agent, free tier OK)
- Civic Auth client ID ([dashboard](https://auth.civic.com/dashboard))

---

## 1. Smart Contracts (Base Sepolia)

### Install Dependencies

```bash
cd packages/contracts
pnpm install
```

### Configure Environment

Create `.env` in project root:

```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your-api-key-optional
```

> ⚠️ **Security**: Never commit `.env` to git! Use a fresh wallet for testnet.

### Run Tests

```bash
pnpm test
```

Expected output:
```
  Escrow
    ETH Job Flow
      ✔ should create, accept, deliver, and release ETH job
      ✔ should allow refund if not delivered by deadline
    Edge Cases
      ✔ should reject zero amount
      ✔ should reject past deadline
      ...
  
  12 passing (2s)
```

### Deploy

```bash
pnpm deploy
```

Expected output:
```
Deploying Escrow contract...
✅ Escrow deployed to: 0xABC123...

Add this to your .env:
NEXT_PUBLIC_ESCROW_ADDRESS=0xABC123...
```

**Save the address!** You'll need it for the miniapp.

### Verify Contract (Optional)

```bash
npx hardhat verify --network baseSepolia 0xABC123...
```

---

## 2. XMTP Agent

### Generate Agent Wallet

```bash
# Using cast (Foundry)
cast wallet new

# Or OpenSSL
openssl rand -hex 32
```

Save the private key for the `.env` file.

### Configure Environment

Create `packages/agent/.env`:

```env
XMTP_ENV=production  # Use 'dev' for testing on xmtp.chat
XMTP_WALLET_KEY=0x... # Agent's private key (NOT your personal wallet!)
XMTP_DB_ENCRYPTION_KEY=your-random-encryption-key
RPC_BASE_SEPOLIA=https://sepolia.base.org
ESCROW_ADDRESS=0xABC123... # From step 1
```

### Test Locally

```bash
cd packages/agent
pnpm install
pnpm dev
```

Should see:
```
🚀 Starting Munus XMTP Agent...
✅ Munus agent online!
📍 Environment: dev
🧪 Test URL: https://dev.xmtp.chat/dm/0xAGENT_ADDRESS
```

Test by:
1. Open the test URL in browser
2. Connect your wallet
3. Send: `@munus /help`
4. Agent should respond

### Deploy to Railway

1. Push code to GitHub
2. Create new project on [Railway](https://railway.app)
3. Connect GitHub repo
4. Set root directory: `packages/agent`
5. Add environment variables (from `.env`)
6. Set start command: `pnpm install && pnpm start`
7. Deploy!

**Alternative: Render**

Create `render.yaml`:
```yaml
services:
  - type: web
    name: munus-agent
    env: node
    buildCommand: cd packages/agent && pnpm install
    startCommand: cd packages/agent && pnpm start
    envVars:
      - key: XMTP_ENV
        value: production
      - key: XMTP_WALLET_KEY
        sync: false
      - key: XMTP_DB_ENCRYPTION_KEY
        generateValue: true
      - key: ESCROW_ADDRESS
        sync: false
```

---

## 3. Next.js Miniapp (Vercel)

### Configure Environment

Create `apps/miniapp/.env.local`:

```env
# Civic Auth (REQUIRED)
NEXT_PUBLIC_CIVIC_CLIENT_ID=your-civic-client-id

# Chain
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org

# Contracts
NEXT_PUBLIC_ESCROW_ADDRESS=0xABC123... # From step 1
NEXT_PUBLIC_DEFAULT_USDC=0x036CbD53842c5426634e7929541eC2318f3dCF7e # Base Sepolia USDC

# ENS (for name lookups)
NEXT_PUBLIC_MAINNET_RPC=https://eth.llamarpc.com
```

### Get Civic Client ID

1. Go to https://auth.civic.com/dashboard
2. Create new application
3. Set application name: "Munus"
4. Add allowed domains (will add Vercel URL later)
5. Copy Client ID

### Test Locally

```bash
cd apps/miniapp
pnpm install
pnpm dev
```

Open http://localhost:3000

Test flow:
1. Click "Login with Civic"
2. Wallet auto-creates
3. Browse jobs
4. Create a test job

### Deploy to Vercel

**Option A: Vercel CLI**

```bash
pnpm i -g vercel
cd apps/miniapp
vercel
```

Follow prompts, then:
```bash
vercel --prod
```

**Option B: Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Set root directory: `apps/miniapp`
4. Add environment variables (from `.env.local`)
5. Deploy!

### Post-Deployment

1. Copy Vercel URL (e.g., `munus.vercel.app`)
2. Add to Civic dashboard:
   - Allowed domains: `munus.vercel.app`
   - Redirect URIs: `https://munus.vercel.app`
3. Test login flow on production URL

---

## 4. Calimero Workflows (Optional)

For demo purposes, you can simulate Calimero outputs:

```bash
cd workflows/calimero
./demo-simulate.sh
```

This creates:
- `outputs.json` - Mock job results
- `attestation.json` - Mock Ed25519 attestation

For full Calimero setup:

### Install Merobox

```bash
pipx install merobox
```

### Run Workflow

```bash
merobox bootstrap validate workflow.yml
merobox bootstrap run workflow.yml \
  -v JOB_ID=0 \
  -v RESOURCE_CID=QmExample \
  -v TASK_TYPE=parse_invoice \
  -v WORKER_ADDRESS=0x...
```

### Pin Attestation to IPFS

```bash
# Using web3.storage
npm i -g @web3-storage/w3cli
w3 login
w3 put attestation.json
# Returns: bafybei...
```

Use the CID when delivering jobs in the miniapp.

---

## 5. Final Checks

### Contract

- [x] Deployed to Base Sepolia
- [x] Address saved in all `.env` files
- [x] Verified on Basescan (optional)
- [x] Has testnet ETH for gas

### Agent

- [x] Running on Railway/Render
- [x] Accessible via XMTP
- [x] Responds to mentions
- [x] Uses `production` environment

### Miniapp

- [x] Deployed to Vercel
- [x] Civic login works
- [x] Contract interactions work
- [x] ENS names display
- [x] Public URL accessible

### Civic

- [x] Application created
- [x] Vercel URL added to allowed domains
- [x] Client ID in miniapp `.env`

---

## 6. Usage Flow

### For Demo/Judges

1. **Open Base App** (or xmtp.chat in dev)
2. **DM or add agent** to group: `0xAGENT_ADDRESS`
3. **Mention agent**: `@munus /help`
4. **Agent responds** with commands
5. **Request job card**: `@munus /job 0`
6. **Tap "Open Miniapp"** button
7. **Miniapp opens**, login with Civic
8. **Browse/create/accept jobs**

### For Real Users

1. **Share miniapp link** in group chat
2. **Create jobs** via miniapp
3. **Mention agent** with job ID
4. **Team members accept** via chat or miniapp
5. **Submit deliverables** (optionally with Calimero attestation)
6. **Creator approves** → payment releases

---

## 7. Monitoring

### Contract Activity

View on [Base Sepolia Explorer](https://sepolia.basescan.org/):
```
https://sepolia.basescan.org/address/0xYOUR_ESCROW_ADDRESS
```

### Agent Logs

**Railway:**
- Dashboard → Your project → View logs

**Render:**
- Dashboard → Service → Logs

**Local:**
```bash
pnpm dev # Watch console
```

### Miniapp Analytics

Vercel Dashboard → Your project → Analytics

---

## 8. Troubleshooting

### "Civic login doesn't work"

- Check Client ID is correct
- Check Vercel URL is in Civic allowed domains
- Check browser console for errors
- Try incognito mode (clear cookies)

### "Contract transactions fail"

- Check wallet has Base Sepolia ETH
- Check contract address is correct
- Check RPC URL is accessible
- Check `NEXT_PUBLIC_CHAIN_ID=84532`

### "Agent not responding"

- Check agent is running (Railway/Render dashboard)
- Check agent wallet address is correct
- Check you're @mentioning the agent
- Check environment (`dev` vs `production`)
- Check agent logs for errors

### "ENS names don't show"

- Check `NEXT_PUBLIC_MAINNET_RPC` is set
- ENS lookups require mainnet RPC (even on L2)
- May take a few seconds to load

---

## 9. Costs

**Base Sepolia (Testnet):**
- Free! Just need testnet ETH from faucet

**Vercel:**
- Free tier: 100GB bandwidth/month
- Hobby plan: $20/month for custom domain

**Railway/Render:**
- Free tier: $5 credit/month
- Starter: $5-10/month for 24/7 uptime

**Civic:**
- Free for hackathons
- Production pricing TBD

**Total:** $0-30/month depending on usage

---

## 10. Production Considerations

For a real launch, consider:

1. **Smart Contracts:**
   - Full audit
   - Deploy to Base Mainnet
   - Add dispute mechanism
   - Fee structure

2. **Agent:**
   - Rate limiting
   - Spam detection
   - Multi-language support
   - Analytics

3. **Miniapp:**
   - Custom domain
   - Analytics (PostHog/Mixpanel)
   - Error tracking (Sentry)
   - CDN for assets

4. **Security:**
   - Bug bounty
   - Penetration testing
   - Secret management (Vercel/Railway secrets)
   - Key rotation

---

## 11. Support

- **Civic:** [Slack](https://join.slack.com/t/civic-developers/shared_invite/...)
- **XMTP:** [Discord](https://discord.gg/xmtp)
- **Base:** [Docs](https://docs.base.org)
- **Calimero:** [GitHub](https://github.com/calimero-network)

---

**Ready to ship?** 🚀

Follow this guide top-to-bottom, and you'll have Munus live in <1 hour.

**Built for ETHRome 2025** 🇮🇹

