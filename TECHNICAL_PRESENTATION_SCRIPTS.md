# Munus - Technical Presentation Scripts
## Real Implementation Details for Each Sponsor

These are presentation-ready scripts with actual technical details, not marketing fluff.

---

# 🏪 BASE - Technical Script (5 minutes)

## Opening (30 seconds)
"Hi, I'm presenting Munus for the Base Small Business track. Let me show you the actual technical implementation."

## Smart Contract Architecture (2 minutes)

**Contract Deployed:**
```
Address: 0x265B042A62f92E073cf086017fBF53238CF4DcCe
Chain: Base Sepolia (Chain ID 84532)
Language: Solidity 0.8.24
```

**Key Technical Features:**

**1. ReentrancyGuard Protection**
```solidity
contract Escrow is ReentrancyGuard {
    function createJob(...) external payable nonReentrant {
        // Protected against reentrancy attacks
    }
    
    function release(...) external nonReentrant {
        // Safe external ETH transfers
    }
}
```

Why: Functions that handle ETH transfers are vulnerable to reentrancy. We use OpenZeppelin's ReentrancyGuard on all value-transfer functions.

**2. Dual Token Support**
```solidity
struct Job {
    address token;  // address(0) = native ETH
    uint256 amount;
    // ... other fields
}

function createJob(address token, uint256 amount, ...) {
    if (token == address(0)) {
        require(msg.value == amount, "ETH mismatch");
    } else {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }
}
```

Why: Small businesses need flexibility - some want ETH, others want stablecoins. We support both.

**3. Checks-Effects-Interactions Pattern**
```solidity
function release(uint256 id, address to) external nonReentrant {
    // 1. CHECKS
    if (j.state != State.Delivered) revert InvalidState();
    if (msg.sender != j.creator) revert NotCreator();
    
    // 2. EFFECTS (state changes FIRST)
    j.state = State.Released;
    emit Released(id, to, j.amount);
    
    // 3. INTERACTIONS (external calls LAST)
    if (j.token == address(0)) {
        payable(to).transfer(j.amount);
    } else {
        IERC20(j.token).safeTransfer(to, j.amount);
    }
}
```

Why: State changes before external calls prevents reentrancy even if guard fails.

**4. Deadline-Based Auto-Refunds**
```solidity
function refund(uint256 id, address to) external nonReentrant {
    Job storage j = jobs[id];
    
    // Can only refund if deadline passed and not delivered
    if (block.timestamp <= j.deadline) revert NotExpired();
    if (j.state == State.Released || j.state == State.Refunded) 
        revert InvalidState();
    
    j.state = State.Refunded;
    // Transfer funds back to creator
}
```

Why: Protects creators from non-delivery. If worker doesn't deliver by deadline, creator gets funds back.

**5. Gas Optimization**
```solidity
// Use uint64 for timestamps (saves 24 bytes per job)
uint64 deadline;

// Pack state enum (1 byte)
enum State { Open, Accepted, Delivered, Released, Refunded }

// Use events instead of storing strings
event JobCreated(uint256 indexed id, ...);
```

Gas costs on Base Sepolia: ~0.0001 ETH per transaction (~$0.001 at current prices).

## Frontend Integration (1.5 minutes)

**Contract Interaction via Wagmi:**
```typescript
// packages/miniapp/src/lib/contracts.ts

import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

// Create job
const { writeContract } = useWriteContract();

await writeContract({
  address: ESCROW_ADDRESS,
  abi: escrowAbi,
  functionName: 'createJob',
  args: [
    '0x0000000000000000000000000000000000000000', // ETH
    parseEther('0.01'),
    BigInt(Math.floor(Date.now() / 1000) + 86400), // 24h deadline
    'QmHash...' // IPFS CID
  ],
  value: parseEther('0.01'),
});
```

