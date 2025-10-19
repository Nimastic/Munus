awesome—here’s a **full, cursor-ready technical PRD** for **Munus** with concrete code, config, and workflows you can paste into your repo. It’s intentionally **verbose**, so you can lift pieces straight into files.

---

# Munus — Chat-native, pay-on-delivery jobs (AI × Web3)

**Tracks & bounties hit:**

* AI <> Web3 (agent drives the workflow)
* **Civic** (Civic-only SSO + embedded wallets + [Nexus optional])
* **XMTP** (group-chat miniapp + Agent SDK → “Best Miniapp in a Group Chat”, “Best Use of Agent SDK”)
* **Base** Miniapp – Small Business
* **Calimero** (optional private/local execution + attestation)
* **ENS** (identity)
* **BuidlGuidl** (Scaffold-ETH 2 for contracts)

---

## 0) Repo layout

```
munus/
  apps/
    miniapp/                # Next.js (Base mini app), Civic-only auth, Wagmi(Viem), shadcn/ui
  packages/
    contracts/              # Scaffold-ETH 2 + escrow contracts & deploys (Base)
    agent/                  # XMTP Agent SDK bot, Quick Actions/Intent, receipts
  workflows/
    calimero/               # Merobox workflow.yml + sample app + attestation outputs
    verify/                 # Ed25519 verification scripts (Node or Python)
  docs/                     # README, bounty notes, demo script, threat model
```

---

## 1) Contracts (Scaffold-ETH 2)

### 1.1 Install Scaffold-ETH 2 in `packages/contracts`

```bash
# from repo root
pnpm create-eth@latest packages/contracts
# choose: Hardhat, Typescript
cd packages/contracts
pnpm i
```

Add OpenZeppelin:

```bash
pnpm add -D @openzeppelin/contracts
```

### 1.2 Escrow.sol (ETH + ERC-20, artifact hash + attestation CID on deliver)

`packages/contracts/contracts/Escrow.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Escrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum State { Open, Accepted, Delivered, Released, Refunded }

    struct Job {
        address creator;
        address assignee;       // set on accept
        address token;          // address(0) = native
        uint256 amount;
        uint64  deadline;       // unix seconds
        State   state;
        string  metadataCID;    // job brief / resources CID
        bytes32 artifactHash;   // artifact hash provided on deliver
        string  attestationCID; // CID for signed attestation (Calimero)
    }

    uint256 public nextId;
    mapping(uint256 => Job) public jobs;

    event JobCreated(uint256 indexed id, address indexed creator, address token, uint256 amount, uint64 deadline, string metadataCID);
    event JobAccepted(uint256 indexed id, address indexed assignee);
    event JobDelivered(uint256 indexed id, bytes32 artifactHash, string attestationCID);
    event Released(uint256 indexed id, address indexed to, uint256 amount);
    event Refunded(uint256 indexed id, address indexed to, uint256 amount);

    error InvalidState();
    error NotCreator();
    error NotAssignee();
    error PastDeadline();
    error ZeroAmount();
    error AlreadyAssigned();

    modifier inState(uint256 id, State s) {
        if (jobs[id].state != s) revert InvalidState();
        _;
    }

    function createJob(
        address token,
        uint256 amount,
        uint64  deadline,
        string calldata metadataCID
    ) external payable nonReentrant returns (uint256 id) {
        if (amount == 0) revert ZeroAmount();
        if (deadline <= block.timestamp) revert PastDeadline();

        id = nextId++;
        Job storage j = jobs[id];
        j.creator = msg.sender;
        j.token = token;
        j.amount = amount;
        j.deadline = deadline;
        j.state = State.Open;
        j.metadataCID = metadataCID;

        if (token == address(0)) {
            // native coin
            require(msg.value == amount, "Native amount mismatch");
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        emit JobCreated(id, msg.sender, token, amount, deadline, metadataCID);
    }

    function accept(uint256 id) external inState(id, State.Open) {
        Job storage j = jobs[id];
        if (j.assignee != address(0)) revert AlreadyAssigned();
        j.assignee = msg.sender;
        j.state = State.Accepted;
        emit JobAccepted(id, msg.sender);
    }

    function deliver(uint256 id, bytes32 artifactHash, string calldata attestationCID)
        external
        inState(id, State.Accepted)
    {
        Job storage j = jobs[id];
        if (msg.sender != j.assignee) revert NotAssignee();
        j.artifactHash = artifactHash;
        j.attestationCID = attestationCID;
        j.state = State.Delivered;
        emit JobDelivered(id, artifactHash, attestationCID);
    }

    function release(uint256 id, address to)
        external
        nonReentrant
    {
        Job storage j = jobs[id];
        // release allowed by creator after delivery or auto after deadline
        bool canAuto = (j.state == State.Delivered && block.timestamp >= j.deadline);
        if (!(msg.sender == j.creator || canAuto)) revert NotCreator();
        require(j.state == State.Delivered, "Not delivered");

        _payout(id, to);
        j.state = State.Released;
        emit Released(id, to, j.amount);
    }

    function refund(uint256 id, address to)
        external
        nonReentrant
    {
        Job storage j = jobs[id];
        if (msg.sender != j.creator) revert NotCreator();
        require(block.timestamp >= j.deadline, "Not expired");
        require(j.state == State.Open || j.state == State.Accepted, "Cannot refund");

        _payoutInternal(j, to);
        j.state = State.Refunded;
        emit Refunded(id, to, j.amount);
    }

    function _payout(uint256 id, address to) internal {
        Job storage j = jobs[id];
        _payoutInternal(j, to);
    }

    function _payoutInternal(Job storage j, address to) internal {
        uint256 amt = j.amount;
        j.amount = 0; // effects first
        if (j.token == address(0)) {
            (bool ok, ) = to.call{value: amt}("");
            require(ok, "Native transfer failed");
        } else {
            IERC20(j.token).safeTransfer(to, amt);
        }
    }

    // view helpers
    function getJob(uint256 id) external view returns (Job memory) {
        return jobs[id];
    }
}
```

