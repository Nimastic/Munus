# Munus - System Architecture

**Version:** 1.0  
**Last Updated:** January 19, 2025

---

## 📊 **High-Level Overview**

Munus is a **chat-native, AI-agent powered P2P job marketplace** for small businesses and teams. It combines decentralized messaging (XMTP), AI orchestration (GPT-4o), smart contracts (Base L2), and optional private compute (Calimero) to create a seamless workflow for coordinating paid tasks.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Munus Ecosystem                         │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
│  │   User   │──▶│  Civic   │──▶│ Miniapp  │──▶│  Base    │  │
│  │  (Chat)  │   │   SSO    │   │ (Vercel) │   │ Sepolia  │  │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘  │
│       │                              │              │          │
│       │                              │              │          │
│       ▼                              ▼              ▼          │
│  ┌──────────┐                   ┌──────────┐   ┌──────────┐  │
│  │   XMTP   │◀──────────────────│  AI Agent│──▶│ Contract │  │
│  │  Network │                   │ (Railway)│   │  Events  │  │
│  └──────────┘                   └──────────┘   └──────────┘  │
│       │                              │                         │
│       │                              ▼                         │
│       │                          ┌──────────┐                 │
│       └─────────────────────────▶│ Calimero │                 │
│                                  │ (Private)│                 │
│                                  └──────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧱 **Component Architecture**

### **1. Miniapp (Next.js on Vercel)**

**Purpose:** Web UI for job management and wallet interactions

**Stack:**
- Next.js 14 (React 18)
- Tailwind CSS + shadcn/ui
- Wagmi + Viem (Ethereum interaction)
- @civic/auth (SSO only!)

**Pages:**
- `/` - Home (login + connect wallet)
- `/jobs` - Job board (browse/filter)
- `/jobs/create` - Create new job
- `/jobs/[id]` - Job detail (accept/deliver/release)

**Key Features:**
- Civic Auth (ONLY SSO - no other connectors)
- Base Sepolia chain integration
- ENS name/avatar resolution
- SHA-256 hash generation for deliveries
- Wallet transaction handling

**Data Flow:**
```
User Action → Wagmi Hook → Contract Call → Transaction → Event Emitted
                                                              │
                                                              ▼
                                                         Agent Notified
```

---

### **2. XMTP Agent (Node.js on Railway)**

**Purpose:** AI orchestrator for chat-native workflows

**Stack:**
- @xmtp/agent-sdk (v0.0.17)
- Vercel AI SDK + GPT-4o
- Viem (blockchain queries)
- TypeScript

**Two Versions:**

#### **a) Simple Agent** (`index.ts`)
- Command parser (`/help`, `/job new`)
- Group etiquette (@mention/reply only)
- Event listeners (contract receipts)
- Fast responses (<1s)

#### **b) AI Agent** (`ai-agent.ts`)
- Natural language understanding
- Function calling (4 tools)
- Multi-step reasoning
- Contextual responses (~2-3s)

**AI Tools:**
```typescript
1. getOpenJobs() → Query all Open status jobs
2. getJobDetails(jobId) → Get specific job info
3. getMyJobs(address, type) → Filter by user
4. getJobCount() → Total jobs on chain
```

**Event Handling:**
```
Contract Event → Agent Listener → Format Message → Broadcast to Chats
```

---

### **3. Smart Contracts (Solidity on Base)**

**Contract:** `Escrow.sol`

**Location:** `packages/contracts/contracts/Escrow.sol`

**Deployed:** `0x265B042A62f92E073cf086017fBF53238CF4DcCe` (Base Sepolia)

**State Machine:**
```
   createJob()
       │
       ▼
   ┌─────────┐
   │  OPEN   │──────────cancel()──────┐
   └─────────┘                        │
       │                              │
       │ acceptJob()                  │
       ▼                              │
   ┌─────────┐                        │
   │ACCEPTED │                        │
   └─────────┘                        │
       │                              │
       │ deliver()                    │
       ▼                              │
   ┌─────────┐                        │
   │DELIVERED│                        │
   └─────────┘                        │
       │                              │
       ├─release()───┐                │
       │             │                │
       │             ▼                ▼
       │        ┌─────────┐      ┌─────────┐
       │        │RELEASED │      │CANCELLED│
       │        └─────────┘      └─────────┘
       │
       └─refund()───┐
                    │
                    ▼
               ┌─────────┐
               │REFUNDED │
               └─────────┘
```