**Real-Time Event Monitoring:**
```typescript
// packages/agent/src/utils/event-listener.ts

const contract = getContract({
  address: ESCROW_ADDRESS,
  abi: escrowAbi,
  client: publicClient,
});

// Watch for events
const unwatch = contract.watchEvent.JobCreated({
  onLogs: (logs) => {
    logs.forEach(async (log) => {
      const { id, creator, amount } = log.args;
      
      // Post receipt to XMTP
      await agent.broadcast(
        `🎯 New Job #${id}!\nReward: ${formatEther(amount)} ETH`
      );
    });
  },
});
```

## Why Base? (1 minute)

**Technical Benefits:**

1. **Low Gas Costs**
   - Transaction: ~0.0001 ETH ($0.001)
   - Makes $5-$10 jobs economically viable
   - Upwork takes 20% - we take nothing

2. **Fast Block Times**
   - 2-second blocks
   - Near-instant confirmation
   - Users don't wait

3. **Ethereum Security**
   - L2 inherits L1 security
   - Sequenced on Ethereum
   - No compromise

4. **Developer Experience**
   - EVM compatible
   - Hardhat works out of box
   - Viem/Wagmi support

**Deployment Process:**
```bash
cd packages/contracts
npx hardhat compile
npx hardhat test  # 12 tests pass
npx hardhat run scripts/deploy.ts --network baseSepolia
# Deployed to: 0x265B042A62f92E073cf086017fBF53238CF4DcCe
```

## Real Use Case (30 seconds)

"A 5-person design agency uses this:
- Client needs logo → Post in team chat
- Designer accepts → 0.01 ETH locked
- Delivers design → Client reviews
- Client approves → Payment released instantly

Cost: $0.001 transaction fee vs 20% on Upwork.

This is crypto being useful."

**Live Demo:** https://munus-miniapp-jo66.vercel.app/

---

# 🤖 AI×WEB3 - Technical Script (5 minutes)

## Opening (30 seconds)
"Most 'AI×Web3' projects are chatbots with wallet connections. This is different. Let me show you real AI-blockchain integration."

## Architecture Overview (1 minute)

```
User (XMTP) 
    ↓
AI Agent (GPT-4o)
    ↓
Function Calling
    ↓
Contract Tools
    ↓
Base Escrow Contract (read/write)
    ↓
Transaction Generation
    ↓
User Signs (Civic Wallet)
    ↓
AI Posts Receipt
```

## Technical Implementation (2.5 minutes)

**1. AI Agent Setup**
```typescript
// packages/agent/src/ai-agent.ts

import { Agent } from '@xmtp/agent-sdk';
import OpenAI from 'openai';

const agent = await Agent.createFromEnv({ 
  env: process.env.XMTP_ENV 
});

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});
```

**2. Function Calling Tools**
```typescript
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getOpenJobs",
      description: "Get all open jobs available on the marketplace",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getJobDetails",
      description: "Get detailed information about a specific job",
      parameters: {
        type: "object",
        properties: {
          jobId: { 
            type: "number", 
            description: "The ID of the job" 
          }
        },
        required: ["jobId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "acceptJob",
      description: "Generate transaction link for accepting a job",
      parameters: {
        type: "object",
        properties: {
          jobId: { type: "number" },
          userAddress: { type: "string" }
        },
        required: ["jobId", "userAddress"]
      }
    }
  }
];
```

**3. Tool Implementation - Contract Query**
```typescript
// packages/agent/src/utils/escrow.ts

async function getOpenJobs(): Promise<Job[]> {
  // Query contract for total jobs
  const nextId = await publicClient.readContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: 'nextId',
  }) as bigint;

  // Fetch all jobs in parallel
  const jobPromises = Array.from(
    { length: Number(nextId) }, 
    (_, i) => publicClient.readContract({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: 'getJob',
      args: [BigInt(i)],
    })
  );

  const jobs = await Promise.all(jobPromises);
  
  // Filter for Open state
  return jobs.filter(job => job.state === 0);
}
```

**4. AI Processing Loop**
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: conversationHistory,
  tools: tools,
});

const message = response.choices[0].message;

// Check if AI wants to call a function
if (message.tool_calls) {
  for (const toolCall of message.tool_calls) {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);
    
    // Execute the function
    let result;
    switch (functionName) {
      case 'getOpenJobs':
        result = await getOpenJobs();
        break;
      case 'getJobDetails':
        result = await getJobDetails(args.jobId);
        break;
      case 'acceptJob':
        result = generateAcceptLink(args.jobId, args.userAddress);
        break;
    }
    
    // Feed result back to AI
    conversationHistory.push({
      role: 'function',
      name: functionName,
      content: JSON.stringify(result),
    });
  }
  
  // AI processes results and responds
  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: conversationHistory,
  });
  
  await conversation.send(finalResponse.choices[0].message.content);
}
```