### 1.3 Hardhat config (Base + Base Sepolia)

`packages/contracts/hardhat.config.ts`

```ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    // local anvil or hardhat: add if needed
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
    },
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",
    },
  },
};

export default config;
```

`.env.example`

```env
PRIVATE_KEY=0xabc...          # deployer
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=...
```

### 1.4 Deploy script

`packages/contracts/scripts/deploy.ts`

```ts
import { ethers } from "hardhat";

async function main() {
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy();
  await escrow.deployed();
  console.log("Escrow deployed:", escrow.address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Deploy:

```bash
pnpm hardhat run scripts/deploy.ts --network baseSepolia
```

> **Note:** For USDC on Base Sepolia, plug in the current test token address you decide to use; keep it configurable in the miniapp.

---

## 2) Miniapp (Next.js + Civic-only + Wagmi/Viem + shadcn + ENS)

### 2.1 Bootstrap Next.js app

```bash
pnpm create next-app apps/miniapp --ts --eslint --app
cd apps/miniapp
pnpm i @tanstack/react-query wagmi viem zustand zod axios
pnpm i @civic/auth-web3
pnpm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

`tailwind.config.ts` standard setup; add shadcn if you want:

```bash
pnpm dlx shadcn-ui@latest init
pnpm dlx shadcn-ui@latest add button input card dialog textarea label select badge toast avatar
```

### 2.2 Chains and Wagmi with **embeddedWallet() only**

`apps/miniapp/src/lib/wagmi.ts`

```ts
import { createConfig, http } from "wagmi";
import { base, baseSepolia, mainnet } from "wagmi/chains";
import { embeddedWallet } from "@civic/auth-web3";

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC || "https://mainnet.base.org"),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org"),
  },
  connectors: [
    // **Civic only** embedded wallet connector
    embeddedWallet(),
  ],
});
```

> **Rule compliance:** Do **not** add any other connectors (RainbowKit/Web3Modal/etc.). Civic embedded wallet is the **only** signer path.

### 2.3 Civic Auth Provider (create wallet on first login)

`apps/miniapp/src/app/providers.tsx`

