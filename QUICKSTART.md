# Munus — Quick Start (5 Minutes)

Get Munus running locally in under 5 minutes!

---

## Step 1: Install Dependencies (1 min)

```bash
# Clone repo
git clone https://github.com/Nimastic/Munus
cd Munus

# Install everything
pnpm install
```

---

## Step 2: Set Up Environment (2 min)

Create `.env` in project root:

```bash
# Copy example
cp .env.example .env
```

Edit `.env` with **minimum required**:

```env
 got sepol
```

> **Note:** You can start without real keys! Contracts work on local Hardhat network.

---

## Step 3: Test Contracts (1 min)

```bash
cd packages/contracts
pnpm install
pnpm test
```

Expected output:
```
  Escrow
    ✔ should create, accept, deliver, and release ETH job (2s)
    ✔ should allow refund if not delivered by deadline
    ...
  12 passing
```

---

## Step 4: Run Miniapp (1 min)

```bash
cd apps/miniapp
pnpm install
pnpm dev
```

Open http://localhost:3000

You should see the Munus homepage! 🎉

> **Note:** Some features need deployed contracts. That's OK for now - the UI works!

---

## Step 5: Run Agent (Optional)

```bash
cd packages/agent
pnpm install
pnpm dev
```

Expected output:
```
✅ Munus agent online!
📍 Environment: dev
🧪 Test URL: https://dev.xmtp.chat/dm/0x...
```

Open the test URL to DM your agent!

---

## ✅ You're Ready!

### What You Have Running:

- ✅ **Smart contracts** - Tested and working
- ✅ **Miniapp** - Beautiful UI at localhost:3000
- ✅ **Agent** - Responding to messages (if you started it)

### Next Steps:

1. **Deploy contracts** to Base Sepolia
   ```bash
   cd packages/contracts
   pnpm deploy
   ```

2. **Get Civic Client ID**
   - Go to https://auth.civic.com/dashboard
   - Create application
   - Copy client ID to `.env`

3. **Try the full flow**
   - Login with Civic
   - Create a job
   - Accept it from another account
   - Deliver and release payment

---

## 🎯 Quick Test Scenarios

### Scenario 1: Local Contract Testing

```bash
# Terminal 1: Start local chain
cd packages/contracts
npx hardhat node

# Terminal 2: Run tests
npx hardhat test
```

### Scenario 2: Agent Only

```bash
# Start agent
cd packages/agent
pnpm dev

# Open xmtp.chat, DM your agent:
"@munus /help"
```

### Scenario 3: Full Stack (Local)

```bash
# Terminal 1: Local chain
cd packages/contracts && npx hardhat node

# Terminal 2: Deploy to local
npx hardhat run scripts/deploy.ts --network localhost
# Copy address to NEXT_PUBLIC_ESCROW_ADDRESS

# Terminal 3: Miniapp
cd apps/miniapp && pnpm dev

# Terminal 4: Agent
cd packages/agent && pnpm dev

# Now everything talks to each other!
```

---

## 🐛 Common Issues

### "pnpm: command not found"

```bash
npm install -g pnpm
```

### "Missing Civic client ID"

That's OK! You can still browse the UI. Login won't work until you get a client ID from https://auth.civic.com/dashboard

### "Agent won't connect"

- Check `XMTP_WALLET_KEY` is a valid private key
- Try `XMTP_ENV=dev` first (easier to test)
- Check logs for specific errors

### "Transactions fail in miniapp"

- Check contracts are deployed
- Check `NEXT_PUBLIC_ESCROW_ADDRESS` is set
- Check you have testnet ETH

---

## 📚 Learn More

- **Full README**: [`README.md`](./README.md)
- **Deployment Guide**: [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)
- **Bounty Compliance**: [`docs/BOUNTY_COMPLIANCE.md`](./docs/BOUNTY_COMPLIANCE.md)
- **Agent Docs**: [`packages/agent/README.md`](./packages/agent/README.md)

---

## 🆘 Get Help

- Open an issue on GitHub
- Check individual package READMEs
- Read error messages carefully (they're helpful!)

---

**Enjoy building with Munus!** 🚀

Built for ETHRome 2025 🇮🇹