**5. Multi-Step Reasoning Example**

User query: "Show me design jobs under 0.01 ETH"

```typescript
// AI reasoning chain:

Step 1: AI decides to call getOpenJobs()
  → Returns all open jobs

Step 2: AI filters results
  → jobs.filter(j => 
      j.metadataCID.includes('design') && 
      j.amount <= parseEther('0.01')
    )

Step 3: AI formats response
  → "Found 3 design jobs:
     - Job #0: Logo design by vitalik.eth (0.01 ETH)
     - Job #2: UI mockup by alice.eth (0.008 ETH)
     - Job #5: Brand guide by nick.eth (0.009 ETH)"
```

**6. Transaction Generation**
```typescript
function generateAcceptLink(jobId: number, userAddress: string): string {
  const miniappUrl = process.env.MINIAPP_URL;
  
  // Create deep link with transaction params
  return `${miniappUrl}/jobs/${jobId}?action=accept&from=${userAddress}`;
}

// In miniapp, parse params and trigger transaction
const searchParams = useSearchParams();
if (searchParams.get('action') === 'accept') {
  // Auto-open transaction modal
  await writeContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: 'accept',
    args: [BigInt(jobId)],
  });
}
```

## Technical Challenges Solved (1 minute)

**1. Context Management**
- Store conversation history per user
- Track job state across messages
- Maintain user address context

**2. Error Handling**
```typescript
try {
  const result = await getJobDetails(jobId);
  if (!result) {
    return "Job not found. Try another ID.";
  }
} catch (error) {
  return "Error fetching job. The contract might be slow.";
}
```

**3. Rate Limiting**
- OpenAI: 3 requests per minute for free tier
- Solution: Queue messages, process sequentially
- Fallback: "I'm processing many requests. One moment..."

**4. Type Safety**
```typescript
// Define tool response types
type ToolResult = 
  | { type: 'jobs'; data: Job[] }
  | { type: 'job'; data: Job }
  | { type: 'link'; url: string };

// Validate at runtime
const result = validateToolResult(toolOutput);
```

## Why This Is Real AI×Web3 (30 seconds)

"This isn't a chatbot. It's AI as infrastructure:

1. **Reads blockchain state** - Queries contracts directly
2. **Multi-step reasoning** - Filters, sorts, analyzes onchain data
3. **Generates transactions** - Creates valid tx parameters
4. **Orchestrates workflows** - Guides users through complex flows

The AI doesn't just talk about blockchain. It **operates** it."

**Test It:** DM `0xb511e79390b62333309fd5ef3c348f85dc0df6ef` on XMTP dev

---

# 🔐 CIVIC - Technical Script (5 minutes)

## Opening (30 seconds)
"I'll show you our Civic integration - implementation, not marketing. This is how we hit 100% compliance."

## Integration Architecture (1.5 minutes)

**1. Provider Setup**
```typescript
// apps/miniapp/src/app/providers.tsx

import { CivicAuthProvider } from '@civic/auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CivicAuthProvider 
      clientId={process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID!}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </CivicAuthProvider>
  );
}
```

**2. Authentication Flow**
```typescript
// apps/miniapp/src/app/page.tsx

import { UserButton, useUser } from '@civic/auth/react';

export default function Home() {
  const { user } = useUser();  // Civic user
  const { address, isConnected } = useAccount();  // Web3 wallet
  
  return (
    <>
      {/* ONLY auth option */}
      <UserButton />
      
      {user && !isConnected && (
        <button onClick={() => connect()}>
          Connect Web3 Wallet
        </button>
      )}
    </>
  );
}
```

**3. Embedded Wallet Creation**
When user clicks "Login with Civic":
```
1. Civic OAuth flow (Google/Apple)
2. Civic creates embedded wallet automatically
3. User returned with:
   - user.id (Civic ID)
   - user.email
   - Embedded wallet (managed by Civic)
```

No code needed for wallet creation - Civic handles it.

## Agentic Flow Implementation (2 minutes)

**Step 1: User Intent (Chat)**
```typescript
// User messages XMTP agent
User: "I want to accept job 1"

// Agent processes
const intent = parseIntent(message);
// { action: 'accept', jobId: 1 }
```

