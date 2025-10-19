# Munus - Production Deployment Guide

Complete guide to deploying Munus to production for ETHRome 2025.

---

## 📋 **Overview**

**What You're Deploying:**
1. **Miniapp** → Vercel (Next.js)
2. **Agent** → Railway/Render (Node.js)
3. **Contract** → Base Sepolia (already deployed)

---

## 1️⃣ **Deploy Smart Contract** (Base Sepolia)

### **Prerequisites:**
- Deployer wallet with Base Sepolia ETH
- Contract code in `packages/contracts/`

### **Steps:**

```bash
# 1. Navigate to contracts
cd packages/contracts

# 2. Set environment variables
cat > .env << EOF
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=YOUR_BASESCAN_API_KEY
EOF

# 3. Compile contracts
pnpm hardhat compile

# 4. Run tests (verify everything works)
pnpm hardhat test

# 5. Deploy to Base Sepolia
pnpm hardhat run scripts/deploy.ts --network baseSepolia

# Output will show:
# Escrow deployed to: 0x265B042A62f92E073cf086017fBF53238CF4DcCe
```

### **Verify on Basescan:**

```bash
pnpm hardhat verify --network baseSepolia 0xYOUR_CONTRACT_ADDRESS
```

### **Save Contract Address:**
- Copy the deployed address
- Update `.env` files in miniapp and agent

---

## 2️⃣ **Deploy Miniapp** (Vercel)

### **Prerequisites:**
- GitHub repository pushed
- Vercel account
- Civic dashboard configured

### **Steps:**

#### **A. Prepare Environment Variables**

Create `.env.local` in `apps/miniapp/`:

```bash
# Civic (REQUIRED)
NEXT_PUBLIC_CIVIC_CLIENT_ID=ac368fe8-81ea-4cd4-8a08-465bea0d20da

# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_ESCROW_ADDRESS=0x265B042A62f92E073cf086017fBF53238CF4DcCe

# RPC URLs
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_MAINNET_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

#### **B. Configure Civic Dashboard**

1. Go to https://civichosted.io
2. Select your app
3. Add domains:
   - `http://localhost:3000` (dev)
   - `https://your-app.vercel.app` (production)
   - `https://your-app-git-*.vercel.app` (preview)
4. Ensure "Web3 Wallets" is enabled

#### **C. Deploy to Vercel**

**Via CLI:**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Navigate to miniapp
cd apps/miniapp

# 3. Deploy
vercel

# 4. Follow prompts:
#    - Link to existing project or create new
#    - Set root directory to "apps/miniapp"
#    - Override build command: "pnpm build"
#    - Override install command: "pnpm install"

# 5. Add environment variables
vercel env add NEXT_PUBLIC_CIVIC_CLIENT_ID
vercel env add NEXT_PUBLIC_CHAIN_ID
vercel env add NEXT_PUBLIC_ESCROW_ADDRESS
vercel env add NEXT_PUBLIC_BASE_SEPOLIA_RPC
vercel env add NEXT_PUBLIC_MAINNET_RPC

# 6. Deploy to production
vercel --prod
```

**Via Vercel Dashboard:**

1. Go to https://vercel.com/new
2. Import GitHub repository
3. Configure project:
   - **Framework:** Next.js
   - **Root Directory:** `apps/miniapp`
   - **Build Command:** `pnpm build`
   - **Install Command:** `cd ../.. && pnpm install --frozen-lockfile`
4. Add environment variables (see above)
5. Deploy!

#### **D. Verify Deployment**

1. Visit your Vercel URL
2. Click "Login with Civic" → Should work without errors
3. Connect wallet → Should switch to Base Sepolia
4. Create a test job → Should submit transaction

#### **E. Common Issues**

**"Invalid Civic Client ID"**
- Check `.env.local` matches Civic dashboard
- Verify domain is added in Civic dashboard

**"Wrong Network"**
- Ensure `NEXT_PUBLIC_CHAIN_ID=84532`
- Check RPC URL is correct

**Build Fails**
- Run `pnpm build` locally first
- Check all environment variables are set

---

## 3️⃣ **Deploy Agent** (Railway)

### **Prerequisites:**
- Railway account (https://railway.app)
- GitHub repository
- OpenAI API key (for AI agent)

### **Steps:**

#### **A. Prepare Agent**

```bash
cd packages/agent

