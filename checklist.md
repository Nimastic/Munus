Awesome—here’s a **single, master, end-to-end checklist** for **Munus** that you can literally work through and tick off. It’s exhaustive (by design) and organized by layers: repo & infra → smart contracts → XMTP agent → miniapp (Civic-only SSO) → Calimero private compute → ENS identity → security → UX/QA → docs/demo → bounty submissions. Each item includes short acceptance criteria so you can verify it’s “done-done.”

---

# ✅ Munus: Master Build & Verification Checklist

## 0) Monorepo & Tooling

* [ ] **Repo layout (pnpm workspaces)**

  * `apps/miniapp`, `packages/contracts`, `packages/agent`, `workflows/calimero`, `workflows/verify`, `docs/`
  * **Verify:** `pnpm -w install` installs all; `pnpm -w -r build` succeeds.

* [ ] **Environment templates**

  * `.env.example` at repo root, plus scoped examples in each package.
  * **Verify:** all required keys documented (Civic client id, chain ids, RPC URLs, XMTP keys, contract address).

* [ ] **Scripts**

  * Root scripts for `dev`, `build`, `lint`, `test`, plus sub-package scripts (`contracts:deploy`, `agent:dev`, `miniapp:dev`).
  * **Verify:** running each script prints clear success output.

* [ ] **CI (GitHub Actions)**

  * Jobs: **lint + typecheck**, **contracts test**, **build miniapp**, **build agent**.
  * **Verify:** green checks on PR; failing tests block merge.

* [ ] **Code style & quality**

  * ESLint + Prettier + TypeScript strict in miniapp/agent; Solhint for contracts.
  * **Verify:** `pnpm -w lint` passes; no `any` leaks where it matters.

---

## 1) Smart Contracts (Base L2)

**Contract:** `Escrow.sol` (ETH + ERC-20)

* [ ] **Core storage & state machine**

  * Job struct: id, poster, assignee, token (0 for ETH), amount, deadline, status (Open/Accepted/Delivered/Released/Refunded/Cancelled), artifactHash (bytes32), attestationCID (string).
  * **Verify:** getters return expected values after each lifecycle step.

* [ ] **Lifecycle functions**

  * [ ] `createJob(...)` – accept ETH or transferFrom ERC-20; emits `JobCreated`.
  * [ ] `acceptJob(id)` – only if Open; sets assignee; emits `JobAccepted`.
  * [ ] `deliver(id, artifactHash, attestationCID)` – only assignee; emits `JobDelivered`.
  * [ ] `release(id)` – only poster; transfers funds to assignee; emits `JobReleased`.
  * [ ] `refund(id)` – poster after deadline if not Released; emits `JobRefunded`.
  * [ ] `cancel(id)` – poster only while Open; returns funds; emits `JobCancelled`.
  * **Verify:** impossible states revert (e.g., double accept, deliver before accept).

* [ ] **Security**

  * CEI pattern + `ReentrancyGuard`.
  * Explicit **chain id guard** in front-end (not contract) ensures Base only.
  * **Verify:** reentrancy tests; fuzz tests don’t find reentrancy path.

* [ ] **Token handling**

  * Safe ETH handling; for ERC-20 use OpenZeppelin’s `IERC20` + `safeTransferFrom` / `safeTransfer`.
  * **Verify:** test ETH path and a USDC/DAI-like ERC-20 on Base Sepolia.

* [ ] **Events**

  * Emit events for all state changes; indexed ids and addresses.
  * **Verify:** front-end listens and updates local cache.

* [ ] **Tests (Hardhat / Foundry)**

  * Positive: full lifecycle (ETH & ERC-20), deadlines, multi-user roles.
  * Negative: wrong caller, wrong status, deadline not reached, zero amount, invalid ERC-20 allowance.
  * Reentrancy attempt test.
  * **Verify:** `pnpm test` with >90% branch coverage.

* [ ] **Deployment**

  * Hardhat config for **Base Sepolia** (chainId `84532`, RPC `https://sepolia.base.org`).
  * Save deployed address to `.env` (`NEXT_PUBLIC_ESCROW_ADDRESS`).
  * **Verify:** contract verified on Basescan (optional but ideal).

---

## 2) XMTP Agent (Group-chat bot)