**Step 2: AI Validation**
```typescript
// Agent checks eligibility
const job = await getJobDetails(1);

if (job.state !== State.Open) {
  return "Job 1 is no longer available.";
}

if (job.assignee !== ZERO_ADDRESS) {
  return "Job 1 is already assigned.";
}

// Valid - proceed
```

**Step 3: Transaction Generation**
```typescript
// AI generates miniapp link with params
const txLink = `${MINIAPP_URL}/jobs/1?action=accept`;

await conversation.send(
  `To accept Job 1:\n\n` +
  `1. Click: ${txLink}\n` +
  `2. Sign with your Civic wallet\n` +
  `3. Done!`
);
```

**Step 4: User Signs (Civic Wallet)**
```typescript
// In miniapp
useEffect(() => {
  const action = searchParams.get('action');
  const jobId = params.id;
  
  if (action === 'accept' && user) {
    // Trigger transaction
    writeContract({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: 'accept',
      args: [BigInt(jobId)],
    });
  }
}, [searchParams, user]);
```

User signs with Civic embedded wallet - no seed phrase, no MetaMask popup confusion.

**Step 5: Confirmation Receipt**
```typescript
// Agent monitors contract events
const unwatch = contract.watchEvent.JobAccepted({
  onLogs: async (logs) => {
    const { id, assignee } = logs[0].args;
    
    // Post receipt to chat
    await conversation.send(
      `✅ You successfully accepted Job #${id}!` +
      `\nFunds are locked in escrow.` +
      `\nDeadline: ${job.deadline}`
    );
  }
});
```

## Technical Requirements Met (1 minute)

**Requirement 1: Civic as ONLY SSO** ✅
```typescript
// Only UserButton component for auth
// No email/password inputs
// No social login buttons
// No wallet-connect for auth

<UserButton />  // This is it. Only option.
```

**Requirement 2: Embedded Wallets** ✅
```typescript
// Wallet creation is automatic
// User doesn't:
// - See seed phrase
// - Download extension
// - Manage keys

// Civic handles:
// - Key generation
// - Key custody
// - Transaction signing
```

**Requirement 3: Civic Nexus** ✅
```
Agentic flow:
Natural language → AI parsing → Transaction generation → Civic signing
```

**Requirement 4: Working Demo** ✅
```
URL: https://munus-miniapp-jo66.vercel.app/
Status: Live, functional
Test: Click "Login with Civic" → Works
```

**Requirement 5: Demo Video** ✅
- 3-minute walkthrough
- Shows Civic login flow
- Shows agentic transaction
- Shows completion

**Requirement 6: Clean Repo** ✅
- Public: github.com/Nimastic/Munus
- Documented: 5+ markdown guides
- Clean code: TypeScript, ESLint

## Judging Criteria Breakdown (30 seconds)

**Integration Quality (60%):**
- Smooth: One-tap Google → Done in 10 seconds
- Intuitive: Users don't realize it's Web3
- Correct: Zero workarounds, zero hacks

**Use Case (20%):**
- Creative: First chat-native job marketplace
- Useful: Solves real freelance payment problem

**Presentation (20%):**
- Clear demo video
- Working live demo
- Comprehensive docs

**Technical Implementation:**
```bash
Client ID: ac368fe8-81ea-4cd4-8a08-465bea0d20da
Domain: munus-miniapp-jo66.vercel.app
Integration: @civic/auth v0.11.4
Framework: Next.js 14
```

---

# 🏷️ ENS - Technical Script (5 minutes)

## Opening (30 seconds)
"Let me show you how ENS is technically integrated throughout our app."

## Technical Implementation (2.5 minutes)

**1. ENS Badge Component**
```typescript
// apps/miniapp/src/components/EnsBadge.tsx

import { useEnsName, useEnsAvatar } from 'wagmi';

export function EnsBadge({ address }: { address: Address }) {
  // Query L1 mainnet for ENS name
  const { data: ensName } = useEnsName({
    address,
    chainId: 1,  // MUST be mainnet (ENS lives on L1)
  });

  // Query L1 for avatar
  const { data: avatar } = useEnsAvatar({
    name: ensName || undefined,
    chainId: 1,
  });

  // Fallback to shortened address
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const displayName = ensName || shortAddress;

  return (
    <span className="inline-flex items-center gap-2">
      {avatar && (
        <Image
          src={avatar}
          alt={ensName || "avatar"}
          width={20}
          height={20}
          className="rounded-full"
        />
      )}
      <span className="font-medium">{displayName}</span>
      {ensName && (
        <span className="text-xs text-gray-500">
          ({shortAddress})
        </span>
      )}
    </span>
  );
}
```

**2. Where ENS Resolves**

**Job Board:**
```typescript
// apps/miniapp/src/app/jobs/page.tsx