```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { CivicAuthProvider, UserButton, useUser } from "@civic/auth-web3/react";
import { userHasWallet } from "@civic/auth-web3";
import { ReactNode, useEffect } from "react";

const qc = new QueryClient();

function EnsureWallet() {
  const userCtx = useUser();
  useEffect(() => {
    (async () => {
      if (userCtx.user && !userHasWallet(userCtx) && !userCtx.walletCreationInProgress) {
        await userCtx.createWallet(); // provision embedded wallet
      }
    })();
  }, [userCtx.user]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={qc}>
      <WagmiProvider config={wagmiConfig}>
        <CivicAuthProvider clientId={process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID!}>
          <EnsureWallet />
          {children}
        </CivicAuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
```

Add a login UI (Civic supplies UI elements via `UserButton` if desired):

`apps/miniapp/src/app/page.tsx`

```tsx
"use client";
import { UserButton, useUser } from "@civic/auth-web3/react";
import { userHasWallet } from "@civic/auth-web3";
import Link from "next/link";

export default function Home() {
  const userCtx = useUser();
  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Munus</h1>
        <UserButton />
      </div>
      {userCtx.user ? (
        <div className="space-y-2">
          <p>Logged in with Civic (only SSO).</p>
          {userHasWallet(userCtx) && (
            <p className="text-sm">Embedded wallet: {userCtx.ethereum.address}</p>
          )}
          <Link className="underline" href="/jobs">Open Jobs</Link>
        </div>
      ) : (
        <p>Please sign in with Civic.</p>
      )}
    </main>
  );
}
```

`.env.local`

```env
NEXT_PUBLIC_CIVIC_CLIENT_ID=your-civic-client-id
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_ESCROW_ADDRESS=0xYourEscrowOnBaseSepolia
NEXT_PUBLIC_DEFAULT_USDC=0xYourUSDCOnBaseSepolia
```

### 2.4 ENS name & avatar (L1 lookups)

> **Docs note:** ENS resolution **always** reads L1 (chainId = 1). We can still display ENS for EVM addresses.

`apps/miniapp/src/components/EnsBadge.tsx`

```tsx
"use client";
import { useEnsName, useEnsAvatar } from "wagmi";
import Image from "next/image";

export function EnsBadge({ address }: { address: `0x${string}` }) {
  const { data: name } = useEnsName({ address, chainId: 1 });
  const { data: avatar } = useEnsAvatar({ name, chainId: 1 });
  const short = `${address.slice(0,6)}...${address.slice(-4)}`;
  return (
    <span className="inline-flex items-center gap-2">
      {avatar && <Image src={avatar} alt="" width={18} height={18} className="rounded-full" />}
      <span>{name ?? short}</span>
    </span>
  );
}
```

### 2.5 Viem contract client & Job flows

`apps/miniapp/src/lib/contracts.ts`

```ts
import { createPublicClient, createWalletClient, http, parseUnits, Hex, keccak256 } from "viem";
import { base, baseSepolia } from "viem/chains";
import escrowAbi from "./EscrowAbi.json"; // export from contracts build
import { getClient } from "./embeddedWalletClient";

export const CHAIN = process.env.NEXT_PUBLIC_CHAIN_ID === "8453" ? base : baseSepolia;
export const ESCROW = process.env.NEXT_PUBLIC_ESCROW_ADDRESS as `0x${string}`;

export const pub = createPublicClient({ chain: CHAIN, transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC) });

export async function getWallet() {
  // Civic embedded wallet exposes a Wagmi connector; we can get a viem WalletClient from it
  const client = await getClient(CHAIN); // see below
  return client;
}

// helpers
export function toBytes32FromCIDOrHex(s: string): Hex {
  // if already 0x..32 bytes, return; else hash string -> bytes32
  if (s.startsWith("0x") && s.length === 66) return s as Hex;
  return keccak256(new TextEncoder().encode(s));
}
```

`apps/miniapp/src/lib/embeddedWalletClient.ts`

