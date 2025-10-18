# Munus

**A chat-native job marketplace with on-chain escrow and AI agent orchestration**

Munus enables teams to coordinate paid micro-tasks directly in group chats, with smart contract escrow ensuring trustless payments and an AI agent handling workflow automation.

---

## Overview

Munus combines decentralized messaging (XMTP), blockchain escrow (Base), and AI agents to create a seamless experience for posting, accepting, and completing small paid tasks within team conversations.

**Key Features:**
- Post jobs directly in group chats
- Automatic escrow of funds on Base L2
- AI agent coordinates reminders and validation
- Optional private compute via Calimero
- ENS integration for identity

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    User Layer                       │
│  (Base App Chat / XMTP Group Chat)                 │
└─────────────────┬───────────────────────────────────┘
                  │
      ┌───────────┴──────────┬─────────────────┐
      │                      │                 │
      ▼                      ▼                 ▼
┌──────────┐        ┌─────────────┐    ┌────────────┐
│   XMTP   │        │  Next.js    │    │  Escrow    │
│  Agent   │◄──────►│   Miniapp   │◄──►│  Contract  │
│          │        │             │    │  (Base)    │
└──────────┘        └──────┬──────┘    └────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Calimero   │
                    │  (Private   │
                    │   Compute)  │
                    └─────────────┘
```

**Stack:**
- **Frontend:** Next.js 14, React, Tailwind CSS, shadcn/ui
- **Authentication:** Civic Auth (SSO)
- **Blockchain:** Base (Ethereum L2), Wagmi, Viem
- **Messaging:** XMTP Protocol
- **Smart Contracts:** Solidity, Hardhat
- **Identity:** ENS (Ethereum Name Service)
- **Private Compute:** Calimero/Merobox

---

## Project Structure

```
Munus/
├── apps/
│   └── miniapp/              # Next.js frontend
│       ├── src/
│       │   ├── app/          # App router pages
│       │   ├── components/   # React components
│       │   └── lib/          # Utilities & config
│       └── package.json
│
├── packages/
│   ├── contracts/            # Smart contracts
│   │   ├── contracts/        # Solidity files
│   │   ├── test/            # Contract tests
│   │   └── scripts/         # Deployment scripts
│   │
│   └── agent/               # XMTP Agent
│       └── src/             # Agent implementation
│
├── workflows/
│   └── calimero/            # Calimero workflows
│       └── workflow.yml     # Merobox config
│
└── docs/                    # Documentation
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- A Web3 wallet (MetaMask, Coinbase Wallet)
- Base Sepolia testnet ETH

### Installation

```bash
# Clone repository
git clone https://github.com/Nimastic/Munus.git
cd Munus

# Install dependencies
pnpm install
```

### Environment Setup

Create environment files:

```bash
# Root .env
cp .env.example .env

# Miniapp .env.local
cp apps/miniapp/.env.local.example apps/miniapp/.env.local

# Agent .env
cp packages/agent/.env.example packages/agent/.env
```

Edit with your values:

```env
# apps/miniapp/.env.local
NEXT_PUBLIC_CIVIC_CLIENT_ID=your_civic_client_id
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_ESCROW_ADDRESS=deployed_contract_address
NEXT_PUBLIC_MAINNET_RPC=your_eth_mainnet_rpc
```

### Run Development Server

```bash
# Miniapp
cd apps/miniapp
pnpm dev
# Open http://localhost:3000

# Agent (separate terminal)
cd packages/agent
pnpm dev
```

---

## Smart Contracts

### Escrow Contract

The escrow contract manages job lifecycle and payments on Base chain.

**Key Functions:**
- `createJob(token, amount, deadline, metadataCID)` - Create new job with locked funds
- `accept(id)` - Worker accepts job
- `deliver(id, artifactHash, attestationCID)` - Submit completed work
- `release(id)` - Creator approves and releases payment
- `refund(id)` - Refund if deadline passed without delivery

**Job States:**
```
Open → Accepted → Delivered → Released
  ↓                             
Refunded (if expired)
```

### Testing

```bash
cd packages/contracts
pnpm test
```

**Expected output:**
```
✔ should create job
✔ should accept job
✔ should deliver job
✔ should release payment
✔ should handle refunds
✔ should reject unauthorized actions
✔ should enforce deadlines

7 passing
```

### Deployment

```bash
# Deploy to Base Sepolia
cd packages/contracts
pnpm deploy

# Copy the deployed address to miniapp/.env.local
NEXT_PUBLIC_ESCROW_ADDRESS=0x...
```

---

## XMTP Agent

The agent listens to group chats and provides interactive job cards.

**Capabilities:**
- Responds to mentions (`@munus`)
- Posts Quick Action cards
- Sends reminders for pending jobs
- Validates deliverables
- Updates job status

### Running the Agent

```bash
cd packages/agent
pnpm dev
```

### Agent Commands

- `@munus /help` - Show available commands
- `@munus /job new` - Create new job
- `@munus /job list` - List open jobs
- `@munus /job accept <id>` - Accept job

### Testing

Message the agent on XMTP:
1. Go to https://xmtp.chat
2. Start conversation with agent address
3. Send: `@munus /help`

---

## Miniapp

The Next.js miniapp provides a web interface for job management.

### Features

**Authentication:**
- Civic Auth (SSO only)
- Web3 wallet connection
- ENS name display

**Job Management:**
- Browse all jobs
- Filter by status (open, mine, all)
- Create new jobs with ETH escrow
- Accept jobs as worker
- Submit deliverables
- Approve/release payments

