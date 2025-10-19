# Setup Guide

Complete setup instructions for running Munus locally and deploying to production.

---

## Prerequisites

Ensure you have these installed:

- **Node.js** 18+ ([download](https://nodejs.org))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Git** ([download](https://git-scm.com))
- **MetaMask** or **Coinbase Wallet** browser extension

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/YourUsername/Munus.git
cd Munus
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all packages in the monorepo.

### 3. Configure Environment Variables

#### **Miniapp Configuration**

Create `apps/miniapp/.env.local`:

```env
# Civic Auth
NEXT_PUBLIC_CIVIC_CLIENT_ID=your_civic_client_id

# Blockchain
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_ESCROW_ADDRESS=0x
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_MAINNET_RPC=https://eth.llamarpc.com
```

**Get Civic Client ID:**
1. Go to https://auth.civic.com/dashboard
2. Create new application
3. Add allowed domain: `http://localhost:3000`
4. Copy Client ID

#### **Agent Configuration**

Create `packages/agent/.env`:

```env
# XMTP Agent
XMTP_WALLET_KEY=0x...your_private_key...
XMTP_DB_ENCRYPTION_KEY=random_string_here
XMTP_ENV=dev
```

**Generate Agent Key:**
```bash
openssl rand -hex 32
```

#### **Contracts Configuration**

Create `packages/contracts/.env`:

```env
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

---

### 4. Test Smart Contracts

```bash
cd packages/contracts
pnpm install
pnpm test
```

**Expected output:**
```
✔ should create, accept, deliver, and release job
✔ should allow refund if not delivered by deadline
✔ should prevent unauthorized actions
...
7 passing (819ms)
```

---

### 5. Deploy Contracts (Optional for Local Testing)

```bash
cd packages/contracts
pnpm compile
pnpm hardhat run scripts/deploy.ts --network baseSepolia
```

Copy the deployed address and update `apps/miniapp/.env.local`:
```env
NEXT_PUBLIC_ESCROW_ADDRESS=0x...deployed_address...
```

---

### 6. Run Development Servers

#### **Terminal 1: Miniapp**

```bash
cd apps/miniapp
pnpm dev
```

Open: http://localhost:3000

#### **Terminal 2: Agent** (optional)

```bash
cd packages/agent
pnpm dev
```

Test at: https://xmtp.chat

---

## Wallet Setup

### 1. Install MetaMask

Download from: https://metamask.io

### 2. Add Base Sepolia Network

**Manual Setup:**
- Network Name: `Base Sepolia`
- RPC URL: `https://sepolia.base.org`
- Chain ID: `84532`
- Currency Symbol: `ETH`
- Block Explorer: `https://sepolia.basescan.org`

**Or use Chainlist:**
1. Go to https://chainlist.org
2. Search "Base Sepolia"
3. Click "Add to MetaMask"

### 3. Get Test ETH

**Option 1: Alchemy Faucet**
https://www.alchemy.com/faucets/base-sepolia

**Option 2: Bridge from Sepolia**
1. Get Sepolia ETH: https://sepoliafaucet.com
2. Bridge: https://bridge.base.org

---

## First Test

### 1. Login Flow

1. Open http://localhost:3000
2. Click "Login with Civic"
3. Choose Google/Email
4. Should redirect back, logged in ✅

### 2. Connect Wallet

1. Click "Connect Wallet"
2. Approve in MetaMask
3. Switch to Base Sepolia if prompted
4. Should see your address ✅

### 3. Create Job

1. Click "Create Job"
2. Enter:
   - Amount: `0.001` ETH
   - Deadline: `1` hour
   - Description: "Test job"
3. Click "Create Job"
4. Approve transaction in MetaMask
5. Wait ~2 seconds for confirmation
6. Redirects to jobs list ✅

### 4. View Job

1. Click "Browse Jobs"
2. See your created job
3. Click on it to view details
4. Should show status: "Open" ✅

---

## Production Deployment

### 1. Deploy Contracts to Base Mainnet

```bash
cd packages/contracts

# Create .env with your REAL private key (with real ETH)
echo "PRIVATE_KEY=0x..." > .env
echo "BASE_MAINNET_RPC_URL=https://mainnet.base.org" >> .env

# Deploy
pnpm hardhat run scripts/deploy.ts --network base

# Save the deployed address!
```

### 2. Deploy Miniapp to Vercel

```bash
cd apps/miniapp

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Environment Variables in Vercel Dashboard:**
```
NEXT_PUBLIC_CIVIC_CLIENT_ID=your_civic_id
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_ESCROW_ADDRESS=0x...mainnet_address...
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
NEXT_PUBLIC_MAINNET_RPC=your_mainnet_rpc
```

**Update Civic Dashboard:**
- Add production domain to allowed domains
- Example: `https://munus.vercel.app`

### 3. Deploy Agent to Railway

```bash
cd packages/agent

# Install Railway CLI
npm install -g railway

# Login
railway login

# Create project
railway init

# Deploy
railway up
```

**Environment Variables in Railway:**
```
XMTP_WALLET_KEY=0x...agent_key...
XMTP_DB_ENCRYPTION_KEY=random_string
XMTP_ENV=production
```

---

## Verification

### Verify Contract on BaseScan

```bash
cd packages/contracts

pnpm hardhat verify --network baseSepolia DEPLOYED_ADDRESS \
  "constructor_arg_1" "constructor_arg_2"
```

### Test Production Miniapp

1. Visit your Vercel URL
2. Complete full job flow
3. Check transactions on BaseScan
4. Verify funds move correctly

---

## Troubleshooting

### Issue: "Module not found" errors

**Solution:**
```bash
# Clear node modules and reinstall
rm -rf node_modules
pnpm install
```

### Issue: Transaction fails with "insufficient funds"

**Solution:**
- Check you have enough ETH for gas
- Check you're on correct network
- Try increasing gas limit

### Issue: Civic login redirects to error

**Solution:**
- Verify Client ID is correct
- Check domain is added in Civic dashboard
- Clear browser cache and try again

### Issue: Contract call reverts

**Solution:**
- Check job state is correct
- Verify you're authorized for action
- Check deadline hasn't passed

### Issue: Agent doesn't respond

**Solution:**
- Check agent is running
- Verify XMTP_WALLET_KEY is set
- Check agent wallet has some ETH
- Look for errors in logs

---

## Development Tips

### Hot Reload

All packages support hot reload:
- Frontend: Edit files in `apps/miniapp/src/*`
- Contracts: Run `pnpm watch` in contracts folder
- Agent: Changes reload automatically

### Debugging

**Frontend:**
- Open DevTools (F12)
- Check Console for errors
- Use React DevTools extension

**Contracts:**
- Use `console.log` in Hardhat tests
- Run tests with `pnpm test --verbose`
- Use Hardhat Network for debugging

**Agent:**
- Set `LOG_LEVEL=debug` in `.env`
- Check logs in terminal
- Test on xmtp.chat first

### Reset Local State

```bash
# Clear Hardhat cache
cd packages/contracts
pnpm clean

# Clear Next.js cache
cd apps/miniapp
rm -rf .next

# Clear agent database
cd packages/agent
rm -rf db
```

---

## Next Steps

1. ✅ Local setup complete
2. ✅ Test full flow locally
3. → Deploy contracts to testnet
4. → Deploy miniapp to Vercel
5. → Test in production
6. → Deploy agent
7. → Run end-to-end tests
8. → Deploy to mainnet

---

## Resources

- **Base Docs:** https://docs.base.org
- **XMTP Docs:** https://xmtp.org/docs
- **Civic Docs:** https://docs.civic.com
- **Wagmi Docs:** https://wagmi.sh
- **Next.js Docs:** https://nextjs.org/docs

---

**Need help?** Open an issue or check [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)

