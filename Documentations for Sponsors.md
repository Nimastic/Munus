Gotcha. I pulled your giant paste into a single, tidy reference you can drop into a repo/wiki. It’s de-duplicated, consistently structured, and keeps the important commands, APIs, and rules intact (incl. “Civic as the ONLY auth/SSO” note).

# Munus – Unified Build Reference (Cleaned)

> A compact, consistent reference that merges Calimero + Merobox, ENS/wagmi, Scaffold-ETH 2, Civic Auth (+ Web3 embedded wallets), XMTP Agents/Base content types, and ETHRome context.

---

## 0) TL;DR / Stack Fit

* **Chain & data layer:** Calimero (private shards) + Merobox for local orchestration (Docker).
* **Frontend:** Next.js/React (Scaffold-ETH 2 starter optional).
* **Auth (rule):** **Civic Auth ONLY**. Use `@civic/auth` and **`@civic/auth-web3` (embedded wallets)**.
* **Wallets:** Civic embedded EOAs (EVM; Base/Ethereum/Polygon/Arbitrum/etc.). No bring-your-own wallet yet.
* **Identity / messaging / mini-apps:** XMTP Agent SDK (optional), Base App content types (Quick Actions + Intent).
* **Name resolution:** ENS via wagmi/viem (optional UX sugar).
* **Hackathon context:** ETHRome 2025 (Oct 17–19), Privacy/AI/DeFi.

---

## 1) Calimero Network (core)

**What it is:** Infra for user-owned data + verifiable off-chain compute in a peer-to-peer model.

**Docs snapshot**

* Status of page: *Next* docs (WIP); stable docs at **0.7.0**.
* Supported OS/Arch: **macOS/Linux**; **x86_64, arm64 (Apple Silicon)**.
* Last page update cited: **Oct 7, 2025**.

**Key repos (org highlights)**

* `core` (Rust) – “Calimero 2.0”.
* `admin-dashboard` (Node).
* `calimero-client-js` (TS), `contracts` (Rust).
* `app-registry` (Fastify API + React UI; manifests JCS+Ed25519; artifacts by IPFS CID).
* Example apps: `battleships-application`, `only-peers-client`.

---

## 2) Merobox CLI (Calimero node/workflow runner)

**What it is:** Python CLI to spin Calimero nodes via Docker, wire Traefik+Auth, and run YAML workflows.

### Install

```bash
# PyPI (recommended)
pipx install merobox

# Homebrew
brew install merobox

# From source
git clone https://github.com/calimero-network/merobox.git
cd merobox
pipx install -e .
```

### Common commands

```bash
# Start N nodes (optionally with Auth/Traefik)
merobox run --count 2 [--auth-service]

# List / health / logs
merobox list
merobox health
merobox logs <NODE_NAME> [--follow]

# Stop nodes / whole stack
merobox stop --all
merobox stop --auth-service

# Nuke everything (careful)
merobox nuke -f

# Workflows
merobox bootstrap validate workflow.yml
merobox bootstrap run workflow.yml [--auth-service] [-v]
```

### Auth service integration (Traefik + nip.io)

* Networks: `calimero_web` (public) / `calimero_internal` (backend).
* With `--auth-service`:

  * Public routes: `/admin-dashboard` (no auth),
  * Protected: `/admin-api/`, `/jsonrpc`, `/ws`.
* Example hostnames: `http://node1.127.0.0.1.nip.io`

**Images (as referenced in docs)**

* Default auth image flag: `--auth-image ghcr.io/calimero-network/mero-auth:edge`
* *Note*: Docs also mention `ghcr.io/calimero-network/calimero-auth:latest`. Treat as naming discrepancy; prefer **`mero-auth:edge`** unless told otherwise.

### Workflow YAML (minimal shape)

```yaml
name: "Sample"
force_pull_image: false
auth_service: true
log_level: "info"

nodes:
  count: 2
  prefix: "calimero-node"
  # image: ghcr.io/calimero-network/merod:edge

steps:
  - name: Install App
    type: install
    node: calimero-node-1
    path: ./app.wasm
    outputs: { applicationId: app_id }

  - name: Create Context
    type: context
    node: calimero-node-1
    application_id: "{{app_id}}"
    outputs: { contextId: ctx_id, memberPublicKey: member_key }

  - name: Execute
    type: call
    node: calimero-node-1
    context_id: "{{ctx_id}}"
    method: set
    args: { key: "hello", value: "world" }
    executor_public_key: "{{member_key}}"
    outputs:
      result: result
      nested: result.output      # dotted path OK
```

**Other built-in steps**

* `identity`, `invite`, `join`, `wait`, `repeat`, `script`, `assert`, `json_assert`.

**Variable export & nesting**

* Use dotted paths (`result.data.user.name`, arrays via `items.0.id`).

### Env & logging

