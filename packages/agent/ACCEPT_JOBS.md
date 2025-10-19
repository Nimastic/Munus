# Accept Jobs via Chat - Agentic Flow

## Overview

Users can accept jobs entirely through XMTP chat using AI-guided transactions. This creates a seamless, chat-native experience.

## How It Works

### 1. User Expresses Intent

```
User: "I want to accept job 1"
User: "Can I take job 0?"
User: "Accept the design job"
```

### 2. AI Understands & Acts

The AI agent:
1. Calls `acceptJob(jobId, userAddress)` tool
2. Verifies job is available (Open state, no assignee)
3. Fetches job details from blockchain
4. Returns structured response with transaction link

### 3. Agent Guides User

```
Agent: "✅ Ready to Accept Job #1!

💰 Amount: 0.0100 ETH
⏰ Deadline: October 20, 2025, 8:11:52 AM
👤 Posted by: 0x8955...15aE

Click here to sign and accept:
https://munus.vercel.app/jobs/1?action=accept

The transaction will assign you as the worker and you can start immediately!"
```

### 4. User Signs Transaction

User clicks the link → Miniapp opens → Transaction pre-filled → Sign with wallet

### 5. Confirmation

Once confirmed on-chain, the AI agent broadcasts:
```
"✅ Job #1 Accepted by 0x1eb1...f735! The work has begun! 🚀"
```

## Technical Implementation

### Agent Side (`ai-agent.ts`)

```typescript
{
  type: "function",
  function: {
    name: "acceptJob",
    description: "Guide user to accept a job",
    parameters: {
      jobId: { type: "number" },
      userAddress: { type: "string" }
    }
  }
}
```

**Tool Handler:**
```typescript
case "acceptJob":
  const job = await escrow.getJob(args.jobId);
  
  // Validate job state
  if (job.state !== 0) return { error: "Not available" };
  if (job.assignee !== '0x0000...') return { error: "Already assigned" };
  
  // Return transaction details + link
  return {
    success: true,
    jobId, amount, deadline,
    miniappLink: `${MINIAPP_URL}/jobs/${jobId}?action=accept`
  };
```

### Miniapp Side

**Job Detail Page** (`packages/miniapp/app/jobs/[id]/page.tsx`):
```typescript
// Check for action=accept query param
const searchParams = useSearchParams();
const action = searchParams.get('action');

useEffect(() => {
  if (action === 'accept' && job.state === 'Open') {
    // Auto-open accept dialog
    setShowAcceptDialog(true);
  }
}, [action, job]);
```

## Why This Is Better Than Embedded Chat

### Option A: Transaction in Chat (Current ✅)
- **Pros:**
  - User stays in XMTP - chat-native experience
  - AI orchestrates entire workflow
  - Minimal context switching
  - Very agentic - AI is the interface
- **Cons:**
  - Requires one click to miniapp for signing

### Option B: Embed XMTP in Miniapp
- **Pros:**
  - Everything in one app
- **Cons:**
  - Just a chat widget in a webapp
  - Not truly "chat-native"
  - Less innovative
  - AI becomes a sidebar, not the main interface

## For Hackathon Judging

**"Why is this agentic?"**

1. **AI as Primary Interface**: Users express intent in natural language ("I want that job"), AI understands context
2. **Autonomous Decision-Making**: AI checks job availability, validates state, fetches blockchain data
3. **Workflow Orchestration**: AI guides multi-step process (check → validate → link → confirm)
4. **Proactive Communication**: AI broadcasts job acceptances to relevant parties
5. **Zero UI Required**: Users never need to navigate menus or forms - just chat

**Comparison:**
- ❌ Traditional: Browse UI → Find job → Click accept → Connect wallet → Sign
- ✅ Munus: "Accept job 1" → AI verifies → Click link → Sign ✨

## Example Conversation

```
User: gm

Agent: ☀️ gm! Ready to help you manage jobs on Base!

User: what jobs are available?

Agent: 📋 Open Jobs:

**Job #1**
💰 Amount: 0.0100 ETH
⏰ Deadline: October 20, 2025, 8:11:52 AM

User: tell me more about job 1

Agent: **Job #1 Details:**

• Creator: 0x8955...15aE
• Amount: 0.0100 ETH
• Deadline: Oct 20, 2025
• State: Open ✅
• Description: [CID: bafk...]

This job is available to accept!

User: ok i'll take it

Agent: ✅ Ready to Accept Job #1!

💰 You'll earn: 0.0100 ETH
⏰ Complete by: October 20, 2025, 8:11:52 AM

👉 Click to sign and accept:
https://munus.vercel.app/jobs/1?action=accept

Once you sign:
• You'll be assigned as the worker
• Funds are held in escrow
• Complete & deliver to get paid!

[User clicks link, signs transaction]

Agent: ✅ Job #1 Accepted by you! The work has begun! 🚀
```

## Future Enhancements

1. **XMTP Frames**: When XMTP Agent SDK supports full frames, embed transaction button directly in chat
2. **Group Negotiations**: AI mediates price negotiations in group chats
3. **Milestone Tracking**: AI checks in on progress, reminds about deadlines
4. **Payment Triggers**: AI suggests releasing payment when deliverables are submitted

---

**Status:** ✅ Implemented
**Demo Video:** [Link to demo]
**Live Agent:** [XMTP test URL]