# Create .env (for Railway)
cat > .env.production << EOF
XMTP_WALLET_KEY=0x... # Will be auto-generated if not set
XMTP_DB_ENCRYPTION_KEY=0x... # Will be auto-generated if not set
XMTP_ENV=production

# AI Configuration
OPENAI_API_KEY=sk-proj-YOUR_KEY

# Contract Configuration
ESCROW_ADDRESS=0x265B042A62f92E073cf086017fBF53238CF4DcCe
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Miniapp URL
MINIAPP_URL=https://your-app.vercel.app
EOF
```

#### **B. Deploy to Railway**

**Via Dashboard:**

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - **Root Directory:** `packages/agent`
   - **Start Command:** `pnpm start:ai` (for AI agent) or `pnpm start` (simple agent)
   - **Node Version:** 20 or higher

5. Add environment variables:
   - Click "Variables" tab
   - Add each variable from `.env.production`
   - Mark `OPENAI_API_KEY` and `XMTP_WALLET_KEY` as sensitive

6. Add volume (for persistent DB):
   - Click "Volumes" tab
   - Add volume
   - Mount path: `/app/.data`

7. Deploy!

**Via CLI:**

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
cd packages/agent
railway init

# 4. Add environment variables
railway variables set XMTP_ENV=production
railway variables set OPENAI_API_KEY=sk-proj-...
railway variables set ESCROW_ADDRESS=0x...
railway variables set BASE_SEPOLIA_RPC=https://sepolia.base.org
railway variables set MINIAPP_URL=https://your-app.vercel.app

# 5. Deploy
railway up
```

#### **C. Configure Database Path**

Update `packages/agent/src/ai-agent.ts` (or `index.ts`):

```typescript
// For Railway persistent storage
const customDbPath = (inboxId: string) =>
  `${process.env.RAILWAY_VOLUME_MOUNT_PATH || './.data'}/xmtp-${inboxId}.db3`;

const agent = await Agent.create(signer, {
  env: "production",
  dbPath: customDbPath, // Use persistent path
});
```

#### **D. Verify Deployment**

1. Check Railway logs:
   ```
   ✅ AI Agent created successfully!
   📬 Test your agent: https://converse.xyz/dm/0x...
   🤖 Agent inbox ID: ...
   🎉 AI Agent is now online and ready!
   ```

2. Test the agent:
   - Go to https://converse.xyz (Base App web)
   - Switch to production environment
   - DM your agent's address
   - Send "gm" → Should respond

3. Monitor logs for errors

#### **E. Common Issues**

**"OPENAI_API_KEY is required"**
- Add the variable in Railway dashboard
- Redeploy

**"Agent inbox changes on restart"**
- Add persistent volume
- Use stable `dbPath`

**"Node version too old"**
- Set `NODE_VERSION=20` in environment variables

---

## 4️⃣ **Alternative: Deploy Agent to Render**

### **Steps:**

1. Go to https://render.com/new/web-service
2. Connect GitHub repository
3. Configure:
   - **Name:** munus-agent
   - **Root Directory:** `packages/agent`
   - **Environment:** Node
   - **Build Command:** `pnpm install`
   - **Start Command:** `pnpm start:ai`
   - **Plan:** Free (or paid for better uptime)

4. Add environment variables (same as Railway)

5. Add disk:
   - Mount path: `/app/.data`
   - Size: 1GB

6. Deploy!

---

## 5️⃣ **Post-Deployment Checklist**

### **Miniapp:**
- [ ] Civic login works
- [ ] Can connect wallet (Base Sepolia)
- [ ] Can create job (transaction succeeds)
- [ ] ENS names resolve
- [ ] Mobile responsive