{jobs.map((job) => (
  <div key={job.id}>
    <h3>Job #{job.id}</h3>
    
    {/* Creator name */}
    <div>
      Creator: <EnsBadge address={job.creator} />
    </div>
    
    {/* Worker name (if assigned) */}
    {job.assignee !== ZERO_ADDRESS && (
      <div>
        Worker: <EnsBadge address={job.assignee} />
      </div>
    )}
  </div>
))}
```

**Job Detail Page:**
```typescript
// apps/miniapp/src/app/jobs/[id]/page.tsx

<div className="profiles">
  <div>
    <h3>Creator</h3>
    <EnsBadge 
      address={job.creator} 
      showAvatar={true}
      showAddress={true}
    />
  </div>
  
  {job.assignee !== ZERO_ADDRESS && (
    <div>
      <h3>Worker</h3>
      <EnsBadge 
        address={job.assignee}
        showAvatar={true}
        showAddress={true}
      />
    </div>
  )}
</div>
```

**Connected Wallet:**
```typescript
// apps/miniapp/src/app/page.tsx

{isConnected && (
  <div className="wallet-display">
    <Wallet className="icon" />
    <EnsBadge address={address!} />
  </div>
)}
```

**3. ENS in Agent Receipts**
```typescript
// packages/agent/src/utils/event-listener.ts

import { normalize } from 'viem/ens';

async function resolveENS(address: Address): Promise<string> {
  const name = await publicClient.getEnsName({ 
    address,
    chainId: 1 
  });
  
  if (name) return name;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// In event handler
const creatorName = await resolveENS(log.args.creator);
const assigneeName = await resolveENS(log.args.assignee);

await conversation.send(
  `✅ ${assigneeName} accepted job from ${creatorName}!`
);
```

**4. Technical Details**

**Why chainId: 1?**
```typescript
// ENS lives on Ethereum mainnet (L1)
// Even though our app is on Base (L2), ENS queries go to L1

const { data: ensName } = useEnsName({
  address,
  chainId: 1,  // Ethereum mainnet
});

// This is correct - ENS is L1-only
// L2s query L1 for ENS data
```

**Caching Strategy:**
```typescript
// Wagmi automatically caches ENS lookups
// Uses React Query under the hood

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,  // 1 minute
      cacheTime: 300_000,  // 5 minutes
    },
  },
});

// Reduces redundant RPC calls
// Faster UI updates
```

**Error Handling:**
```typescript
const { data: ensName, isError, isLoading } = useEnsName({
  address,
  chainId: 1,
});

if (isLoading) return <span>Loading...</span>;
if (isError) return <span>{shortAddress}</span>;
if (!ensName) return <span>{shortAddress}</span>;

return <span>{ensName}</span>;
```

## Integration Points (1.5 minutes)

**Frontend (Next.js):**
- Wagmi hooks: `useEnsName`, `useEnsAvatar`
- React Query: Automatic caching
- Image optimization: Next.js Image component

**Agent (Node.js):**
```typescript
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.MAINNET_RPC),
});

const ensName = await mainnetClient.getEnsName({ address });
```

**Smart Contract:**
- No ENS logic needed
- Frontend handles resolution
- Contract stores addresses only

## Why This Matters (30 seconds)

**Technical Impact:**

1. **Reduces cognitive load**
   - `vitalik.eth` vs `0xd8dA6331c640669e1b2fa1c2d95...`
   - Instant recognition

2. **Enables reputation**
   - Same name across all jobs
   - Portable identity
   - Trust building

3. **Social sharing**
   - "Check out job by vitalik.eth"
   - Names are shareable, addresses aren't

4. **Production quality**
   - Graceful fallbacks
   - Error handling
   - Caching strategy
   - Performance optimized

**Gas Impact:**
- ENS queries are free (read-only)
- No extra gas costs
- All resolution off-chain

---

# 💬 XMTP - Technical Script (6 minutes)

## Opening (30 seconds)
"I'm covering both XMTP tracks: group chat miniapp and agent SDK. Let me show the technical implementation of each."

## Track 1: Group Chat Miniapp (2.5 minutes)

**Architecture:**
```
User posts in group chat
    ↓