```ts
import { WalletClient, createWalletClient, custom } from "viem";
import { Chain } from "viem";
import { useConnect } from "wagmi";

// This helper returns a WalletClient bound to the Civic embedded wallet connector.
// In React, call connect first, then harvest window.ethereum.

export async function getClient(chain: Chain): Promise<WalletClient> {
  // @ts-ignore
  const eth = (globalThis as any).ethereum;
  if (!eth) throw new Error("No injected provider. Civic embedded wallet not connected yet.");
  return createWalletClient({ chain, transport: custom(eth) });
}
```

Job create UI (approve if ERC-20):

`apps/miniapp/src/app/jobs/create/page.tsx`

```tsx
"use client";
import { useState } from "react";
import { parseUnits } from "viem";
import { getWallet, ESCROW, CHAIN } from "@/lib/contracts";
import { Abi } from "abitype";
import escrowAbi from "@/lib/EscrowAbi.json";

export default function CreateJob() {
  const [token, setToken] = useState<string>(process.env.NEXT_PUBLIC_DEFAULT_USDC!);
  const [amount, setAmount] = useState<string>("40");
  const [deadlineMins, setDeadlineMins] = useState<string>("120");
  const [metadataCID, setCID] = useState<string>("cid-of-brief");

  const onCreate = async () => {
    const wallet = await getWallet();
    const toWei = (v: string) => parseUnits(v, token === "0x0000000000000000000000000000000000000000" ? 18 : 6);
    const amt = toWei(amount);
    const deadline = BigInt(Math.floor(Date.now()/1000) + parseInt(deadlineMins,10)*60);

    if (token !== "0x0000000000000000000000000000000000000000") {
      // approve first
      const approveHash = await wallet.writeContract({
        address: token as `0x${string}`,
        abi: [
          { "name":"approve","type":"function","stateMutability":"nonpayable",
            "inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],
            "outputs":[{"type":"bool","name":""}]}
        ] as Abi,
        functionName: "approve",
        args: [ESCROW, amt],
      });
      console.log("approve tx:", approveHash);
    }

    const hash = await wallet.writeContract({
      address: ESCROW,
      abi: escrowAbi as Abi,
      functionName: "createJob",
      args: [token as `0x${string}`, amt, deadline, metadataCID],
      value: token === "0x0000000000000000000000000000000000000000" ? amt : 0n,
    });
    console.log("createJob tx:", hash);
  };

  return (
    <main className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Create Job</h2>
      <div className="space-y-2">
        <label>Token (address or 0x0 for ETH)</label>
        <input className="border p-2 w-full" value={token} onChange={e=>setToken(e.target.value)} />
        <label>Amount</label>
        <input className="border p-2 w-full" value={amount} onChange={e=>setAmount(e.target.value)} />
        <label>Deadline (minutes from now)</label>
        <input className="border p-2 w-full" value={deadlineMins} onChange={e=>setDeadlineMins(e.target.value)} />
        <label>Metadata CID</label>
        <input className="border p-2 w-full" value={metadataCID} onChange={e=>setCID(e.target.value)} />
        <button className="px-4 py-2 rounded bg-black text-white" onClick={onCreate}>Create</button>
      </div>
    </main>
  );
}
```

Accept / Deliver / Release similarly (read job state, show buttons):

```ts
// accept
await wallet.writeContract({ address: ESCROW, abi: escrowAbi as Abi, functionName: "accept", args: [jobId] });

// deliver
const artifactHash = toBytes32FromCIDOrHex(form.cidOrHex);
await wallet.writeContract({
  address: ESCROW, abi: escrowAbi as Abi, functionName: "deliver", args: [jobId, artifactHash, form.attestationCID],
});

// release
await wallet.writeContract({ address: ESCROW, abi: escrowAbi as Abi, functionName: "release", args: [jobId, payoutTo] });
```

---

## 3) XMTP Agent (Agent SDK)

### 3.1 Setup

```bash
cd packages/agent
pnpm init -y
pnpm i @xmtp/agent-sdk viem ethers dotenv
```

`.env.example`

```env
XMTP_ENV=dev             # dev for testing; production for Base App
XMTP_WALLET_KEY=0x...    # agent wallet private key
XMTP_DB_ENCRYPTION_KEY=some-long-random
GROUP_ID=                 # optional: your target group id to scope
RPC_BASE_SEPOLIA=https://sepolia.base.org
ESCROW_ADDRESS=0xYourEscrowOnBaseSepolia
```