**UI Components:**
- Responsive design
- Real-time contract state
- Transaction confirmations
- ENS avatars and names

### Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with auth flow |
| `/jobs` | Browse all jobs |
| `/jobs/create` | Create new job |
| `/jobs/[id]` | Job details & actions |

---

## Calimero Integration

Calimero workflows enable private, verifiable computation for sensitive job data.

### Use Case

Workers can execute jobs locally (e.g., process confidential documents) and submit only:
- Artifact hash (proof of work)
- Attestation CID (verifiable execution receipt)

The actual data never leaves the worker's machine.

### Workflow

```yaml
# workflows/calimero/workflow.yml
name: process_job
steps:
  - name: execute
    action: run_local
    inputs: [job_data]
  - name: attest
    action: sign_output
    key: ed25519
```

### Running

```bash
cd workflows/calimero
./demo-simulate.sh
```

---

## Configuration

### Network Setup

**Base Sepolia Testnet:**
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org

**Add to MetaMask:**
1. Open MetaMask
2. Settings → Networks → Add Network
3. Enter Base Sepolia details
4. Save

### Get Test ETH

**Alchemy Faucet:**
https://www.alchemy.com/faucets/base-sepolia

**Bridge from Sepolia:**
https://bridge.base.org

---

## API Reference

### Contract ABI

The escrow contract exposes these functions:

```solidity
function createJob(
    address token,
    uint256 amount,
    uint64 deadline,
    string memory metadataCID
) external payable returns (uint256 id);

function accept(uint256 id) external;

function deliver(
    uint256 id,
    bytes32 artifactHash,
    string memory attestationCID
) external;

function release(uint256 id) external;

function refund(uint256 id) external;
```

### Job Data Structure

```solidity
struct Job {
    address creator;
    address assignee;
    address token;
    uint256 amount;
    uint64 deadline;
    JobState state;
    string metadataCID;
    bytes32 artifactHash;
    string attestationCID;
}

enum JobState {
    Open,
    Accepted,
    Delivered,
    Released,
    Refunded
}
```

---

## Development

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Web3** | Wagmi, Viem, ethers |
| **Auth** | Civic Auth |
| **Contracts** | Solidity 0.8.20, Hardhat |
| **Testing** | Hardhat (contracts), Jest (frontend) |
| **Messaging** | XMTP SDK |
| **Identity** | ENS |

### Code Quality

```bash
# Lint
pnpm lint

# Type check
pnpm type-check

# Format
pnpm format
```

### Testing Strategy

- **Unit tests:** Contract logic
- **Integration tests:** Contract interactions
- **Manual tests:** Full user flows

---

## Deployment

### Production Deployment

**1. Deploy Contracts to Base Mainnet**

```bash
cd packages/contracts
# Update .env with mainnet private key
NETWORK=base pnpm deploy
```

**2. Deploy Miniapp to Vercel**

```bash
cd apps/miniapp
vercel --prod
```

Environment variables needed:
- `NEXT_PUBLIC_CIVIC_CLIENT_ID`
- `NEXT_PUBLIC_CHAIN_ID=8453`
- `NEXT_PUBLIC_ESCROW_ADDRESS`
- `NEXT_PUBLIC_MAINNET_RPC`

**3. Deploy Agent to Railway**

```bash
cd packages/agent
# Connect to Railway
railway up
```

### Domain Setup

1. Add custom domain in Vercel
2. Update Civic Auth allowed domains
3. Update CORS settings if needed

---

## Security Considerations

### Smart Contract Security

- ✅ ReentrancyGuard on all external calls
- ✅ CEI pattern (Checks-Effects-Interactions)
- ✅ Access control modifiers
- ✅ Deadline enforcement
- ✅ No-PII design (only hashes stored)

### Frontend Security

- ✅ Civic Auth for authentication
- ✅ Non-custodial wallets
- ✅ Client-side transaction signing
- ✅ Environment variable protection
- ✅ HTTPS only in production

### Recommended Audits

Before mainnet deployment:
- Smart contract audit (OpenZeppelin, Trail of Bits)
- Frontend security review
- Penetration testing

---

## Troubleshooting

### Common Issues

**"Insufficient funds" error**
- Solution: Get test ETH from faucet

**"Wrong network" warning**
- Solution: Switch MetaMask to Base Sepolia (84532)

**Contract call reverts**
- Check deadline hasn't passed
- Verify wallet has enough ETH for gas
- Ensure job is in correct state

**Agent not responding**
- Check agent is running (`pnpm dev`)
- Verify XMTP_WALLET_KEY is set
- Check agent address in group chat

### Debug Mode

Enable verbose logging:

```bash
# Miniapp
DEBUG=* pnpm dev

# Agent
LOG_LEVEL=debug pnpm dev
```

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation
- Keep commits atomic and well-described

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

## Links

- **Documentation:** [/docs](/docs)
- **Contract Explorer:** https://sepolia.basescan.org
- **XMTP Chat:** https://xmtp.chat
- **Base Bridge:** https://bridge.base.org

---

## Acknowledgments

Built with:
- [XMTP](https://xmtp.org) - Decentralized messaging
- [Base](https://base.org) - Ethereum L2
- [Civic](https://civic.com) - Identity and auth
- [Calimero](https://calimero.network) - Private compute
- [ENS](https://ens.domains) - Ethereum name service
- [Scaffold-ETH](https://scaffoldeth.io) - Smart contract tooling

---

**Questions?** Open an issue or start a discussion.