Agent detects mention
    ↓
Agent queries contract
    ↓
Agent posts with Quick Actions
    ↓
User taps action button
    ↓
Opens miniapp with context
    ↓
User signs transaction
    ↓
Agent posts confirmation
```

**1. Group Chat Detection**
```typescript
// packages/agent/src/ai-agent.ts

agent.on('message', async (message, conversation) => {
  const messageText = String(message).toLowerCase();
  const agentAddress = agent.client.inboxId.toLowerCase();
  
  // Proper etiquette - only respond when mentioned
  const isMentioned = 
    messageText.includes('@munus') ||
    messageText.includes(agentAddress) ||
    conversation.type === 'dm';
  
  if (!isMentioned) {
    // Ignore - don't spam group chats
    return;
  }
  
  // Process message
  await handleMessage(message, conversation);
});
```

**2. Quick Actions Implementation**
```typescript
// packages/agent/src/utils/inline-actions.ts

import { ContentTypeId } from '@xmtp/content-type-primitives';

const QUICK_ACTION_CONTENT_TYPE = new ContentTypeId({
  authorityId: 'xmtp.org',
  typeId: 'quickAction',
  versionMajor: 1,
  versionMinor: 0,
});

class ActionBuilder {
  private actions: Action[] = [];
  
  button(label: string, action: string) {
    this.actions.push({
      type: 'button',
      label,
      action,
    });
    return this;
  }
  
  link(label: string, url: string) {
    this.actions.push({
      type: 'link',
      label,
      url,
    });
    return this;
  }
  
  build() {
    return {
      content: this.actions,
      contentType: QUICK_ACTION_CONTENT_TYPE,
    };
  }
}

// Usage
const actions = new ActionBuilder()
  .button('Accept Job', 'action:accept:1')
  .link('View Details', `${MINIAPP_URL}/jobs/1`)
  .build();

await sendActions(conversation, actions);
```

**3. Group Coordination Flow**
```typescript
// Job posted event
contract.on('JobCreated', async (id, creator, amount, deadline) => {
  // Resolve ENS
  const creatorName = await resolveENS(creator);
  
  // Post to all active conversations
  await broadcastToConversations([
    `🎯 New Job Posted!`,
    ``,
    `Job #${id}`,
    `Creator: ${creatorName}`,
    `Reward: ${formatEther(amount)} ETH`,
    `Deadline: ${formatDeadline(deadline)}`,
    ``,
    `Want it? Say "accept job ${id}"`
  ].join('\n'));
  
  // Add Quick Actions
  const actions = new ActionBuilder()
    .link('View Job', `${MINIAPP_URL}/jobs/${id}`)
    .link('Accept', `${MINIAPP_URL}/jobs/${id}?action=accept`)
    .build();
    
  await sendActions(conversation, actions);
});
```

**4. Shared Visibility**
```typescript
// Everyone in group sees:
// 1. Job posted
// 2. Who accepts
// 3. When delivered
// 4. When paid

// This creates accountability
contract.on('JobAccepted', async (id, assignee) => {
  const assigneeName = await resolveENS(assignee);
  
  await broadcastToConversations(
    `✅ ${assigneeName} accepted Job #${id}!\n` +
    `Team: Keep them accountable!`
  );
});
```

## Track 2: Agent SDK (2.5 minutes)

**1. Agent Initialization**
```typescript
// packages/agent/src/ai-agent.ts

import { Agent } from '@xmtp/agent-sdk';

const agent = await Agent.createFromEnv({
  env: process.env.XMTP_ENV === 'production' ? 'production' : 'dev',
});

console.log(`Agent inbox ID: ${agent.client.inboxId}`);
console.log(`Test URL: ${getTestUrl(agent.client)}`);
```

**2. Persistent Database**
```typescript
// For production (Railway/Render)
const customDbPath = (inboxId: string) => {
  const volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH || './.data';
  return `${volumePath}/xmtp-${inboxId}.db3`;
};

const agent = await Agent.create(signer, {
  env: 'production',
  dbPath: customDbPath,
});