**Job Struct:**
```solidity
struct Job {
    uint256 id;
    address creator;
    address worker;
    uint256 reward;
    uint256 deadline;
    JobState state;
    bytes32 artifactHash;
    string attestationCID;
}
```

**Key Functions:**
- `createJob(deadline)` - Lock ETH in escrow
- `acceptJob(jobId)` - Worker claims job
- `deliver(jobId, hash, attestation)` - Submit proof
- `release(jobId)` - Creator releases payment
- `refund(jobId)` - Creator gets refund if deadline passed
- `cancel(jobId)` - Creator cancels while Open

**Security:**
- Checks-Effects-Interactions (CEI) pattern
- ReentrancyGuard on all state changes
- Role-based access control
- Deadline enforcement

---

### **4. Calimero (Private Compute)**

**Purpose:** Optional local/private execution with attestations

**Components:**

#### **Merobox Workflow** (`workflows/calimero/workflow.yml`)
```yaml
steps:
  1. Install demo app
  2. Create context
  3. Generate identity (Ed25519)
  4. Invite participants
  5. Join context
  6. Execute job (e.g., OCR, data processing)
  7. Generate attestation signature
```

#### **Verification Script** (`workflows/verify/verify-attestation.js`)
```javascript
function verifyAttestation(signature, pubkey, payload) {
  // Verify Ed25519 signature
  // Returns true if valid
}
```

**Integration Point:**
```
Worker → Merobox (local) → Attestation → Miniapp Delivery Form → Contract
```

**Data Privacy:**
```
Sensitive Data (local) → Hash → On-chain
                      → Attestation → On-chain
```

---

### **5. Supporting Services**

#### **ENS (Mainnet)**
- Resolves names: `vitalik.eth` → `0x...`
- Resolves avatars: `vitalik.eth` → IPFS URL
- Fallback: Short address (`0x1234...5678`)
- Cache: React Query (5 min TTL)

#### **RPC Providers**
- Base Sepolia: `https://sepolia.base.org`
- Mainnet (ENS): `https://eth.llamarpc.com`

#### **XMTP Network**
- Environment: `dev` (xmtp.chat) or `production` (Base App)
- Protocol: V3 (with MLS)
- Message size: < 1 MB
- Persistence: `.data/xmtp-{inboxId}.db3`

---

## 🔄 **Complete User Flow**

### **Scenario: Alice creates a job, Bob completes it**

```
Step 1: Alice creates job
────────────────────────────────────────────────────────
Alice → Miniapp → "Create Job" (0.01 ETH, 24h deadline)
         │
         ▼
      Civic SSO (only login option)
         │
         ▼
      Connect Wallet (MetaMask/Coinbase)
         │
         ▼
      Submit Transaction → Escrow.createJob()
         │
         ▼
      Event: JobCreated(id: 0, creator: Alice, reward: 0.01 ETH)
         │
         ▼
      Agent receives event
         │
         ▼
      Agent posts in XMTP chat:
      "🎯 New Job Created! Job #0, 0.01 ETH, 24h deadline"


Step 2: Bob accepts job
────────────────────────────────────────────────────────
Bob → Miniapp → Browse Jobs → Job #0 → "Accept"
       │
       ▼
    Escrow.acceptJob(0)
       │
       ▼
    Event: JobAccepted(id: 0, worker: Bob)
       │
       ▼
    Agent posts:
    "✅ Job #0 Accepted by Bob! Work has begun 🚀"


Step 3: Bob delivers work
────────────────────────────────────────────────────────
Bob → (Optional) Run Calimero workflow locally
       │
       ├─ Processes sensitive data
       ├─ Generates attestation signature
       └─ Outputs: hash + attestation
       │
       ▼
    Miniapp → Job #0 → "Deliver"
       │
       ├─ Paste delivery description
       ├─ Click "Generate Hash" (SHA-256)
       ├─ (Optional) Paste attestation CID
       └─ Submit
       │
       ▼
    Escrow.deliver(0, hash, attestation)
       │
       ▼
    Event: JobDelivered(id: 0, artifactHash, attestationCID)
       │
       ▼
    Agent posts:
    "📦 Job #0 Delivered! Creator: please review and release payment"


Step 4: Alice releases payment
────────────────────────────────────────────────────────
Alice → Miniapp → Job #0 → "Release Payment"
         │
         ▼
      Escrow.release(0)
         │
         ├─ Transfer 0.01 ETH to Bob
         └─ State: RELEASED
         │
         ▼
      Event: JobReleased(id: 0)
         │
         ▼
      Agent posts:
      "💰 Payment Released! Job #0 complete. 0.01 ETH → Bob 🎉"
```