* `CALIMERO_IMAGE`, `DOCKER_HOST`, `LOG_LEVEL`.
* WebUI/auth frontend fetch toggles:

  * `CALIMERO_WEBUI_FETCH=1` (default fresh), `0` cached.
  * `CALIMERO_AUTH_FRONTEND_FETCH=1` (default fresh), `0` cached.
* RUST_LOG patterns via `--log-level "info,module::path=debug"`.

### Quick URLs

* Node API (protected): `http://<node>.127.0.0.1.nip.io/jsonrpc`
* Dashboard (public): `http://<node>.127.0.0.1.nip.io/admin-dashboard`

### Troubleshooting hits

* Ports in use → free/kill or change base ports.
* nip.io timeout → check Traefik/auth running, DNS, Traefik dashboard.
* Variable not found → ensure `outputs` names match later `{{vars}}`.

---

## 3) ENS in dApps (wagmi/viem quickstart)

**Install**

```bash
npm i wagmi viem @tanstack/react-query
```

**Basic profile (React)**

```tsx
import { useAccount, useEnsName, useEnsAvatar } from "wagmi";

export const EnsProfile = () => {
  const { address } = useAccount();
  const { data: name } = useEnsName({ address, chainId: 1 });
  const { data: avatar } = useEnsAvatar({ name, chainId: 1 });
  return (
    <div className="flex items-center gap-2">
      <img src={avatar ?? ""} className="h-8 w-8 rounded-full" />
      <div className="flex flex-col leading-none">
        <span className="font-semibold">{name}</span>
        <span className="text-sm text-gray-500">{address}</span>
      </div>
    </div>
  );
};
```

* ENS resolution always queries **L1 (chainId: 1)** even if user is on L2.
* You can also fetch **Text records** and **multi-chain addresses** via custom hooks.

---

## 4) Scaffold-ETH 2 (Next.js + RainbowKit + wagmi + TS)

**Create**

```bash
npx create-eth@latest
# Examples:
npx create-eth@latest -e ponder
npx create-eth@latest -e erc-20
npx create-eth@latest -e subgraph
```

* Perks: live-updating contract UI, Tailwind + daisyUI components, block explorer, custom wagmi hooks, extensions system.

---

## 5) Civic Auth (RULE: only SSO) + Web3 Embedded Wallets

> **Sponsor rule:** Use **Civic Auth ONLY** for authentication/SSO. Use **embedded wallets** via `@civic/auth-web3`.

### Packages

```bash
# Base auth
npm i @civic/auth

# Web3/embedded wallets
npm i @civic/auth-web3
```

### React/Next integration (minimal)

```tsx
import { CivicAuthProvider, UserButton, useUser } from "@civic/auth-web3/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { embeddedWallet, userHasWallet } from "@civic/auth-web3";
import { mainnet, base } from "wagmi/chains";

const wagmiConfig = createConfig({
  chains: [mainnet, base],
  transports: { [mainnet.id]: http(), [base.id]: http() },
  connectors: [embeddedWallet()],
});

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <WagmiProvider config={wagmiConfig}>
        <CivicAuthProvider clientId="YOUR_CLIENT_ID">
          <Ui />
        </CivicAuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

function Ui() {
  const ctx = useUser();
  const create = async () => {
    if (ctx.user && !userHasWallet(ctx)) await ctx.createWallet();
  };
  return (
    <div>
      <UserButton />
      {!userHasWallet(ctx) ? (
        <button onClick={create}>Create Wallet</button>
      ) : (
        <div>Wallet: {ctx.ethereum.address}</div>
      )}
    </div>
  );
}
```

**Notes**

* **Supported chains:** 18+ EVMs (Ethereum, Base, Polygon, Arbitrum, BSC, Avalanche, …).
* **Wallet type:** EOAs, non-custodial via partner; **no external self-custodial connect yet** (coming soon per docs).
* **Server helpers (Next):** `getUser`, `createWallet`, `getWallets`.

### Civic bounty/rules (integrate Civic Auth)

* Must use **embedded wallets** and **Civic as the ONLY SSO**.
* Add **application domain** in Civic dashboard.
* Provide **public demo** (e.g., Vercel), **GitHub repo**, and **short video** walkthrough.
* Provide a 1-line project description.
* Non-public or missing any item → disqualification.

---

## 6) XMTP Agent SDK + Base App content types

**What:** Build chat agents that live in DMs/groups (Base App, Farcaster, etc.). Messages are E2E encrypted; stored off-chain on XMTP.

### Agent quickstart

```bash
npm i @xmtp/agent-sdk
```

```ts
import { Agent, getTestUrl } from "@xmtp/agent-sdk";

// Create from env (see .env vars below)
const agent = await Agent.createFromEnv({ env: "dev" });

agent.on("text", async (ctx) => { await ctx.sendText("Hello from my XMTP Agent! 👋"); });

agent.on("start", () => console.log(`Online: ${getTestUrl(agent)}`));

await agent.start();
```