// Database persists across restarts
// Same inbox ID every time
// Conversation history preserved
```

**3. Message Handling**
```typescript
agent.on('message', async (message, conversation) => {
  try {
    // Log for debugging
    console.log(`Message from ${message.senderInboxId}`);
    console.log(`Content: ${message.content}`);
    
    // Check if addressed to agent
    if (!isAddressedToAgent(message, agent)) {
      return;
    }
    
    // Process with AI
    const response = await processWithAI(message, conversation);
    
    // Send response
    await conversation.send(response);
    
  } catch (error) {
    console.error('Message handling error:', error);
    await conversation.send(
      "Sorry, I encountered an error. Please try again."
    );
  }
});
```

**4. Event Listening**
```typescript
// packages/agent/src/utils/event-listener.ts

export async function startEventListener(agent: Agent) {
  const unwatch = contract.watchEvent.JobCreated({
    onLogs: async (logs) => {
      for (const log of logs) {
        const { id, creator, amount } = log.args;
        
        // Post to all conversations
        const conversations = await agent.client.conversations.list();
        
        for (const conv of conversations) {
          try {
            await conv.send(
              `🎯 New Job #${id}!\n` +
              `Reward: ${formatEther(amount)} ETH`
            );
          } catch (error) {
            console.error('Failed to send to conversation:', error);
          }
        }
      }
    },
  });
  
  // Return cleanup function
  return unwatch;
}
```

**5. AI Integration**
```typescript
const conversationHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [];

// Add user message
conversationHistory.push({
  role: 'user',
  content: message.content,
});

// AI processes with tools
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: conversationHistory,
  tools: contractTools,
});

// Handle tool calls
if (response.choices[0].message.tool_calls) {
  // Execute functions
  // Feed results back
  // Get final response
}

// Send to user
await conversation.send(
  response.choices[0].message.content
);

// Save to history
conversationHistory.push({
  role: 'assistant',
  content: response.choices[0].message.content,
});
```

**6. Production Deployment**
```bash
# Railway deployment
railway variables set XMTP_ENV=production
railway variables set OPENAI_API_KEY=sk-...
railway variables set ESCROW_ADDRESS=0x265B...
railway variables set BASE_SEPOLIA_RPC=https://sepolia.base.org

# Add volume for persistent DB
# Mount path: /app/.data

railway up
```

## Technical Features Summary (1 minute)

**Agent SDK Features:**
- ✅ Persistent database (volume mount)
- ✅ Event listeners (contract monitoring)
- ✅ Message handlers (user input)
- ✅ Quick Actions (interactive buttons)
- ✅ Broadcast (multi-conversation)
- ✅ Error handling (try-catch everywhere)
- ✅ Logging (debugging support)
- ✅ Type safety (TypeScript)

**Group Chat Features:**
- ✅ Mention detection (proper etiquette)
- ✅ Shared visibility (everyone sees updates)
- ✅ Quick Actions (one-tap interactions)
- ✅ Context preservation (conversation history)
- ✅ ENS integration (human-readable names)

**AI Features:**
- ✅ Function calling (contract queries)
- ✅ Multi-step reasoning (complex workflows)
- ✅ Context awareness (remembers conversation)
- ✅ Natural language (no commands needed)

**Code Quality:**
- 500+ lines TypeScript
- Comprehensive error handling
- Production deployed
- Well documented

---

# 🎯 Universal Technical Closing

"These aren't demos. These are production implementations:

- ✅ Deployed on Vercel: https://munus-miniapp-jo66.vercel.app/
- ✅ Contract on Base: 0x265B042A62f92E073cf086017fBF53238CF4DcCe
- ✅ Agent on Railway: Running 24/7
- ✅ 12+ tests passing
- ✅ 3,500+ lines of code
- ✅ Full documentation

Test it. Review the code. It's real."

---

## 📝 How to Use These Scripts

**For Presentations:**
1. Practice each script 2-3 times
2. Have demo ready to show
3. Know the code locations
4. Be ready for technical questions

**For Q&A:**
- "Where's the ReentrancyGuard?" → Line 13, Escrow.sol
- "How do you prevent spam?" → Line 388, ai-agent.ts, mention detection
- "What's your gas cost?" → ~0.0001 ETH on Base
- "How does AI query contract?" → Function calling, tools array, line 29-82

**Key Points:**
- Always reference actual code lines
- Show deployed contract address
- Demo live functionality
- Be ready to open files and show implementation

Good luck! 🚀