### 3.2 Simple agent with **mention/reply etiquette**, Quick Actions & Intent

> Base App supports XMTP content types + Base custom content (Quick Actions, Intent). We’ll send **Quick Actions** as a structured message with button labels mapping to **Intent payloads** that your miniapp webhook can interpret.

`packages/agent/src/index.ts`

```ts
import "dotenv/config";
import { Agent, getTestUrl } from "@xmtp/agent-sdk";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

const ENV = (process.env.XMTP_ENV as "dev"|"production") || "dev";
const ESCROW = process.env.ESCROW_ADDRESS as `0x${string}`;

const pub = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.RPC_BASE_SEPOLIA),
});

function isMentioningMe(text: string, myHandle: string) {
  return text.toLowerCase().includes(`@${myHandle.toLowerCase()}`);
}

function quickActionsCard(jobId: number) {
  return {
    // pseudo content type shape (Base App custom). You’ll map to their JSON schema.
    type: "coinbase.com/actions:1.0",
    title: `Job #${jobId}`,
    actions: [
      { id: "open-miniapp", label: "Open Miniapp", intent: { type: "open", path: `/jobs/${jobId}` } },
      { id: "accept", label: "Accept", intent: { type: "accept", jobId } },
      { id: "deliver", label: "Mark Delivered", intent: { type: "deliver", jobId } },
      { id: "approve", label: "Approve", intent: { type: "release", jobId } },
      { id: "refund", label: "Refund", intent: { type: "refund", jobId } },
    ],
  };
}

async function main() {
  const agent = await Agent.createFromEnv({ env: ENV, dbPath: "./db" });
  agent.on("start", () => {
    console.log(`Munus agent online: ${getTestUrl(agent.client)}`);
  });

  // text handler
  agent.on("text", async (ctx) => {
    const msg = ctx.message.content?.trim() || "";
    const mentioned = isMentioningMe(msg, "munus"); // set to your basename/handle
    const isReply = !!ctx.message?.reference;

    if (!(mentioned || isReply)) return; // etiquette: only on mention or reply
    await ctx.react("👀");

    // Very simple command: /job <id>
    const m = msg.match(/\/job\s+(\d+)/i);
    if (m) {
      const id = Number(m[1]);
      await ctx.send( quickActionsCard(id) as any );
      return;
    }

    if (/help/i.test(msg)) {
      await ctx.send("Try: `/job 0` or mention me with `/job <id>` to get actions.");
      return;
    }
  });

  // (Optional) An intent webhook flow:
  // Your miniapp can POST to the agent (or vice versa) to broadcast receipts.
  // Example: after a tx mined, agent posts a receipt to the group.

  await agent.start();
}
main().catch(console.error);
```

> **Persistence:** using `dbPath: "./db"` avoids the **10-installation limit** hit during dev.

### 3.3 Posting receipts after on-chain events

Either poll or subscribe (in miniapp backend) and call a tiny agent helper that sends:

```ts
await ctx.send(`✅ Released job #${id}: hash ${short(hash)}`);
```

You can also show an **attachment** (content type `xmtp.org/attachment:1.0`) with structured JSON.

---

## 4) Linking **chat address ↔ Civic embedded wallet** (Civic-only SSO preserved)

**Why:** Civic bounty requires Civic as **only SSO**. Users may also have a **chat wallet** identity. We keep Civic-only for app auth, but allow users to **select payout address** (Civic wallet or chat wallet) via a signed-nonce mapping.

### 4.1 Next.js API route to store link

`apps/miniapp/src/app/api/link/complete/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";