* [ ] **Agent SDK init**

  * `.env` with `XMTP_WALLET_KEY`, `XMTP_DB_ENCRYPTION_KEY`, `XMTP_ENV=dev|production`.
  * **Verify:** `pnpm dev` prints agent address + “Waiting for messages…”

* [ ] **Persistent local DB**

  * Use a **stable `dbPath`** (not null) to avoid installation limit.
  * **Verify:** restart agent; same inbox; no “new installation” errors.

* [ ] **Etiquette**

  * Respond **only** when (1) **@mentioned** or (2) **message is a reply** to the agent.
  * **Verify:** in a group, random messages do **not** trigger replies.

* [ ] **Ack + speed**

  * Instant **reaction emoji** on receipt (“⏳/👀”), then reply within **<5s**.
  * **Verify:** stopwatch a few interactions.

* [ ] **Commands**

  * `/help` → capabilities + buttons (Quick Actions).
  * `/job new "<title>" <amount> [ETH|TOKEN] [deadline]` → draft job.
  * `/jobs` → list open/assigned for user.
  * `/job <id>` → status + action buttons.
  * **Verify:** all parse & respond; failure cases give helpful error.

* [ ] **Quick Actions cards**

  * Interactive buttons (Accept / Open Miniapp / Deliver).
  * **Verify:** tapping triggers proper flow (or deeplink to miniapp).

* [ ] **Miniapp handoff**

  * Deep link includes **jobId** and **conversationId** to sync UI.
  * **Verify:** opening miniapp shows the same job context.

* [ ] **Escrow notifications**

  * On `JobAccepted`, `JobDelivered`, `JobReleased`, `JobRefunded` events → agent posts a receipt in chat (mentions poster/assignee).
  * **Verify:** event listener → message in the right conversation.

* [ ] **Production deploy**

  * Deploy to **Railway/Render** with persistent volume + env vars.
  * **Verify:** uptime across restarts; logs visible.

---

## 3) Next.js Miniapp (Civic-Only SSO + Embedded Wallets)

> **Rule:** Civic **must be the only SSO**. No RainbowKit/Web3Modal/Injected connectors.

* [ ] **Civic Auth Web3 integration**

  * Use `@civic/auth-web3` + `@tanstack/react-query` + `wagmi` + `viem`.
  * Wrap app with `CivicAuthProvider` and **Wagmi** (only **embeddedWallet()** connector).
  * **Verify:** no other connectors visible/loaded.

* [ ] **Wallet creation**

  * After login, **auto-create embedded wallet** if missing (`createWallet()`), then **connect** via Wagmi to Civic connector.
  * **Verify:** `useAccount()` shows connected; `useBalance()` returns value.

* [ ] **Civic dashboard setup**

  * App registered; **domain** (e.g., Vercel URL) added; **Web3 wallet** option enabled.
  * **Verify:** login flow works in production domain; no CORS/redirect errors.

* [ ] **Chain config**

  * Wagmi chains include **Base Sepolia** (id `84532`); transport = `http()`.
  * **Verify:** wrong network shows a friendly “Switch to Base Sepolia” prompt.

* [ ] **Escrow contract hooks**

  * `useContractRead/Write` (or viem actions) for `createJob/acceptJob/deliver/release/refund/cancel`.
  * **Verify:** transactions succeed from Civic wallet.

* [ ] **Job Board UI**

  * Pages: **Home** (feed), **Create**, **Detail**.
  * Filters: status, mine (poster/assignee), token type.
  * **Verify:** state updates on chain events (via polling or listener).

* [ ] **ENS display**

  * `useEnsName/useEnsAvatar({ chainId: 1 })` to resolve **L1 mainnet** names.
  * **Verify:** shows name/avatar for known addresses; fallback to short address.

* [ ] **Address linking (optional but useful)**

  * Allow users to **link their Base/XMTP address** to Civic wallet for identity continuity.
  * **Verify:** stored locally or onchain note (off-chain fine for hackathon).

* [ ] **Deeplink from agent**

  * Miniapp reads `?jobId=&conversationId=`; preloads job; shows actions.
  * **Verify:** arriving from chat shows the right job instantly.

* [ ] **Production deploy (Vercel)**

  * `NEXT_PUBLIC_CIVIC_CLIENT_ID`, `NEXT_PUBLIC_ESCROW_ADDRESS`, RPC URL, chain id.
  * **Verify:** cold start <2s, route cache OK, images optimized.