---

## 🤖 **AI Agent Decision Flow**

```
User Message → Agent
      │
      ▼
   Is Group Chat?
      │
      ├─ Yes → Is @mentioned or reply? ──No──▶ Ignore
      │              │
      │             Yes
      │              │
      └──────────────┘
      │
      ▼
   Message Type?
      │
      ├─ "gm" / "hi" ──────────────────────▶ Friendly greeting
      │
      ├─ "/help" / "/start" ───────────────▶ Quick Actions buttons
      │
      ├─ Natural language query ──────────▶ AI Processing
      │                                         │
      │                                         ▼
      │                                    Parse intent
      │                                         │
      │                                         ▼
      │                                    Select tools
      │                                         │
      │                                         ├─ getOpenJobs()
      │                                         ├─ getJobDetails(id)
      │                                         ├─ getMyJobs(addr)
      │                                         └─ getJobCount()
      │                                         │
      │                                         ▼
      │                                    Execute tools
      │                                         │
      │                                         ▼
      │                                    Format response
      │                                         │
      └─────────────────────────────────────────┘
      │
      ▼
   Send response
```

**Example:**

```
User: "What's the highest paying job?"

AI:
  1. Understand intent: Find job with max reward
  2. Select tool: getOpenJobs()
  3. Execute: Query contract for all Open jobs
  4. Process: Sort by reward, get top result
  5. Optionally: Call getJobDetails(topId) for more info
  6. Format: "The highest paying job is Job #3 with 0.05 ETH..."
  7. Send response
```

---

## 🔐 **Security Architecture**

### **Smart Contract Security**
```
Input Validation
    │
    ▼
Checks (require statements)
    │
    ▼
Effects (state changes)
    │
    ▼
Interactions (external calls)
    │
    ▼
ReentrancyGuard prevents re-entry
```

**Guards:**
- Only creator can cancel/release
- Only worker can deliver
- Only Open jobs can be accepted
- Only Delivered jobs can be released
- Refunds only after deadline

### **Authentication Flow**
```
User → Civic Auth (ONLY SSO)
         │
         ├─ Google (via Civic)
         ├─ Apple (via Civic)
         └─ Email (via Civic)
         │
         ▼
    Civic creates embedded wallet (or user connects external)
         │
         ▼
    Wagmi connects to wallet
         │
         ▼
    User can transact on Base
```

**Why Civic Only?**
- Bounty requirement: "Civic as ONLY SSO"
- No RainbowKit, Web3Modal, or other connectors
- Verification: Search codebase for other auth = None

### **Agent Security**
- Message size limits (< 1 MB)
- Rate limiting (TODO: not implemented yet)
- No PII stored
- Secrets in env vars only

---

## 📦 **Data Storage**

### **On-Chain (Base Sepolia)**
```solidity
Job {
  id, creator, worker, reward, deadline, state,
  artifactHash, attestationCID
}
```
- **Cost:** ~$0.001 per job (testnet)
- **Immutable:** Cannot edit after creation
- **Public:** Anyone can query

### **Off-Chain (Local)**
- **Agent DB:** `.data/xmtp-{inboxId}.db3` (XMTP messages)
- **Miniapp:** Browser localStorage (UI state, cart, filters)
- **Calimero:** Local node data (never leaves machine)

### **No Storage:**
- User profiles (ENS resolution is read-only)
- Chat history (managed by XMTP, not us)
- Files (only hashes stored on-chain)