**.env**

```
XMTP_WALLET_KEY=0x...            # agent wallet private key
XMTP_DB_ENCRYPTION_KEY=...       # db encryption
XMTP_ENV=dev                     # local | dev | production
```

**Local DB (persist!)**

* Files: `{env}-xmtp.db3` (+ `-shm`, `-wal`, `.sqlcipher_salt`).
* Don’t use `dbPath:null` in dev loops (10-installation limit per inbox).

**Supported chains:** EOAs/SCWs on **EVM** (Ethereum, Base, Arbitrum, Optimism, Polygon, …).

### Base App content types (for richer UX)

* **Quick Actions** `coinbase.com/actions:1.0` – buttons in a message.

  ```json
  {
    "id": "payment_alice_123",
    "description": "Choose amount to send to Alice",
    "actions": [
      { "id": "send_10", "label": "Send $10", "style": "primary" },
      { "id": "send_20", "label": "Send $20", "style": "primary" },
      { "id": "custom_amount", "label": "Custom Amount", "style": "secondary" }
    ],
    "expiresAt": "2025-12-31T23:59:59Z"
  }
  ```
* **Intent** `coinbase.com/intent:1.0` – the user’s selection echo:

  ```json
  { "id": "payment_alice_123", "actionId": "send_10", "metadata": { "actionLabel": "Send $10" } }
  ```
* Standard XMTP: text, attachments (inline/remote), replies, reactions, group updates, read receipts, wallet send calls, tx references.

**Group etiquette**

* Respond only when **@mentioned** or when a user **replies** to the agent’s message.

---

## 7) ENS “what it is” (concept)

* Maps names like `alice.eth` → addresses/content hashes/metadata.
* Reverse resolution binds primary name to an address.
* DNS names can be imported via DNSSEC (e.g., `.com`, `.xyz`, …).

---

## 8) ETHRome 2025 (context)

* **Rome** · **Oct 17–19**. Tracks: **Privacy, AI, DeFi**.
* Rough schedule:

  * Fri 17: Doors 14:00 · Opening 17:00 · Hacking 18:00
  * Sun 19: Submissions 09:00 · Closing/Winners 16:00
* Prize pool: **€50k+** (per site blurb). Entry free for accepted hackers.

---

## 9) Civic Nexus (optional automation platform)

* “Connect tools via MCP servers; no key wrangling in-app; SOC 2 Type 1 (Jul 2025) per copy; approvals/guardrails for agents.”
* Not required for your current “Civic-only auth” constraint, but can complement ops workflows.

---

## 10) Gotchas & Small Inconsistencies (already cleaned)

* **Auth image name:** Docs mention both `mero-auth` and `calimero-auth`. Prefer `ghcr.io/calimero-network/mero-auth:edge` unless the team specifies otherwise.
* **Calimero docs are “Next” (WIP):** Treat specifics as subject to change; stable ref at **0.7.0**.
* **Civic wallets:** Embedded EOAs only (no external wallet connect yet).

---

## 11) Copy-paste snippets (ready)

**Merobox + Auth (1 node)**

```bash
merobox run --count 1 --auth-service --log-level info
```

**Workflow “hello world” (set a key)**

```yaml
name: "Hello World"
auth_service: true
nodes: { count: 1, prefix: "calimero-node" }
steps:
  - name: Install
    type: install
    node: calimero-node-1
    path: ./app.wasm
    outputs: { applicationId: app_id }
  - name: Context
    type: context
    node: calimero-node-1
    application_id: "{{app_id}}"
    outputs: { contextId: ctx_id, memberPublicKey: member_key }
  - name: Set KV
    type: call
    node: calimero-node-1
    context_id: "{{ctx_id}}"
    method: set
    args: { key: "hello", value: "world" }
    executor_public_key: "{{member_key}}"
    outputs: { ok: result }
```

**Civic Auth (create wallet if missing)**

```ts
import { useUser } from "@civic/auth-web3/react";
import { userHasWallet } from "@civic/auth-web3";

const EnsureWallet = () => {
  const ctx = useUser();
  return !userHasWallet(ctx) ? (
    <button onClick={() => ctx.user && ctx.createWallet()}>
      Create Wallet
    </button>
  ) : (
    <span>{ctx.ethereum.address}</span>
  );
};
```

**XMTP Agent (dev)**

```ts
import { Agent, getTestUrl } from "@xmtp/agent-sdk";
const agent = await Agent.createFromEnv({ env: "dev" });
agent.on("text", async (ctx) => { await ctx.sendText("gm"); });
agent.on("start", () => console.log(getTestUrl(agent)));
await agent.start();
```

---

### If you want this as a Markdown file or Notion-ready doc, say the word and I’ll export it exactly how you want it formatted.