---

## 4) Calimero Private Compute (Merobox)

* [ ] **Local setup**

  * Install **Docker** + **merobox** (Homebrew/PyPI).
  * **Verify:** `merobox run --count 1` starts node; dashboard reachable.

* [ ] **Workflow YAML**

  * Steps: install demo WASM app → create context → generate identity → invite → join → `call` method to process an input (e.g., OCR summary).
  * **Verify:** `merobox bootstrap run workflow.yml` finishes without errors and prints output.

* [ ] **Attestation**

  * Produce **Ed25519 signature** + output hash (either from Merobox workflow or a script step).
  * **Verify:** `workflows/verify/verify-attestation.js` verifies signature against expected pubkey + payload.

* [ ] **Miniapp integration**

  * In **Deliver** form: upload artifact (hash file to IPFS or hash locally), paste **attestation CID** (or raw signature).
  * **Verify:** contract stores `artifactHash` + `attestationCID` on `deliver`.

* [ ] **Optional: Show provenance**

  * UI badge “Verified by Calimero” with a **local verify button** that re-checks signature.
  * **Verify:** verification success/failure states are clear.

---

## 5) ENS Identity

* [ ] **Name & avatar**

  * `useEnsName`, `useEnsAvatar` with `chainId: 1` (L1), fallback to address.
  * Cache results client-side to avoid rate limits.
  * **Verify:** known addresses resolve; performance acceptable.

* [ ] **Reverse resolution**

  * If time permits, try `useEnsName` on every visible address; cache aggressively.
  * **Verify:** no blocking UI while resolving.

---

## 6) Security & Safety

* [ ] **Contracts**

  * CEI + ReentrancyGuard; no external untrusted calls after state changes.
  * Guard zero amounts; guard deadlines in the future; guard re-deliver/ double-release.
  * **Verify:** tests cover each guard; all negative cases revert with helpful errors.

* [ ] **Front-end**

  * **Lock chain** (only Base Sepolia) and token allowlist (optionally).
  * Validate numeric inputs; disable buttons during pending tx; handle `userRejectedRequest`.
  * **Verify:** can’t submit malformed values or use wrong chain.

* [ ] **Auth**

  * **Only** Civic SSO; no additional login paths.
  * **Verify:** deleting Civic provider breaks login (expected), adding other providers fails lint (optional static check).

* [ ] **Agent**

  * Respect message size limits (< 1 MB); sanitize text echoes; rate-limit spam.
  * **Verify:** “flood” test doesn’t DOS the agent.

* [ ] **PII**

  * No personal data stored; artifacts stored as **hash/CID**.
  * **Verify:** searching codebase reveals no email/phone/PII persistence.

---

## 7) UX, Product & QA

* [ ] **Onboarding**

  * First run: “Sign in with Civic” → “Create wallet” → “Ready”.
  * **Verify:** zero-crypto users can create & accept a job without friction.

* [ ] **Happy path demo**

  * Poster creates job (ETH) → Worker accepts → Worker delivers (hash + attestation) → Poster releases → Payment arrives.
  * **Verify:** each step has snackbars, receipts in chat, and UI updates.

* [ ] **Unhappy paths**

  * Poster cancels Open job → funds returned.
  * Deadline passes without release → poster `refund`.
  * Wrong user tries to accept/deliver → revert with clear message.
  * **Verify:** UI shows friendly error dialogs.

* [ ] **Group etiquette (agent)**

  * Narrow responses (mentioned/replied only).
  * **Verify:** chatting normally doesn’t spam the room.

* [ ] **Performance**

  * Miniapp route changes < 2s; ENS lookups async; agent response < 5s.
  * **Verify:** manual timing & Lighthouse (optional).

* [ ] **Accessibility**

  * Buttons have aria labels; color contrast passes.
  * **Verify:** quick audit in devtools.

---

## 8) Observability & Ops

* [ ] **Logging**

  * Agent logs: command received, action taken, tx hash; redact secrets.
  * Miniapp: toast on errors; console warns suppressed in prod.
  * **Verify:** logs help debug without leaking secrets.

* [ ] **Health checks**

  * Agent exposes `/health` (simple HTTP) or logs “ready” every N mins.
  * **Verify:** your host shows green metrics.