type Body = {
  civicUserId: string;
  civicAddress: `0x${string}`;
  chatAddress: `0x${string}`;
  payoutAddress: `0x${string}`;
  nonce: string;
  sigChat: `0x${string}`;  // signature by chat wallet over nonce
  sigCivic: `0x${string}`; // signature by civic embedded wallet over same nonce
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;
  const { civicUserId, civicAddress, chatAddress, payoutAddress, nonce, sigChat, sigCivic } = body;

  const okChat = await verifyMessage({ address: chatAddress, message: nonce, signature: sigChat });
  const okCivic = await verifyMessage({ address: civicAddress, message: nonce, signature: sigCivic });

  if (!okChat || !okCivic) {
    return NextResponse.json({ error: "bad signatures" }, { status: 400 });
  }

  // TODO: persist mapping securely (SQLite/Prisma or KV). For hackathon, JSON file is okay.
  // { chatAddress, civicUserId, civicAddress, payoutAddress, linkedAt: Date.now() }

  return NextResponse.json({ ok: true });
}
```

UI flow:

1. Agent DM’s nonce to the user (chat).
2. In miniapp, user signs nonce with **Civic embedded wallet**.
3. Submit both sigs to `/api/link/complete`.
4. From then on, “Release to payoutAddress” is allowed.

> **Auth remains Civic-only** (login & wallet in app).

---

## 5) Calimero (Merobox) — private/local compute + attestation

### 5.1 Merobox install

```bash
# requires python3.8+ and docker
pipx install merobox
# or
brew install merobox
```

### 5.2 Example workflow: parse invoice → output hash + signed attestation

`workflows/calimero/workflow.yml`

```yaml
name: "Munus Private Run"
description: "Run a local Calimero app to parse invoice totals and sign attestation"

# optional: clean states
nuke_on_start: false
nuke_on_end: false

# enable auth service if you want protected JSON-RPC
auth_service: false

nodes:
  count: 1
  prefix: "munus-node"
  base_port: 2428
  base_rpc_port: 2528
  chain_id: "munus-testnet"

steps:
  - name: Wait for startup
    type: wait
    seconds: 3

  # install WASM application (you’d provide a simple key->value app or invoice parser demo)
  - name: Install App
    type: install
    node: "munus-node-1"
    path: "./apps/invoice_parser.wasm"
    outputs:
      applicationId: "app_id"

  - name: Create Context
    type: context
    node: "munus-node-1"
    application_id: "{{app_id}}"
    params:
      jobId: "123"        # inject job id
      resourceCID: "QmInvoicePDFCID"
    outputs:
      contextId: "ctx_id"
      memberPublicKey: "member_key"

  - name: Execute Parse
    type: call
    node: "munus-node-1"
    context_id: "{{ctx_id}}"
    executor_public_key: "{{member_key}}"
    method: "parseTotals"
    args:
      invoiceCID: "QmInvoicePDFCID"
    outputs:
      result: "parse_result"

  - name: Sign Attestation
    type: call
    node: "munus-node-1"
    context_id: "{{ctx_id}}"
    executor_public_key: "{{member_key}}"
    method: "signAttestation"
    args:
      payload: "{{parse_result}}"   # your app signs payload internally
    outputs:
      attestation: "att_json"

  - name: Save artifacts
    type: script
    target: local
    inline: |
      echo '{{parse_result}}' > outputs.json
      echo '{{att_json}}' > attestation.json
```

**Result files:**

* `outputs.json` (includes a deterministic outputs hash / CID)
* `attestation.json` (Ed25519 signature over `{ jobId, inputsHash, outputsHash, workerPublicKey, timestamp }`)

### 5.3 Deliver in miniapp

User pastes:

* **Artifact Hash** (CID or SHA-256; we store `bytes32(keccak256(CID))` if CID used).
* **Attestation CID** after pinning `attestation.json` to IPFS (e.g., via web3.storage or Pinata).

```ts
import { toBytes32FromCIDOrHex } from "@/lib/contracts";
await wallet.writeContract({
  address: ESCROW, abi: escrowAbi as Abi, functionName: "deliver",
  args: [jobId, toBytes32FromCIDOrHex(form.artifactCID), form.attestationCID],
});
```

### 5.4 Verify attestation (Node)

`workflows/verify/verify.ts`

```ts
import nacl from "tweetnacl";
import bs58 from "bs58";
import { createHash } from "crypto";
import fs from "fs";

type Att = {
  jobId: number;
  inputsHash: string;   // hex or CID of inputs
  outputsHash: string;  // CID of artifact
  workerPublicKey: string; // base58 or hex Ed25519
  timestamp: number;
  signature: string;    // base58 sig over canonical JSON(payload)
};

