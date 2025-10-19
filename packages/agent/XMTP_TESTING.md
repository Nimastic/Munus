# Testing XMTP Agent Features

## Quick Test Guide

### 1. Start Your Agent

```bash
cd packages/agent
pnpm dev:ai
```

**You'll see:**
```
🚀 Starting Munus AI Agent...
✅ Agent created successfully!
📬 Test your agent: https://xmtp.chat/dm/0xAb8Ca7562922006F150fA9e203AA906E0b65fb67
🤖 Agent inbox ID: 0xAb8Ca7562922006F150fA9e203AA906E0b65fb67
🌍 Environment: dev
🎯 Listening for messages...
```

### 2. Test on xmtp.chat

#### A) Direct Message (DM) Test

1. Go to https://xmtp.chat
2. Connect your wallet
3. **Settings (gear icon) → Switch to "Dev" environment** ⚠️ Important!
4. Click "New Conversation"
5. Paste your agent's address (from console)
6. Send: `gm`

**Expected:**
```
Agent: ☀️ gm! Ready to help you manage jobs on Base! Try /help to get started.
```

#### B) Group Chat Test

1. Create a group on xmtp.chat
2. Add your agent's address
3. Send: `Hello everyone!` (without @mention)

**Expected:** Agent ignores (etiquette!)

4. Send: `@munus what jobs are available?`

**Expected:**
```
Agent: Here are the open jobs:

Job #0
💰 Reward: 0.0100 ETH
⏰ Deadline: January 20, 2025 at 10:00 AM
...
```

### 3. Test AI Function Calling

#### Query 1: List Jobs
```
You: What jobs are available?
```

**Behind the scenes:**
- XMTP receives message
- AI calls `getOpenJobs()` tool
- AI formats response
- XMTP sends response

#### Query 2: Specific Job
```
You: Tell me about job 0
```

**Behind the scenes:**
- AI calls `getJobDetails(0)` tool
- Returns structured data
- AI formats into natural language

#### Query 3: User's Jobs
```
You: Show me my jobs
```

**Behind the scenes:**
- AI extracts your address from context
- AI calls `getMyJobs(yourAddress)` tool
- AI filters and formats results

#### Query 4: Multi-step Reasoning
```
You: What's the highest paying job and when is it due?
```

**Behind the scenes:**
- Step 1: AI calls `getOpenJobs()`
- Step 2: AI processes results (finds max reward)
- Step 3: AI calls `getJobDetails(highestJobId)`
- Step 4: AI formats answer with both reward and deadline

### 4. Test Event Broadcasting

#### Create a Job in Miniapp

1. Go to http://localhost:3000
2. Login with Civic
3. Connect wallet (Base Sepolia)
4. Create job (0.01 ETH, 24h)
5. Submit transaction

**Watch Agent Console:**
```
📋 JobCreated: #0 by 0x...
📤 Sent to conversation: 0x1234...
📤 Sent to conversation: 0x5678...
```

**Watch xmtp.chat:**
```
Agent: 🎯 New Job Created!

Job #0
💰 Reward: 0.0100 ETH
⏰ Deadline: January 20, 2025
👤 Posted by: 0x...

Ready to work? Ask me "tell me about job 0" or open the miniapp!
```

### 5. Test Persistence

#### Test 1: Restart Agent
```bash
# Stop agent (Ctrl+C)
# Start again
pnpm dev:ai
```

**Expected:**
- Same agent address
- Same inbox ID
- Can still receive messages to same address

#### Test 2: Check Database
```bash
ls -la .data/
# Should see: xmtp-{inboxId}.db3
```

### 6. XMTP-Specific Features

#### Feature 1: Conversation Listing
```typescript
// In your code, you can list all conversations
const conversations = await agent.client.conversations.list();
console.log(`Agent is in ${conversations.length} conversations`);
```

#### Feature 2: Broadcast Message
```typescript
// Send to all conversations
for (const conv of conversations) {
  await conv.send("System announcement: New feature deployed!");
}
```

#### Feature 3: Get Conversation Members
```typescript
agent.on("text", async (ctx) => {
  if (ctx.conversation.isGroup) {
    const members = ctx.conversation.members;
    console.log(`Group has ${members.length} members`);
  }
});
```

## Common Issues

### Issue 1: "Agent doesn't respond"

**Check:**
1. Is agent running? (Check console for "Listening for messages...")
2. Are you in "Dev" environment on xmtp.chat?
3. Is address correct? (Copy from console, not from previous run)
4. In group: Did you @mention the agent?

### Issue 2: "New address every restart"

**Fix:**
```typescript
// Make sure dbPath is set (NOT null)
const agent = await Agent.create(signer, {
  env: "dev",
  dbPath: (inboxId) => `./.data/xmtp-${inboxId}.db3`, // ✅
  // dbPath: null, // ❌ Wrong!
});
```

### Issue 3: "AI doesn't work"

**Check:**
```bash
# Is OpenAI key set?
cat .env | grep OPENAI_API_KEY

# Should show:
# OPENAI_API_KEY=sk-proj-...
```

### Issue 4: "Contract queries fail"

**Check:**
```bash
# Is contract address set?
cat .env | grep ESCROW_ADDRESS

# Should show:
# ESCROW_ADDRESS=0x265B042A...
```

## Advanced Testing

### Test Quick Actions (If Implemented)

```
You: /help
```

**Expected:** Buttons appear (if Base App supports it in dev mode)

### Test with Multiple Users

1. Open two browsers
2. Connect different wallets to xmtp.chat
3. Both message the agent
4. Agent should respond to both independently

### Stress Test

Send 10 messages rapidly:
```
What jobs are available?
Tell me about job 0
What's the deadline for job 1?
How many jobs are there?
Show me my jobs
What's the highest paying job?
Who created job 2?
Is job 0 still open?
What jobs are closing soon?
List all jobs
```

**Agent should:**
- Respond to each within 5s
- Not crash
- Maintain context

## Monitoring

### Watch Agent Logs

```bash
# Agent logs show:
💬 Message from 0x... : what jobs are available?
  ↳ Responding (DM)
🔧 AI calling tool: getOpenJobs
✅ Tool result: 3 jobs found
📤 Sending response...
```

### Watch Network Activity

XMTP messages are encrypted, but you can see:
- Connection status
- Message count
- Conversation IDs

## Production Testing

### Switch to Production Environment

```bash
# In .env
XMTP_ENV=production
```

**Then test on:**
- Base App (mobile): https://www.base.org/app
- Converse (web): https://converse.xyz

**Note:** Production = different network, different address!

## Success Criteria

✅ Agent responds to DMs  
✅ Agent ignores non-mentioned group messages  
✅ Agent responds when @mentioned in groups  
✅ AI tools work (queries return data)  
✅ Event broadcasting works (receipts appear)  
✅ Agent keeps same address after restart  
✅ Multiple users can message simultaneously  

## Next Steps

After testing, you can:
1. Deploy to Railway (production)
2. Switch to production XMTP environment
3. Test in Base App (mobile)
4. Add more tools for AI to use
5. Implement Quick Actions codec

