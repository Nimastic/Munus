# Munus AI Agent

AI-powered XMTP agent for managing paid tasks on Base blockchain.

## Features

✅ **Real AI** - Powered by Vercel AI SDK + GPT-4o  
✅ **Function Calling** - AI can query the blockchain and provide real-time job data  
✅ **Natural Language** - Just talk to the agent naturally  
✅ **Quick Actions** - Interactive buttons for Base App  
✅ **Multi-Step Reasoning** - AI can perform complex workflows  
✅ **Contract Integration** - Reads from your Escrow contract on Base Sepolia  

---

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file:

```bash
# XMTP Configuration
XMTP_WALLET_KEY=0x... # Generated automatically if not provided
XMTP_DB_ENCRYPTION_KEY=0x... # Generated automatically if not provided
XMTP_ENV=dev # or 'production' for Base App

# AI Configuration (REQUIRED)
OPENAI_API_KEY=sk-... # Get from https://platform.openai.com

# Smart Contract (REQUIRED)
ESCROW_ADDRESS=0x... # Your deployed Escrow contract address
BASE_SEPOLIA_RPC=https://sepolia.base.org # or your own RPC

# Miniapp URL
MINIAPP_URL=https://munus.vercel.app # or your deployed miniapp URL
```

### 3. Get an OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Add it to your `.env` file as `OPENAI_API_KEY`

**Cost Estimate:** ~$5-20 for hackathon testing with GPT-4o

---

## Running the Agent

### Basic Agent (No AI)

```bash
pnpm dev
```

This runs the simple rule-based agent from `src/index.ts`.

### AI-Powered Agent (Recommended)

```bash
pnpm dev:ai
```

This runs the full AI agent from `src/ai-agent.ts` with:
- GPT-4o for natural language understanding
- Function calling to query blockchain
- Multi-step reasoning
- Quick Actions support

---

## Testing the Agent

### 1. Start the Agent

```bash
pnpm dev:ai
```

You'll see output like:

```
✅ AI Agent created successfully!
📬 Test your agent: https://xmtp.chat/dm/0x...
🤖 Agent inbox ID: ...
🌍 Environment: dev
🧠 AI Model: GPT-4o
🎯 Listening for messages...
```

### 2. Message the Agent

Go to **https://xmtp.chat** and:

1. Connect your wallet
2. Switch to **Dev environment** (Settings → Environment → Dev)
3. Start a conversation with your agent's address
4. Try these commands:

**Quick Start:**
```
/help
```

**Natural Language:**
```
Show me all open jobs
What jobs are available?
Tell me about job #0
What jobs have I created?
What jobs am I working on?
```

**The AI will:**
- Understand your intent
- Query the blockchain using its tools
- Provide real-time job data
- Guide you through the workflow

---

## How It Works

### Architecture

```
┌─────────────────────────────────────┐
│  User (XMTP Chat)                   │
│  - Natural language messages        │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  AI Agent (Vercel AI SDK + GPT-4o)  │
│  - Understands intent               │
│  - Decides which tools to use       │
│  - Multi-step reasoning             │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Tools (Function Calling)            │
│  - getOpenJobs()                    │
│  - getJobDetails(jobId)             │
│  - getMyJobs(address, type)         │
│  - getJobCount()                    │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Escrow Contract (Base Sepolia)     │
│  - Read job data                    │
│  - Check status                     │
└─────────────────────────────────────┘
```

### AI Tools

The agent has access to these blockchain query tools:

1. **`getOpenJobs()`** - Fetch all open jobs from the marketplace
2. **`getJobDetails(jobId)`** - Get detailed info about a specific job
3. **`getMyJobs(address, type)`** - Get jobs created or accepted by a user
4. **`getJobCount()`** - Get total number of jobs in the system

The AI decides when and how to use these tools based on the user's natural language input.

---

## Examples

### User asks: "What jobs are available?"

**AI Process:**
1. Understands intent: User wants to see open jobs
2. Calls `getOpenJobs()` tool
3. Receives job data from blockchain
4. Formats response in natural language

**AI Response:**
```
Here are the open jobs available:

**Job #0**
💰 Reward: 0.0100 ETH
⏰ Deadline: 1/19/2025, 12:00:00 PM
👤 Creator: 0x1234...5678

**Job #2**
💰 Reward: 0.0500 ETH
⏰ Deadline: 1/20/2025, 3:30:00 PM
👤 Creator: 0xabcd...ef01

You can accept any of these jobs through the miniapp!
```

### User asks: "Tell me about job 0"

**AI Process:**
1. Extracts job ID: 0
2. Calls `getJobDetails(0)` tool
3. Gets full job info from contract
4. Formats detailed response

---

## Quick Actions (Base App)

The agent can send interactive buttons:

```typescript
registerAction("view-jobs", async (ctx) => {
  // Fetch and display jobs
});

registerAction("my-jobs", async (ctx) => {
  // Show user's jobs
});

registerAction("create-job", async (ctx) => {
  // Guide user to miniapp
});
```

These show up as clickable buttons in Base App!

---

## Deploying to Production

### 1. Set Environment to Production

```bash
XMTP_ENV=production
```

### 2. Deploy to Railway/Render/Fly

See the [XMTP deployment guide](https://docs.xmtp.org/agents/deployment/deploy-agents) for details.

### 3. Keep Agent Running 24/7

Use a process manager or container orchestration.

---

## Cost & Performance

### OpenAI API Costs

- **GPT-4o**: ~$0.01 per message (input + output)
- **Hackathon estimate**: $5-20 total
- **Production**: Consider rate limiting and caching

### Optimization Tips

1. Use GPT-4o-mini for cheaper costs
2. Cache frequently requested job data
3. Add rate limiting per user
4. Use streaming for better UX

---

## Troubleshooting

### "OPENAI_API_KEY is required"

Add your OpenAI API key to `.env`:
```bash
OPENAI_API_KEY=sk-proj-...
```

### "Failed to fetch jobs"

Check that:
1. `ESCROW_ADDRESS` is set correctly
2. Contract is deployed to Base Sepolia
3. RPC URL is working

### Agent not responding

1. Check agent is running (`pnpm dev:ai`)
2. Verify you're in the correct XMTP environment (dev/production)
3. Check console logs for errors

---

## Next Steps

- [ ] Add more tools (accept job, deliver, release)
- [ ] Implement Quick Actions codec
- [ ] Add conversation memory
- [ ] Deploy to production
- [ ] Get a basename for the agent

---

## Resources

- [Vercel AI SDK](https://sdk.vercel.ai)
- [XMTP Docs](https://docs.xmtp.org/agents)
- [Base Docs](https://docs.base.org)
- [OpenAI API](https://platform.openai.com/docs)
