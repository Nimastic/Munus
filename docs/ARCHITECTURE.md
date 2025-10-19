# Munus — Architecture Overview

Technical deep-dive into how Munus works.

---

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      USER LAYER                              │
│  ┌────────────────────┐         ┌────────────────────────┐  │
│  │   Base App         │         │   Web Browser          │  │
│  │   (XMTP Client)    │◄────────┤   (Miniapp UI)         │  │
│  └────────────────────┘         └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                    │                        │
                    │                        │
      ┌─────────────┴────────┐      ┌────────┴──────────┐
      │                      │      │                    │
      ▼                      ▼      ▼                    │
┌──────────┐          ┌─────────────────┐               │
│ XMTP     │          │ Next.js Miniapp │               │
│ Network  │          │ (Vercel)        │               │
│          │          │                 │               │
│ • E2E    │          │ • Civic Auth    │               │
│ • P2P    │          │ • Wagmi/Viem    │               │
│ • Agent  │          │ • ENS Display   │               │
└──────────┘          └─────────────────┘               │
      ▲                        │                         │
      │                        │                         │
      │                        ▼                         │
┌─────┴────────┐      ┌──────────────────┐             │
│ XMTP Agent   │      │ Base Chain (L2)  │             │
│ (Railway)    │      │                  │             │
│              │◄─────┤ • Escrow.sol     │◄────────────┘
│ • Commands   │      │ • ETH + ERC-20   │
│ • Reminders  │      │ • Events         │
│ • Receipts   │      └──────────────────┘
└──────────────┘               │
                               │
                               ▼
                      ┌──────────────────┐
                      │ Calimero         │
                      │ (Optional)       │
                      │                  │
                      │ • Private exec   │
                      │ • Attestation    │
                      │ • Ed25519 sig    │
                      └──────────────────┘
```

---

## Data Flow

### 1. Create Job

```
User                Miniapp             Contract            Agent
  │                   │                    │                 │
  │  Login (Civic)    │                    │                 │
  ├──────────────────►│                    │                 │
  │                   │                    │                 │
  │  Create Job       │                    │                 │
  ├──────────────────►│                    │                 │
  │                   │  createJob()       │                 │
  │                   ├───────────────────►│                 │
  │                   │  (ETH locked)      │                 │
  │                   │                    │                 │
  │                   │◄───────────────────┤                 │
  │                   │  JobCreated event  │                 │
  │  Success!         │                    │                 │
  │◄──────────────────┤                    │                 │
  │                   │                    │  (listens)      │
  │                   │                    ├────────────────►│
  │                   │                    │                 │
  │                   │                    │                 │
  │  @munus /job 0    │                    │                 │
  ├───────────────────┼────────────────────┼────────────────►│
  │                   │                    │                 │
  │                   │                    │  Quick Actions  │
  │◄──────────────────┼────────────────────┼─────────────────┤
  │  [Accept] [Open]  │                    │                 │
```

### 2. Accept & Complete

```
Worker              Miniapp             Contract            Calimero
  │                   │                    │                   │
  │  Tap [Accept]     │                    │                   │
  ├──────────────────►│  accept()          │                   │
  │                   ├───────────────────►│                   │
  │                   │  JobAccepted       │                   │
  │◄──────────────────┤                    │                   │
  │                   │                    │                   │
  │  Do work locally  │                    │                   │
  │  (sensitive data) │                    │                   │
  ├───────────────────┼────────────────────┼──────────────────►│
  │                   │                    │  processJob()     │
  │                   │                    │  signAttestation()│
  │                   │                    │                   │
  │                   │                    │  outputHash +     │
  │◄──────────────────┼────────────────────┼───────────────────┤
  │                   │                    │  signature        │
  │                   │                    │                   │
  │  Pin to IPFS      │                    │                   │
  │  (attestation)    │                    │                   │
  │                   │                    │                   │
  │  Tap [Deliver]    │                    │                   │
  ├──────────────────►│  deliver()         │                   │
  │  (hash + CID)     ├───────────────────►│                   │
  │                   │  JobDelivered      │                   │
  │◄──────────────────┤                    │                   │
```

### 3. Review & Release

```
Creator             Miniapp             Contract            Worker
  │                   │                    │                   │
  │  View job #0      │                    │                   │
  ├──────────────────►│  getJob(0)         │                   │
  │                   ├───────────────────►│                   │
  │                   │  Job data          │                   │
  │  See deliverable  │◄───────────────────┤                   │
  │◄──────────────────┤                    │                   │
  │  (hash + CID)     │                    │                   │
  │                   │                    │                   │
  │  Verify off-chain │                    │                   │
  │  (optional)       │                    │                   │
  │                   │                    │                   │
  │  Tap [Release]    │                    │                   │
  ├──────────────────►│  release(0, addr)  │                   │
  │                   ├───────────────────►│                   │
  │                   │  ETH transfer      │                   │
  │                   │  Released event    ├──────────────────►│
  │                   │                    │  (payment!)       │
  │◄──────────────────┤◄───────────────────┤                   │
  │  Receipt          │                    │                   │