function toBytes(s: string): Uint8Array {
  if (s.startsWith("0x")) return Buffer.from(s.slice(2), "hex");
  try { return bs58.decode(s); } catch { return Buffer.from(s, "utf8"); }
}

function keccakHex(s: string) {
  return "0x" + createHash("keccak256").update(s).digest("hex"); // or use viem keccak256
}

const att: Att = JSON.parse(fs.readFileSync("attestation.json","utf8"));
const payload = JSON.stringify({
  jobId: att.jobId,
  inputsHash: att.inputsHash,
  outputsHash: att.outputsHash,
  workerPublicKey: att.workerPublicKey,
  timestamp: att.timestamp
});

const ok = nacl.sign.detached.verify(
  new TextEncoder().encode(payload),
  toBytes(att.signature),
  toBytes(att.workerPublicKey)
);
console.log("Signature valid:", ok);
```

(Or do a Python version with `pynacl`.)

> **For judges:** we verify **off-chain** because Ed25519 is not native on EVM. On-chain we keep **artifact hash + attestation CID** immutable.

---

## 6) IPFS pinning (simple helper)

You can use web3.storage quickly:

```bash
pnpm i web3.storage
```

`apps/miniapp/src/lib/ipfs.ts`

```ts
import { Web3Storage, File } from "web3.storage";

export async function pinJSON(name: string, obj: any): Promise<string> {
  const client = new Web3Storage({ token: process.env.NEXT_PUBLIC_WEB3STORAGE! });
  const file = new File([JSON.stringify(obj, null, 2)], `${name}.json`, { type: "application/json" });
  const cid = await client.put([file], { wrapWithDirectory: false });
  return cid;
}
```

> For the demo, you can also fake CID strings if pinning is flaky; the contract only needs a stable artifact hash.

---

## 7) Base Miniapp UX (quick pages)

* `/jobs` — list Open/Mine/Closed (query events; or keep a local index for demo).
* `/jobs/[id]` — show job state, buttons (Accept/Deliver/Release/Refund).
* `/jobs/create` — as above.

Event reads:

```ts
const logs = await pub.getLogs({
  address: ESCROW,
  event: {
    type: "event",
    name: "JobCreated",
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: true, name: "creator", type: "address"},
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "deadline", type: "uint64" },
      { name: "metadataCID", type: "string" },
    ],
  } as any,
  fromBlock: "earliest",
  toBlock: "latest",
});
```

(You can export the ABI events properly from your compiled JSON.)

---

## 8) Civic rules (explicit compliance)

* **Only SSO in miniapp:** we **only** use `@civic/auth-web3` and `embeddedWallet()` connector.
* **Embedded wallet required:** we call `createWallet()` on first login.
* **Public demo + GitHub + video:** provide in `/docs`.
* **Domain set in Civic dashboard:** set application domain and use it in demo.

**Nexus (optional):** If you want to show extra gold star, wire a simple “create task in Notion” or “ship email” step via Nexus in your agent’s workflow; keep it demonstrable but not required.

---

## 9) Base & XMTP UX guidelines (we follow)

* Agent responds **only on @mention or reply** (prevents spam).
* **Immediate reaction** (👀) to acknowledge.
* **<5s** responses (keep compute off chain).
* **Quick Actions** render buttons; **Intent** posts hit `/api/xmtp/intent` to translate to contract writes.

Example Intent handler (miniapp):

`apps/miniapp/src/app/api/xmtp/intent/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
// { type: "accept" | "deliver" | "release" | "refund", jobId, payload? }
export async function POST(req: NextRequest) {
  const intent = await req.json();
  // SECURITY: check group, user rights, etc.
  switch (intent.type) {
    case "accept":
      // trigger accept via a backend signer or return an action token for the front-end
      return NextResponse.json({ ok: true });
    default:
      return NextResponse.json({ ok: false, error: "not-implemented" }, { status: 400 });
  }
}
```

(For hackathon: keep all writes client-side; intents can just **deep-link** to miniapp routes.)

---

## 10) Tests & smoke

### 10.1 Hardhat test outline

`packages/contracts/test/escrow.ts`

```ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Escrow", () => {
  it("flows ETH job", async () => {
    const [creator, worker] = await ethers.getSigners();
    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy();
    await escrow.deployed();

    const amount = ethers.parseEther("0.1");
    const deadline = Math.floor(Date.now()/1000) + 3600;

    const tx = await escrow.connect(creator).createJob(
      ethers.ZeroAddress, amount, deadline, "cid-brief",
      { value: amount }
    );
    const rc = await tx.wait();
    const id = (await escrow.nextId()) - 1n;

    await escrow.connect(worker).accept(id);
    await escrow.connect(worker).deliver(id, ethers.keccak256("0x1234"), "cid-att");

    // simulate after deadline auto allowed by creator or time pass check
    await escrow.connect(creator).release(id, worker.address);

    const j = await escrow.getJob(id);
    expect(j.state).to.equal(3); // Released
  });
});
```

### 10.2 Manual smoke

1. Run agent (dev): `pnpm tsx src/index.ts` → DM from **xmtp.chat** in **dev env**.
2. Miniapp: `pnpm dev` at `apps/miniapp` → Civic login → wallet provisioned.
3. Create job → fund escrow (USDC or ETH).
4. In chat: `@munus /job 0` → buttons appear.
5. Accept in UI (or intent) → deliver with CID/attestation → release.
6. Agent posts receipt with tx hash; miniapp shows ENS names in row.

---

## 11) Security & privacy

* **Civic** embedded wallets are **non-custodial**; we never touch private keys.
* **ReentrancyGuard** + CEI pattern in escrow.
* **No PII** stored; we handle CIDs & hashes only.
* **Calimero** workflows run **locally**; outputs hashed; only attestations pinned.
* Agent rate-limits and honors **mention-only**.

---

## 12) Bounty talking points (short)

* **Civic:** “Only SSO is Civic; we auto-provision embedded wallets with `@civic/auth-web3`. No other connectors.”
* **XMTP:** “Agent SDK + Quick Actions/Intent; group etiquette; receipts; persistent DB.”
* **Base:** “Escrow & settlement on Base; miniapp UX; SME template.”
* **Calimero:** “Optional private/local run with Merobox; Ed25519 attestation; hash & CID on-chain; off-chain verification.”
* **ENS:** “L1 lookups for names/avatars across UI and receipts.”
* **BuidlGuidl:** “Built with Scaffold-ETH 2; clean README & tests.”

---

## 13) Commands cheat-sheet

```bash
# contracts
cd packages/contracts
pnpm test
pnpm hardhat run scripts/deploy.ts --network baseSepolia