* [ ] **Rate limits & retries**

  * Backoff on RPC errors; display retry CTA in UI.
  * **Verify:** disconnect network to simulate.

---

## 9) Documentation

* [ ] `README.md` – What it does, quick start, screenshots.
* [ ] `QUICKSTART.md` – 5-min local run (exact commands).
* [ ] `docs/ARCHITECTURE.md` – diagram + data flow.
* [ ] `docs/DEPLOYMENT.md` – Vercel (miniapp), Railway (agent), Basescan verify.
* [ ] `docs/BOUNTY_COMPLIANCE.md` – per-sponsor requirements and where you meet them.
* [ ] `packages/agent/README.md` – run, env, etiquette.
* [ ] `packages/contracts/` – functions, events, addresses, test matrix.
* **Verify:** a teammate can deploy from docs only.

---

## 10) Demo Assets

* [ ] **Short video (2–3 min)**

  * Hook → create/accept/deliver/release → receipts in chat → quick tech slide.
  * **Verify:** clean narration; no dev console; readable text.

* [ ] **Live demo script**

  * Steps, expected outputs, backup path if RPC stalls.
  * **Verify:** run it twice cleanly.

* [ ] **Public demo**

  * Miniapp on **Vercel (prod)**; Agent deployed (prod); contract on **Base Sepolia**.
  * **Verify:** judge can click link and replicate the flow.

---

## 11) Bounty Submission Checklist

**AI × Web3 (Primary)**

* [ ] Agent orchestrates workflow end-to-end (post → accept → deliver → release).
* [ ] Show Calimero private compute & attestation as optional privacy layer.

**Civic ($2k)**

* [ ] **Civic Auth as only SSO** (no others present).
* [ ] Embedded wallets via `@civic/auth-web3`; demo wallet creation.
* [ ] Civic dashboard → app domain added.
* [ ] Public demo + video + GitHub.
* [ ] (Optional) Civic **Nexus** style agentic flow explained in README (approval steps, guardrails).

**XMTP ($3k: Miniapp + Agent SDK)**

* [ ] Group-chat native: Quick Actions; mention/reply etiquette; receipts.
* [ ] Uses **Agent SDK**; persistent DB; production deployment details.
* [ ] Response time < 5s; ack reactions.
* [ ] Submit links + repo.

**Base Miniapp – Small Business**

* [ ] Real SME use case (invoices, micro tasks, payouts).
* [ ] Built on **Base**; chain id locked; Base Sepolia demo.
* [ ] Meets “Featured” UX basics (clean CTA, obvious value).
* [ ] Submit with App URL + description.

**Calimero ($5k laddered)**

* [ ] Merobox workflow YAML; local private compute; attestation.
* [ ] Verification script; explain data ownership.
* [ ] Include screenshots/logs in docs.

**ENS**

* [ ] Name + avatar across UI (L1 lookups).
* [ ] Clear fallback; performance acceptable.

**BuidlGuidl (Scaffold-ETH)**

* [ ] SE2 patterns or equivalent; good README; meaningful tests; innovation.
* [ ] Explain contract architecture & design choices.

---

## 12) Nice-to-Haves (If time remains)

* [ ] **Token allowlist** (e.g., USDC test token) to avoid weird ERC-20s.
* [ ] **Milestones** (split job into deliverables).
* [ ] **Disputes** (stub for arbitrator, e.g., Kleros).
* [ ] **Reputation** (off-chain scores now; on-chain later).
* [ ] **Indexing** (Ponder/Subgraph) for queries instead of event polling.
* [ ] **Cache** (SWR/React Query TTL tuning).

---

# Quick Sanity Runs (fast “am I done?” loops)

* [ ] **Local happy path**: create (ETH) → accept → deliver (hash+attestation) → release.
* [ ] **Local unhappy path**: create → cancel; create → accept → no deliver by deadline → refund.
* [ ] **ENS shows** for at least one known address.
* [ ] **Agent** responds **only** when mentioned; posts receipts on each contract event.
* [ ] **Civic-only**: no alternative logins/connectors present; new user can log in & auto-create wallet.
* [ ] **Vercel prod** + **Railway prod** live; links in README; demo video attached.

---

If you want, I can turn this into a printable PDF or a GitHub issue checklist you can paste as a single task list with sub-tasks.