```

---

## Security Model

### Authentication

- **Miniapp**: Civic Auth only (no other SSO)
- **Embedded Wallet**: Auto-created, non-custodial
- **Agent**: Separate service key (not user auth)

### On-Chain Security

- **Escrow**: ReentrancyGuard + CEI pattern
- **State Machine**: Jobs can only progress forward
- **Time Locks**: Deadline-based refunds
- **Access Control**: Only creator/assignee can act

### Off-Chain Privacy

- **Sensitive Data**: Never goes on-chain
- **Calimero**: Runs locally on worker's machine
- **Attestation**: Ed25519 signature proves authenticity
- **IPFS**: Only hashes and attestation CIDs stored

### Attack Vectors & Mitigations

| Attack | Mitigation |
|--------|------------|
| **Reentrancy** | ReentrancyGuard + CEI |
| **Front-running** | First-come first-served (accept) |
| **Griefing** | Deadline-based refunds |
| **Fake deliverables** | Creator reviews before release |
| **Agent spam** | Mention/reply gating |
| **Fake attestations** | Ed25519 signature verification |

---

## State Machine

### Job States

```
Open ──accept()──► Accepted ──deliver()──► Delivered ──release()──► Released
 │                     │                                               
 │                     │                                               
 └────refund()─────────┴────refund()────► Refunded
      (if expired)          (if expired)
```

### Transitions

| From | Action | To | Who |
|------|--------|-----|-----|
| Open | accept() | Accepted | Any (not creator) |
| Open | refund() | Refunded | Creator (if expired) |
| Accepted | deliver() | Delivered | Assignee only |
| Accepted | refund() | Refunded | Creator (if expired) |
| Delivered | release() | Released | Creator |
| Delivered | (auto) | Released | Anyone (after deadline) |

---

## Tech Stack Details

### Smart Contracts

```solidity
// packages/contracts/contracts/Escrow.sol

// Dependencies
- OpenZeppelin: IERC20, SafeERC20, ReentrancyGuard
- Solidity: ^0.8.24

// Key Features
- Native ETH + ERC-20 support
- Custom errors (gas efficient)
- Events for indexing
- View helpers for UI

// Gas Costs (approximate)
- createJob: ~80k gas
- accept: ~50k gas
- deliver: ~60k gas
- release: ~70k gas
```

### XMTP Agent

```typescript
// packages/agent/src/index.ts

// Dependencies
- @xmtp/agent-sdk: ^0.0.3
- viem: ^2.21.45

// Architecture
- Event-driven (agent.on("text", ...))
- Persistent DB (SQLite via XMTP)
- Async message handling
- Rate limiting (built-in)

// Content Types
- Text: Standard messages
- Reactions: 👀, ✅, ❌
- Quick Actions: Base App custom (JSON)
```

### Next.js Miniapp

```typescript
// apps/miniapp/

// Framework
- Next.js 14 (App Router)
- React 18
- TypeScript 5

// Web3
- Wagmi: Contract interactions
- Viem: Low-level RPC
- @civic/auth-web3: SSO + embedded wallets

// UI
- Tailwind CSS
- shadcn/ui components
- Lucide icons

// State
- TanStack Query: Server state
- Zustand: Client state (if needed)

// Deployment
- Vercel (auto CI/CD)
- Edge functions for API routes
```

### Calimero Workflows

```yaml
# workflows/calimero/workflow.yml

# Stack
- Merobox CLI: Orchestration
- Docker: Node containers
- WASM: Application runtime
- Ed25519: Signature scheme

# Outputs
- outputs.json: Job results + hashes
- attestation.json: Signed proof

# Verification
- Node.js script (tweetnacl/noble)
- Off-chain (Ed25519 not EVM-native)
```

---

## Performance

### On-Chain

- **Block Time**: 2s (Base L2)
- **Flashblocks**: 200ms effective (coming)
- **Gas Costs**: ~$0.01-0.05 per tx (Base Sepolia)
- **Finality**: <10s typical

### Off-Chain

- **XMTP Latency**: <1s message delivery
- **Agent Response**: <5s (etiquette requirement)
- **Miniapp Load**: <2s (Vercel Edge)
- **ENS Lookup**: ~500ms (cached)

### Scalability

- **Contracts**: Gas-optimized (custom errors, packed storage)
- **Agent**: Horizontal scaling (multiple instances)
- **Miniapp**: CDN + Edge functions (Vercel)
- **XMTP**: P2P network (no central bottleneck)

---

## Monitoring & Observability

### Contract Events

```typescript
// Index with The Graph or Goldsky
event JobCreated(uint256 indexed id, ...);
event JobAccepted(uint256 indexed id, ...);
event JobDelivered(uint256 indexed id, ...);
event Released(uint256 indexed id, ...);

// Query
query {
  jobs(first: 10, orderBy: deadline) {
    id
    creator
    assignee
    amount
    state
  }
}
```

### Agent Metrics

```typescript
// Log to DataDog/NewRelic
- Messages received
- Commands processed
- Errors
- Response times
```

### Miniapp Analytics

```typescript
// Vercel Analytics + Custom
- Page views
- Contract interactions
- User funnels
- Error tracking (Sentry)
```

---

## Future Enhancements

### V2 Features

- **Milestones**: Multi-step jobs with partial payments
- **Disputes**: On-chain arbitration via Kleros
- **Reputation**: ENS-based scoring
- **Templates**: Common job types (design, code, content)
- **Teams**: Multi-sig creators

### Scaling

- **L3**: Deploy on Base L3 for even cheaper gas
- **Indexer**: The Graph subgraph for fast queries
- **Mobile**: React Native app
- **AI**: GPT-4 analyzes deliverables

---

**Questions?** Check our [README](../README.md) or [Deployment Guide](./DEPLOYMENT.md).

Built for ETHRome 2025 🇮🇹

