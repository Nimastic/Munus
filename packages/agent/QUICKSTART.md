# 🚀 AI Agent Quick Start

## What You Just Built

**A REAL AI agent** that:
- ✅ Uses GPT-4o to understand natural language
- ✅ Has function calling to query your Escrow contract
- ✅ Can browse jobs, check status, and guide users
- ✅ Responds to "gm" and other fun commands
- ✅ Works with XMTP chat (Base App compatible)
- ✅ Has Quick Actions (interactive buttons)

---

## Setup (2 Minutes)

### 1. Get an OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-...`)

### 2. Add API Key to `.env`

Open `/packages/agent/.env` and replace:

```bash
OPENAI_API_KEY=sk-YOUR_API_KEY_HERE
```

With your actual key:

```bash
OPENAI_API_KEY=sk-proj-abc123...
```

### 3. Run the AI Agent

```bash
cd /Users/jerielchan/Documents/Nimastic/Munus/packages/agent
pnpm dev:ai
```

You should see:

```
✅ AI Agent created successfully!
📬 Test your agent: https://xmtp.chat/dm/0x...
🤖 Agent inbox ID: ...
🌍 Environment: dev
🧠 AI Model: GPT-4o
🎯 Listening for messages...
```

---

## Testing

### 1. Open xmtp.chat

Go to **https://xmtp.chat** and:
- Connect your wallet
- Switch to **Dev** environment (⚙️ Settings → Environment → Dev)
- Start a new conversation with your agent's address (from console output)

### 2. Try These Messages

**Fun Stuff:**
```
gm
hello
/gm
```

**Natural Language (AI-powered):**
```
What jobs are available?
Show me all open jobs
Tell me about job 0
What jobs have I created?
```

**Commands:**
```
/help
/start
```

**The AI will:**
- Understand what you're asking
- Query the blockchain automatically
- Give you real job data
- Guide you through the workflow

---

## How the AI Works

When you say: **"What jobs are available?"**

1. AI understands: User wants to see open jobs
2. AI calls `getOpenJobs()` tool
3. Tool queries your Escrow contract on Base Sepolia
4. AI formats the response naturally

**Example Response:**
```
Here are the open jobs available:

**Job #0**
💰 Reward: 0.0100 ETH
⏰ Deadline: 1/19/2025, 12:00:00 PM

**Job #2**
💰 Reward: 0.0500 ETH
⏰ Deadline: 1/20/2025, 3:30:00 PM

You can accept any of these through the miniapp!
```

---

## What Makes This "Agentic"?

🧠 **AI decides what to do** - Not hardcoded if/else  
🔧 **Function calling** - AI can use tools (blockchain queries)  
🎯 **Multi-step reasoning** - Can combine multiple tools  
💬 **Natural language** - Just talk normally  
🤖 **Autonomous** - Runs 24/7, handles conversations  

---

## Cost

**OpenAI API:**
- GPT-4o: ~$0.01 per message
- Hackathon testing: ~$5-20 total
- You can switch to `gpt-4o-mini` for cheaper (change in `ai-agent.ts`)

---

## Features

### Available AI Tools

1. **`getOpenJobs()`** - Browse marketplace
2. **`getJobDetails(jobId)`** - Check specific job
3. **`getMyJobs(address, type)`** - Your created/working jobs
4. **`getJobCount()`** - Total jobs in system

### Fun Commands

- `gm` → Morning greeting
- `gn` → Night greeting
- `hello` / `hi` → Friendly responses
- `/gm` → Builder vibes
- `/help` → Quick Actions menu

### Quick Actions

Interactive buttons that show up in Base App:
- 📋 View Open Jobs
- 👤 My Jobs
- ➕ Create Job

---

## Troubleshooting

### "OPENAI_API_KEY is required"

You forgot to add your API key! Edit `.env`:

```bash
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY
```

### Agent not responding

1. Is it running? Check terminal
2. Correct environment? (dev vs production)
3. Right address? Copy from console output

### "Failed to fetch jobs"

Check that:
- Escrow contract is deployed
- `ESCROW_ADDRESS` in `.env` is correct
- At least one job exists (create one in miniapp)

---

## Next Steps

### Deploy to Production

1. Change `.env`:
   ```bash
   XMTP_ENV=production
   MINIAPP_URL=https://your-vercel-app.vercel.app
   ```

2. Deploy to Railway/Render:
   - Set all env vars
   - Run `pnpm start:ai`
   - Keep it running 24/7

### Get Featured in Base App

1. Get a basename for your agent (e.g., `munus.base.eth`)
2. Submit to Base App for review
3. Users can message you directly in Base App!

---

## Files

- `src/ai-agent.ts` - Main AI agent (USE THIS)
- `src/index.ts` - Simple agent (no AI)
- `src/utils/escrow.ts` - Contract queries
- `src/utils/inline-actions.ts` - Quick Actions
- `.env` - Configuration (ADD YOUR API KEY HERE!)

---

## Resources

- [Vercel AI SDK Docs](https://sdk.vercel.ai)
- [XMTP Docs](https://docs.xmtp.org/agents)
- [Base App Docs](https://docs.base.org/base-app/agents/chat-agents)
- [OpenAI Platform](https://platform.openai.com)

---

**That's it! You now have a REAL AI agent!** 🎉

Message me `gm` to get started! ☀️

