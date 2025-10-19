# Munus

**A decentralized, AI-powered job marketplace where work happens in chat**

[![ETHRome 2025](https://img.shields.io/badge/ETHRome-2025-blue)](https://ethrome.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **TL;DR:** Munus combines XMTP messaging, Base L2 escrow, AI agents, and Calimero private compute to create a chat-native marketplace where teams coordinate paid micro-tasks trustlessly.

---

## 🎯 **What is Munus?**

Munus solves the coordination problem for small businesses and remote teams:

**The Problem:**
- Coordinating paid micro-tasks is messy (invoices, designs, content)
- Payment trust is broken (freelancers wait, creators risk non-delivery)
- Context switching between chat, payment apps, and task trackers kills productivity

**The Solution:**
- **Post jobs in chat** → Funds lock in escrow automatically
- **AI agent coordinates** → Reminders, validation, receipts
- **Payment on delivery** → Trustless, instant, on Base L2
- **Privacy-preserving** → Optional Calimero attestations for sensitive work

---

## 🚀 **User Flow (2 Minutes)**

### Chat-Native Experience:

1. **Open XMTP** → DM the Munus bot: `0xb511e79390b62333309fd5ef3c348f85dc0df6ef`
2. **Ask AI**: "Show me available jobs"
3. **Accept via chat**: "I want to accept job 1" → Bot gives transaction link
4. **Click link** → Sign in miniapp → Return to chat
5. **Complete & deliver** → AI guides payment release

**Key Point:** XMTP chat is your primary interface. Miniapp only for signing transactions.

---

## 🏆 **Bounty Targets** (7 sponsors, $18.5k+ pool)

| Bounty | Track | How We Qualify |
|--------|-------|----------------|
| **Base** | 🏪 Miniapp – Small Business | Real SME use case on Base L2 |
| **BuidlGuidl** | Scaffold-ETH | Clean architecture + tests + innovation |
| **Civic** | Civic-Only SSO | Zero alternative auth, embedded wallets |
| **XMTP** | Agent SDK + Group Chat | Real-time receipts, etiquette, Quick Actions |
| **Calimero** | Private Compute | Merobox workflows + attestations |
| **ENS** | Identity | Name/avatar resolution throughout |
| **AI × Web3** | Primary Track | GPT-4o agent orchestrates blockchain |

---

## 📋 **Table of Contents**

- [User Flow](#user-flow-2-minutes)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [AI Agent Features](#ai-agent-features)
- [Development](#development)
- [License](#license)

---

## 🏗️ **Architecture**

```
┌────────────────────────────────────────────────────────────────┐
│                         Munus Ecosystem                        │
│                                                                │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
│  │   User   │──▶│  Civic   │──▶│ Miniapp  │──▶│  Base    │  │
│  │  (Chat)  │   │   SSO    │   │ (Vercel) │   │ Sepolia  │  │
│  └────┬─────┘   └──────────┘   └────┬─────┘   └────┬─────┘  │
│       │                              │              │          │
│       │         @mentions            ▼              ▼          │
│       ├────────────────────▶ ┌──────────────────────────┐     │
│       │                      │    Escrow Contract      │     │
│       │                      │  0x265B042A62f92E...    │     │
│       │                      └──────────────────────────┘     │
│       │                              ▲              ▲          │
│       ▼                              │              │          │
│  ┌──────────┐        Event Listener │   Contract   │          │
│  │   XMTP   │◀───────────────────────┤   Read/Write │          │
│  │  Network │        Receipts        │              │          │
│  │          │                        │              │          │
│  │ ┌──────────────┐                 │              │          │
│  │ │  AI Agent    │─────────────────┘              │          │
│  │ │  (Railway)   │                                │          │
│  │ │              │                                │          │
│  │ │ ┌──────────┐ │   Vercel AI SDK                │          │
│  │ │ │ GPT-4o   │ │   Function Calling             │          │
│  │ │ └──────────┘ │                                │          │
│  │ └──────────────┘                                │          │
│  └──────────┘                                      │          │
│       │                                            │          │
│       └─────────────────────────────────────────────┘          │
│                                                                │
│  ┌──────────────────────────────────────────────────┐         │
│  │            Calimero (Private Compute)            │         │
│  │                                                  │         │
│  │  Worker's Machine → Merobox (Docker)            │         │
│  │    ├─ Process sensitive data locally            │         │
│  │    ├─ Generate Ed25519 attestation              │         │
│  │    └─ Only hash + CID go on-chain               │         │
│  │                                                  │         │
│  │  Contract stores: artifactHash + attestationCID │         │
│  │  Off-chain verification: verify-attestation.js  │         │
│  └──────────────────────────────────────────────────┘         │
└────────────────────────────────────────────────────────────────┘
```

---

## ✨ **Features**

### **For Users:**
- ✅ **DM the AI bot** at `0xb511e79390b62333309fd5ef3c348f85dc0df6ef` on XMTP (dev network)
- ✅ **Natural language**: "Show design jobs" → AI fetches & filters with descriptions
- ✅ **Accept from chat**: "I'll take job 1" → AI sends transaction link to sign
- ✅ **One-tap login** with Civic SSO (Google/Apple) - auto-created wallets
- ✅ **Instant payments** on Base L2 (~$0.001/tx)
- ✅ **ENS profiles** (vitalik.eth instead of 0x...)

### **For Developers:**
- ✅ **Decentralized messaging** (XMTP V3)
- ✅ **Smart contract escrow** (ReentrancyGuard + CEI)
- ✅ **Event-driven architecture** (real-time receipts)
- ✅ **AI agent with tools** (Vercel AI SDK + GPT-4o)
- ✅ **Private compute** (Calimero + Merobox)
- ✅ **Type-safe** (TypeScript + Solidity)

---

## 🛠️ **Tech Stack**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14, React 18, TypeScript | Miniapp UI |
| **Styling** | Tailwind CSS, shadcn/ui | Components |
| **Auth** | Civic Auth (SSO only!) | Login + embedded wallets |
| **Web3** | Wagmi, Viem | Blockchain interactions |
| **Chain** | Base Sepolia (L2) | Smart contracts |
| **Contracts** | Solidity 0.8.24, Hardhat | Escrow logic |
| **Messaging** | XMTP V3, Agent SDK | Decentralized chat |
| **AI** | Vercel AI SDK, GPT-4o | Agent intelligence |
| **Private Compute** | Calimero, Merobox | Local execution + attestations |
| **Identity** | ENS | Name/avatar resolution |
| **Deployment** | Vercel (miniapp), Railway (agent) | Production hosting |

---

## 🚀 **Quick Start**

### **Prerequisites**

- **Node.js** 18+ ([download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Git** ([download](https://git-scm.com/))
- **Wallet** with Base Sepolia ETH ([faucet](https://www.alchemy.com/faucets/base-sepolia))

### **1. Clone & Install**

```bash
# Clone repository
git clone https://github.com/Nimastic/Munus.git
cd Munus

# Install dependencies (monorepo)
pnpm install
```

### **2. Environment Setup**

Create environment files from examples:

```bash
# Root
cp .env.example .env

# Miniapp
cp apps/miniapp/.env.example apps/miniapp/.env.local

# Agent
cp packages/agent/.env.example packages/agent/.env

# Contracts (if deploying)
cp packages/contracts/.env.example packages/contracts/.env
```

**Edit `apps/miniapp/.env.local`:**

```bash
# REQUIRED: Get from https://civichosted.io
NEXT_PUBLIC_CIVIC_CLIENT_ID=your-civic-client-id

# Already deployed contract (or deploy your own)
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_ESCROW_ADDRESS=0x265B042A62f92E073cf086017fBF53238CF4DcCe

# RPC URLs (public or your own)
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_MAINNET_RPC=https://eth.llamarpc.com
```

**Edit `packages/agent/.env`:**

```bash
# XMTP (for agent identity)
XMTP_WALLET_KEY=0x... # Agent's private key (generate or use existing)
XMTP_DB_ENCRYPTION_KEY=your-random-key
XMTP_ENV=dev # or 'production'

# AI (for GPT-4o agent)
OPENAI_API_KEY=sk-proj-your-openai-key

# Contract config
ESCROW_ADDRESS=0x265B042A62f92E073cf086017fBF53238CF4DcCe
BASE_SEPOLIA_RPC=https://sepolia.base.org
```

### **3. Run Locally**

**Terminal 1 - Miniapp:**
```bash
cd apps/miniapp
pnpm dev
# Open http://localhost:3000
```

**Terminal 2 - AI Agent:**
```bash
cd packages/agent
pnpm dev:ai
# Agent online at [address shown in console]
```

**Terminal 3 - Simple Agent (optional):**
```bash
cd packages/agent
pnpm dev
# Non-AI version (faster, no OpenAI cost)
```

### **4. Test the Flow**

1. **Login**: Visit http://localhost:3000 → "Login with Civic"
2. **Connect Wallet**: MetaMask or Coinbase Wallet → Switch to Base Sepolia
3. **Create Job**: Fill form → Submit transaction
4. **Chat with Agent**: DM agent on [xmtp.chat](https://xmtp.chat) in dev mode
5. **Accept Job**: Another user (or different browser/wallet)
6. **Deliver**: Generate hash, paste attestation CID (optional)
7. **Release Payment**: Creator approves, funds released

---

## 📂 **Project Structure**

```
Munus/
├── apps/
│   └── miniapp/                    # Next.js frontend
│       ├── src/
│       │   ├── app/                # App router
│       │   │   ├── page.tsx        # Home (login)
│       │   │   ├── providers.tsx   # Civic + Wagmi
│       │   │   └── jobs/           # Job pages
│       │   │       ├── page.tsx    # Browse jobs
│       │   │       ├── create/     # Create job
│       │   │       └── [id]/       # Job detail
│       │   ├── components/         # React components
│       │   │   └── EnsBadge.tsx    # ENS display
│       │   └── lib/                # Utils
│       │       ├── wagmi.ts        # Wagmi config
│       │       └── contracts.ts    # Contract helpers
│       └── package.json
│
├── packages/
│   ├── contracts/                  # Smart contracts
│   │   ├── contracts/
│   │   │   └── Escrow.sol          # Main escrow contract
│   │   ├── test/
│   │   │   └── Escrow.test.ts      # Comprehensive tests
│   │   ├── scripts/
│   │   │   └── deploy.ts           # Deployment script
│   │   └── hardhat.config.ts       # Base Sepolia config
│   │
│   └── agent/                      # XMTP agents
│       ├── src/
│       │   ├── index.ts            # Simple command agent
│       │   ├── ai-agent.ts         # AI agent (GPT-4o)
│       │   └── utils/
│       │       ├── escrow.ts       # Contract queries
│       │       ├── event-listener.ts  # Contract events
│       │       └── inline-actions.ts  # Quick Actions
│       └── package.json
│
├── workflows/
│   ├── calimero/                   # Calimero private compute
│   │   ├── workflow.yml            # Merobox workflow
│   │   ├── demo-simulate.sh        # Simulation script
│   │   └── README.md               # Usage guide
│   │
│   └── verify/                     # Attestation verification
│       ├── verify-attestation.js   # Ed25519 verification
│       └── package.json
│
├── docs/                           # Documentation
│   ├── ARCHITECTURE.md             # System design
│   ├── DEPLOYMENT.md               # Production guide
│   └── BOUNTY_COMPLIANCE.md        # Sponsor requirements
│
├── README.md                       # This file
├── QUICKSTART.md                   # 5-min setup
├── package.json                    # Monorepo scripts
├── pnpm-workspace.yaml             # Workspace config
└── pnpm-lock.yaml                  # Lock file
```

---

## 🌐 **Deployment**

### **Live Demo** (Coming Soon)

- **Miniapp:** https://munus.vercel.app (to be deployed)
- **Contract:** [0x265B042A...](https://sepolia.basescan.org/address/0x265B042A62f92E073cf086017fBF53238CF4DcCe) ✅
- **Agent:** Running on Railway (private)

### **Deploy Your Own**

**1. Deploy Miniapp to Vercel:**

```bash
cd apps/miniapp

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# - NEXT_PUBLIC_CIVIC_CLIENT_ID
# - NEXT_PUBLIC_CHAIN_ID
# - NEXT_PUBLIC_ESCROW_ADDRESS
# - NEXT_PUBLIC_BASE_SEPOLIA_RPC
# - NEXT_PUBLIC_MAINNET_RPC

# Deploy to production
vercel --prod
```

**2. Deploy Agent to Railway:**

```bash
cd packages/agent

# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Set variables
railway variables set XMTP_ENV=production
railway variables set OPENAI_API_KEY=sk-proj-...
railway variables set ESCROW_ADDRESS=0x265B042A...
railway variables set BASE_SEPOLIA_RPC=https://sepolia.base.org

# Deploy
railway up
```

**Important:** Add a volume in Railway dashboard at `/app/.data` for persistent database.

**3. Update Civic Dashboard:**

1. Go to https://civichosted.io
2. Add your Vercel domain: `https://your-app.vercel.app`
3. Ensure "Web3 Wallets" is enabled

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for detailed instructions.

---

## 🔄 **How It Works**

### **User Flow**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CREATE JOB                                               │
├─────────────────────────────────────────────────────────────┤
│ Alice → Miniapp → "Hire designer: 0.01 ETH, 24h deadline"  │
│         ↓                                                   │
│ Civic SSO → Connect Wallet → Submit Transaction            │
│         ↓                                                   │
│ Escrow.createJob() → Funds locked → JobCreated event       │
│         ↓                                                   │
│ Agent posts: "🎯 New Job! #0, 0.01 ETH, 24h"              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. ACCEPT JOB                                               │
├─────────────────────────────────────────────────────────────┤
│ Bob → Browse Jobs → Job #0 → "Accept"                      │
│      ↓                                                      │
│ Escrow.accept(0) → Job assigned → JobAccepted event        │
│      ↓                                                      │
│ Agent posts: "✅ Bob accepted Job #0!"                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. DELIVER WORK (Optional: Calimero)                        │
├─────────────────────────────────────────────────────────────┤
│ Bob → (Optional) Run Calimero workflow locally             │
│      ├─ Process sensitive data in Docker                   │
│      ├─ Generate Ed25519 attestation                        │
│      └─ Pin attestation.json to IPFS                        │
│      ↓                                                      │
│ Bob → Job #0 → "Deliver"                                    │
│      ├─ Paste delivery notes                               │
│      ├─ Generate hash (SHA-256)                            │
│      └─ Paste attestation CID (optional)                   │
│      ↓                                                      │
│ Escrow.deliver(0, hash, cid) → JobDelivered event          │
│      ↓                                                      │
│ Agent posts: "📦 Job #0 delivered! Review & release"       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 4. RELEASE PAYMENT                                          │
├─────────────────────────────────────────────────────────────┤
│ Alice → Job #0 → "Release Payment"                         │
│       ↓                                                     │
│ Escrow.release(0) → Transfer ETH → JobReleased event       │
│       ↓                                                     │
│ Agent posts: "💰 Payment Released! 0.01 ETH → Bob 🎉"     │
└─────────────────────────────────────────────────────────────┘
```

### **AI Agent Intelligence**

The agent uses **Vercel AI SDK** + **GPT-4o** with function calling:

**Tools Available:**
1. `getOpenJobs()` - Query all open jobs
2. `getJobDetails(jobId)` - Get specific job info
3. `getMyJobs(address, type)` - User's jobs (created/assigned)
4. `getJobCount()` - Total jobs on chain

**Example Interaction:**

```
User: "What's the highest paying job right now?"

Agent (AI reasoning):
1. Calls getOpenJobs() → Gets all open jobs
2. Analyzes results → Sorts by reward amount
3. Calls getJobDetails(topId) → Gets full details
4. Responds: "The highest paying job is #3 with 0.05 ETH..."
```

**Multi-Step Reasoning:**

```
User: "Show me jobs I created that are still open"

Agent:
1. Gets user's address from context
2. Calls getMyJobs(address, 'creator')
3. Filters results where state === 'Open'
4. Formats response with job details
```

---

## 🧪 **Development**

### **Smart Contracts**

```bash
cd packages/contracts

# Compile
pnpm compile

# Run tests
pnpm test

# Test coverage
pnpm coverage

# Deploy to Base Sepolia
pnpm deploy
```

**Contract Address:** `0x265B042A62f92E073cf086017fBF53238CF4DcCe` (Base Sepolia)

**View on Explorer:** https://sepolia.basescan.org/address/0x265B042A62f92E073cf086017fBF53238CF4DcCe

### **Miniapp**

```bash
cd apps/miniapp

# Development
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Type check
pnpm type-check
```

### **Agent**

```bash
cd packages/agent

# Simple agent (commands only)
pnpm dev

# AI agent (GPT-4o with tools)
pnpm dev:ai

# Build
pnpm build
```

### **Calimero Workflows**

```bash
cd workflows/calimero

# Install Merobox (if not installed)
pipx install merobox
# or: brew install merobox

# Run simulation (for demo)
./demo-simulate.sh

# Run real workflow (requires WASM app)
merobox bootstrap run workflow.yml

# Verify attestation
cd ../verify
node verify-attestation.js ../calimero/attestation.json
```

**Note:** For the hackathon, we use simulation. In production, this would run real WASM logic in Docker.

---

## 🧪 **Testing**

### **Contract Tests**

```bash
cd packages/contracts
pnpm test
```

**Expected Output:**
```
  Escrow
    ✓ should create job (150ms)
    ✓ should accept job (100ms)
    ✓ should deliver job (120ms)
    ✓ should release payment (140ms)
    ✓ should refund after deadline (180ms)
    ✓ should reject unauthorized actions (80ms)
    ✓ should handle ERC-20 tokens (200ms)

  7 passing (970ms)
```

### **Integration Tests**

**Manual End-to-End Flow:**

1. ✅ Login with Civic (only option)
2. ✅ Create job with ETH
3. ✅ Accept job (different user)
4. ✅ Run Calimero simulation
5. ✅ Deliver with attestation
6. ✅ Release payment
7. ✅ Verify agent posted receipts in chat

### **Agent Tests**

```bash
# Test simple agent
cd packages/agent
pnpm dev

# In another terminal, DM agent on xmtp.chat
# Send: "gm"
# Expected: Agent responds with greeting

# Send: "@munus What jobs are available?"
# Expected: AI agent lists open jobs
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

**1. "Civic Client ID Invalid"**
- ✅ Check `NEXT_PUBLIC_CIVIC_CLIENT_ID` in `.env.local`
- ✅ Verify domain is added in Civic dashboard
- ✅ Ensure no typos in client ID

**2. "Wrong Network"**
- ✅ Switch MetaMask to Base Sepolia (Chain ID: 84532)
- ✅ Add network: https://sepolia.base.org
- ✅ Get test ETH from [faucet](https://www.alchemy.com/faucets/base-sepolia)

**3. "Contract Call Reverts"**
- ✅ Check deadline hasn't passed
- ✅ Verify wallet has enough ETH for gas
- ✅ Ensure job is in correct state (can't accept Delivered job)

**4. "Agent Not Responding"**
- ✅ Check agent is running (`pnpm dev` or `pnpm dev:ai`)
- ✅ Verify `XMTP_ENV` matches network (dev/production)
- ✅ In groups, ensure you `@mention` the agent

**5. "OpenAI API Error"**
- ✅ Check `OPENAI_API_KEY` is valid
- ✅ Verify you have credits remaining
- ✅ Use simple agent if AI not needed (`pnpm dev`)

**6. "ENS Names Not Showing"**
- ✅ ENS queries L1 mainnet (slow on public RPC)
- ✅ Use Alchemy/Infura for faster resolution
- ✅ Fallback to short address is normal behavior

### **Debug Mode**

Enable verbose logging:

```bash
# Miniapp
cd apps/miniapp
DEBUG=* pnpm dev

# Agent
cd packages/agent
LOG_LEVEL=debug pnpm dev:ai
```

---

## 📚 **Documentation**

- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design deep-dive
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment
- **[BOUNTY_COMPLIANCE.md](./BOUNTY_COMPLIANCE.md)** - Sponsor requirements
- **[packages/agent/README.md](./packages/agent/README.md)** - Agent documentation
- **[workflows/calimero/README.md](./workflows/calimero/README.md)** - Calimero guide

---

## 🤝 **Contributing**

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Guidelines:**
- Write tests for new features
- Follow existing code style
- Update documentation
- Keep commits atomic and well-described

---

## 📄 **License**

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🙏 **Acknowledgments**

Built with amazing tools from:

- **[XMTP](https://xmtp.org)** - Decentralized messaging protocol
- **[Base](https://base.org)** - Fast, cheap Ethereum L2
- **[Civic](https://civic.com)** - Seamless Web3 authentication
- **[Calimero](https://calimero.network)** - Private compute framework
- **[ENS](https://ens.domains)** - Ethereum name service
- **[Scaffold-ETH](https://scaffoldeth.io)** - Smart contract patterns
- **[Vercel](https://vercel.com)** - AI SDK and hosting
- **[OpenAI](https://openai.com)** - GPT-4o language model

---

## 📞 **Support**

- **Documentation:** See `/docs` folder
- **Issues:** [GitHub Issues](https://github.com/Nimastic/Munus/issues)
- **Questions:** Open a discussion
- **Demo:** Video coming soon!

---

## 🚀 **What's Next?**

After ETHRome 2025:

### **Short-term (Q1 2026)**
- [ ] Deploy to Base Mainnet
- [ ] Mobile app (React Native)
- [ ] Milestones (multi-step jobs)
- [ ] Reputation system (on-chain scores)

### **Mid-term (Q2 2026)**
- [ ] Dispute resolution (Kleros integration)
- [ ] Multi-chain support (Optimism, Arbitrum)
- [ ] DAO treasury integration (Gnosis Safe)
- [ ] Job templates (common task types)

### **Long-term (2026+)**
- [ ] Real Calimero WASM apps (production)
- [ ] ZK proofs for private data
- [ ] Cross-chain job marketplace
- [ ] AI-powered skill matching

---

**Built for ETHRome 2025** 🇮🇹

**Stack:** Next.js + Civic + XMTP + Base + Calimero + ENS + Vercel AI SDK

**Status:** ✅ 95% Complete - Ready for deployment & demo

---

## 🎬 **Quick Links**

- [Quick Start](#quick-start) - Get running in 5 minutes
- [Deployment](#deployment) - Deploy to production
- [How It Works](#how-it-works) - Understand the flow
- [Testing](#testing) - Run tests
- [Troubleshooting](#troubleshooting) - Fix issues

**Start building:** `pnpm install && cd apps/miniapp && pnpm dev` 🚀