# agent
cd packages/agent
cp .env.example .env   # fill keys
pnpm tsx src/index.ts

# miniapp
cd apps/miniapp
cp .env.local.example .env.local   # fill client id, rpc, addresses
pnpm dev
```

---

## 14) What you should be ready to explain (to judges)

* **Why Civic-only SSO?** Prize rule; simpler onboarding; embedded wallet guarantees.
* **How do payouts work if a worker wants another address?** Link via **signed nonce** (chat wallet ↔ Civic wallet ↔ payout address) while keeping Civic as SSO.
* **How is sensitive data handled?** Private local run on Calimero; only **hashes/CIDs** are shared; E2E chat transport.
* **Why not on-chain verify Ed25519?** Out-of-scope for weekend; we **pin attestation + store hash** on-chain; **verify off-chain** script included.
* **XMTP UX etiquette & Base content types.** Mention/reply gating; Quick Actions & Intent to keep chat clean; <5s feedback loop.

---

## 15) Optional polish (time permitting)

* Add a **countdown badge** to job cards (deadline).
* **Auto-release** service that watches events and calls `release()` after deadline.
* Store job **read-model** in SQLite/Prisma for snappy pages.
* **Nexus** step to mirror job + status into a Google Sheet or Notion.

---

If you want, I can also inline:

* the compiled **ABI JSON** export helper,
* **shadcn** components for JobCard/DeliverDialog,
* and a tiny **Prisma** schema for `/api/link`.

But this should be plenty to get Munus building inside Cursor with copy-paste.