### **Agent:**
- [ ] Responds to "gm" in DM
- [ ] Responds to "@munus" in groups
- [ ] Ignores non-mentioned group messages
- [ ] Posts receipts when jobs created/accepted/released
- [ ] AI queries work (if using AI agent)

### **Contract:**
- [ ] Verified on Basescan
- [ ] Test job flow works
- [ ] Events emitting correctly

---

## 6️⃣ **Monitoring & Maintenance**

### **Miniapp (Vercel):**
- **Analytics:** Vercel dashboard → Analytics
- **Logs:** Real-time function logs
- **Errors:** Error tracking via Vercel
- **Updates:** Push to `main` branch → auto-deploy

### **Agent (Railway/Render):**
- **Logs:** Railway dashboard → Deployments → Logs
- **Health:** Check "last active" timestamp
- **Restart:** Railway dashboard → Restart service
- **Updates:** Push to `main` branch → auto-deploy

### **Contract:**
- **Events:** Monitor on Basescan
- **Transactions:** Track via explorer
- **Upgrades:** Deploy new version + update env vars

---

## 7️⃣ **Production Readiness**

### **Before Launch:**

1. **Test Full Flow:**
   ```
   Login → Connect Wallet → Create Job → Accept → Deliver → Release
   ```

2. **Stress Test:**
   - Create 10+ jobs
   - Multiple users simultaneously
   - Agent handles all events

3. **Security Check:**
   - No API keys in code
   - All sensitive data in environment variables
   - Contract verified on Basescan

4. **Performance:**
   - Miniapp loads < 2s
   - Agent responds < 5s
   - Transactions confirm within 30s

### **Launch Day:**

1. **Announce:**
   - Tweet agent address
   - Share miniapp URL
   - Demo video

2. **Monitor:**
   - Watch logs for errors
   - Track transaction success rate
   - Respond to user feedback

3. **Scale:**
   - Upgrade Railway/Render plan if needed
   - Add rate limiting if agent gets spammed
   - Cache ENS lookups more aggressively

---

## 8️⃣ **Rollback Plan**

If something breaks:

1. **Miniapp:**
   - Vercel → Deployments → Previous → "Promote to Production"

2. **Agent:**
   - Railway → Deployments → Previous → "Redeploy"

3. **Contract:**
   - Can't rollback (immutable)
   - Deploy new version if critical bug
   - Update env vars to new address

---

## 9️⃣ **Cost Estimate**

| Service | Free Tier | Paid | Monthly Cost |
|---------|-----------|------|--------------|
| **Vercel** | Yes | Pro if needed | $0-20 |
| **Railway** | $5 credit | $5/month min | $5-20 |
| **OpenAI** | No | Pay-as-you-go | $10-50 (testing) |
| **RPC** | Yes (public) | Alchemy/Infura | $0-25 |
| **Total** | | | **$15-115/month** |

**For Hackathon:**
- Use free tiers where possible
- OpenAI: ~$5-20 for testing
- Total: < $50

---

## 🆘 **Troubleshooting**

### **Vercel Build Fails**

```bash
# Local test
cd apps/miniapp
pnpm build

# Check output for errors
# Most common: missing env vars
```

### **Railway Agent Won't Start**

```bash
# Check logs for:
1. Node version (needs 20+)
2. Missing env vars
3. Package installation errors

# Fix:
railway variables set NODE_VERSION=20
railway variables set XMTP_ENV=production
```

### **Agent Not Responding**

```bash
# Check:
1. Is it running? (Railway dashboard)
2. Correct environment? (dev vs production)
3. Wallet key persisted? (volume mounted)

# Debug:
railway logs --tail  # View real-time logs
```

---

## 📞 **Support**

- **Documentation:** `README.md`, `QUICKSTART.md`
- **Issues:** GitHub Issues
- **Demo:** `demo-video.mp4`

---

**Ready to ship!** 🚀

Follow these steps and Munus will be live in production for ETHRome 2025!