---

## 🚀 **Deployment Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Setup                        │
│                                                             │
│  ┌──────────────┐       ┌──────────────┐                  │
│  │   Vercel     │       │   Railway    │                  │
│  │  (Miniapp)   │       │   (Agent)    │                  │
│  │              │       │              │                  │
│  │ Next.js Edge │       │ Node.js 20   │                  │
│  │ Global CDN   │       │ Persistent   │                  │
│  │ <2s load     │       │ Volume       │                  │
│  └──────┬───────┘       └──────┬───────┘                  │
│         │                      │                           │
│         │                      │                           │
│         ▼                      ▼                           │
│  ┌─────────────────────────────────────┐                  │
│  │       Base Sepolia (Testnet)        │                  │
│  │                                     │                  │
│  │  Escrow Contract:                   │                  │
│  │  0x265B042A...                      │                  │
│  │                                     │                  │
│  │  RPC: sepolia.base.org              │                  │
│  └─────────────────────────────────────┘                  │
│                                                             │
│  ┌─────────────────────────────────────┐                  │
│  │      XMTP Network (Production)      │                  │
│  │                                     │                  │
│  │  - Decentralized messaging          │                  │
│  │  - End-to-end encrypted             │                  │
│  │  - Agent address: 0x...             │                  │
│  └─────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

**URLs:**
- **Miniapp:** `https://munus.vercel.app` (or custom domain)
- **Agent:** Railway (internal, no public endpoint)
- **Contract:** `https://sepolia.basescan.org/address/0x265B...`

---

## 📈 **Scalability Considerations**

### **Current Limitations:**
1. **Event polling** - Agent polls for events every 5s
2. **No indexing** - Full blockchain scan on each query
3. **In-memory cache** - No Redis/distributed cache
4. **Single agent instance** - No load balancing

### **Future Improvements:**
1. **The Graph indexing** - Sub-second queries
2. **Redis cache** - Share state across agent instances
3. **Load balancer** - Multiple agent replicas
4. **Webhooks** - Push-based event notifications

### **Performance Targets:**
- **Miniapp:** <2s cold start, <200ms warm
- **Agent:** <5s response (AI), <1s (simple)
- **Contract:** 2-5s transaction confirmation (Base)

---

## 🎯 **Innovation Summary**

**What Makes Munus Unique:**

1. **Chat-Native** - Jobs posted/managed in XMTP, not separate UI
2. **AI Orchestration** - GPT-4o with function calling, not pre-scripted
3. **Privacy Option** - Calimero for sensitive data (local compute)
4. **ENS Identity** - Professional profiles via existing ENS names
5. **Single SSO** - Civic only (no wallet fragmentation)
6. **Base L2** - Fast, cheap transactions

**Technical Novelty:**
- AI agent with blockchain tools (not common)
- MCP-like patterns via Vercel AI SDK
- Event-driven chat receipts
- SHA-256 client-side hashing (no IPFS dependency)
- Dual agent architecture (simple + AI)

---

## 📞 **For Developers**

### **Local Development Setup:**
```bash
# 1. Clone repo
git clone https://github.com/[user]/munus
cd munus

# 2. Install deps
pnpm install

# 3. Set up env vars (see .env.example files)
# - packages/agent/.env
# - apps/miniapp/.env.local
# - packages/contracts/.env

# 4. Start services (3 terminals)
cd packages/agent && pnpm dev:ai       # Terminal 1
cd apps/miniapp && pnpm dev            # Terminal 2
cd packages/contracts && pnpm test     # Terminal 3 (optional)
```

### **Key Files:**
- `packages/contracts/contracts/Escrow.sol` - Smart contract
- `packages/agent/src/ai-agent.ts` - AI agent
- `packages/agent/src/utils/escrow.ts` - Contract queries
- `packages/agent/src/utils/event-listener.ts` - Event handling
- `apps/miniapp/src/app/jobs/[id]/page.tsx` - Job detail UI

---

**Built for ETHRome 2025** 🇮🇹  
**Stack:** Civic + XMTP + Base + Vercel AI SDK + Calimero + ENS

