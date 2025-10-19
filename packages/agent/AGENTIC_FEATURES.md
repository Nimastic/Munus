# Agentic Features in Munus

## 1. Transaction Signing & XMTP

### ❓ Can XMTP Trigger Wallet Popups?

**Answer:** It depends on the client, but generally **deep links** are the most reliable approach.

| Client | Wallet Support | How It Works |
|--------|----------------|--------------|
| **xmtp.chat** | ❌ No direct wallet | Agent sends deep link → Opens miniapp → Wallet popup |
| **Base App** | ✅ Built-in wallet | Agent could trigger in-app transaction (with XMTP Frames) |
| **Custom Apps** | ✅ Possible | Embed wallet provider alongside XMTP |

### Current Implementation (✅ Working)

```
User: "I want to accept job 1"
  ↓
AI Agent: [Verifies job availability on blockchain]
  ↓
AI Agent: "✅ Ready to accept! Click here: https://munus.vercel.app/jobs/1?action=accept"
  ↓
User: [Clicks link → Miniapp opens → Wallet popup → Signs]
  ↓
AI Agent: "✅ Job #1 accepted! You're assigned!"
```

**Why this is agentic:**
- AI understands intent from natural language
- AI autonomously validates job state
- AI generates transaction details
- AI orchestrates the complete workflow
- User just expresses what they want - AI handles the rest

### Future: XMTP Transaction Frames

**Coming soon** to XMTP Agent SDK:

```typescript
// Agent can send embedded transaction frames
agent.sendFrame({
  type: 'transaction',
  action: {
    contract: ESCROW_ADDRESS,
    method: 'accept',
    args: [jobId],
  },
  button: 'Accept Job #1 (0.01 ETH)'
});

// User clicks → Wallet popup IN CHAT → No miniapp needed!
```

This would enable **fully chat-native transactions** like Farcaster Frames.

---

## 2. Job Descriptions (✅ Implemented)

### Problem

Jobs were showing without descriptions, making it hard to understand what work is required.

### Solution

Added **automatic IPFS fetching** for job metadata:

```typescript
// When listing jobs, agent now fetches descriptions from IPFS
const jobs = await getOpenJobs();
for (const { id, job } of jobs) {
  const metadata = await fetchJobMetadata(job.metadataCID);
  // Returns: { title, description, requirements, skills }
}
```

### What You See Now

**Before:**
```
📋 Open Jobs:

Job #1
💰 0.0100 ETH
⏰ October 20, 2025, 8:11:52 AM
```

**After:**
```
📋 Open Jobs:

Design Landing Page for DeFi Protocol
📝 Create a modern, responsive landing page with Web3 wallet 
    integration. Must include hero section, features, and...
💰 0.0100 ETH
⏰ October 20, 2025, 8:11:52 AM
```

### Features

1. **Automatic Fetching**: All job queries now include descriptions
2. **Smart Truncation**: Short descriptions (100 chars) in lists, full descriptions in details
3. **Fallback**: If IPFS fails, shows "No description available"
4. **Multiple Gateways**: Tries 3 IPFS gateways for reliability

### Supported Tools

| Tool | Returns Descriptions? |
|------|----------------------|
| `getOpenJobs` | ✅ Yes (short) |
| `getJobDetails` | ✅ Yes (full + requirements + skills) |
| `findJobsByIntent` | ✅ Yes (short + searchable by keywords) |
| `acceptJob` | ✅ Yes (full details before signing) |

---

## 3. Intent-Based Job Discovery (✅ Implemented)

### Agentic Feature: Understanding High-Level Intent

Users can express what they want in natural language, and the AI autonomously finds matching jobs:

```
User: "Show me all design jobs under 0.02 ETH due next week"
  ↓
AI: [Calls findJobsByIntent with filters]
    [Searches descriptions for "design"]
    [Filters by amount < 0.02 ETH]
    [Filters by deadline < next week]
  ↓
AI: "Found 2 matching jobs:

    1. Design Landing Page - 0.0100 ETH
       📝 Create a modern landing page...
    
    2. UI/UX for Mobile App - 0.0150 ETH
       📝 Design intuitive interface for...
    
    Want me to help you accept any of these?"
```

### Why This is Agentic

❌ **Traditional approach:**
- User navigates UI filters
- Manually sets price range
- Manually sets date range
- Manually searches keywords
- Scans through results

✅ **Munus AI approach:**
- User states intent in one sentence
- AI interprets parameters
- AI searches blockchain
- AI filters results
- AI presents curated matches
- AI offers next steps

---

## 4. Making It Even More Agentic

### Option A: Session Keys (Recommended for Hackathon)

**Concept**: User signs ONCE to grant agent temporary permissions

```typescript
// User approves session (once)
User: "Let me accept jobs autonomously for 24 hours"
Agent: "Creating session... Please sign"
  ↓
[User signs session approval]
  ↓
Agent: "✅ Session active! I can now accept jobs on your behalf for 24h"

// Later, fully autonomous
User: "Accept all design jobs under 0.01 ETH"
Agent: [Scans blockchain]
      [Finds 3 matching jobs]
      [AUTOMATICALLY accepts all 3 - no wallet popups!]
      "✅ Accepted 3 jobs for you totaling 0.025 ETH!"
```

**Implementation**: See `SessionManager.sol` contract

### Option B: Predictive Actions

**Concept**: AI learns preferences and suggests actions

```
User: [Just joined chat]
Agent: "gm! I found 2 new jobs matching your previous interests:
       • Design job (0.01 ETH) - Similar to jobs you've done
       • Web3 integration (0.02 ETH) - You accepted similar yesterday
       
       Want me to accept them?"
```

### Option C: Negotiation Agent

**Concept**: AI negotiates in group chats

```
[Group chat with job creator]
Worker: "Can I accept this but need 2 days extension?"
Agent: [Mediates]
       "Creator is offering 1 day extension with 0.005 ETH bonus.
       Accept modified terms?"
Worker: "Yes"
Agent: [Updates contract]
```

---

## Summary: What Makes Munus Agentic?

### ✅ We Have:

1. **Natural Language Understanding**: "I want that job" → AI knows what to do
2. **Autonomous Validation**: AI checks job state, availability, deadlines
3. **Workflow Orchestration**: AI guides multi-step processes
4. **Proactive Communication**: AI broadcasts updates to relevant parties
5. **Intent-Based Search**: AI interprets complex queries ("design jobs under 0.01 ETH")
6. **Context Awareness**: AI tracks conversation history and user preferences

### ⚡ Quick Wins for Demo:

1. **Show natural language → action**: "I'll take it" → Transaction link
2. **Show autonomous filtering**: "cheap jobs due soon" → Curated results
3. **Show proactive updates**: Contract events → AI broadcasts to chat
4. **Compare to traditional**: Show clicking through miniapp UI vs. just asking AI

### 🎯 Hackathon Pitch:

**Traditional job marketplaces:**
- 10+ clicks to find, filter, and accept a job
- Must understand UI, menus, forms
- Manual searching and filtering

**Munus with AI Agent:**
- One message: "Find me a design job"
- AI understands, searches, filters, presents
- Accept with "I'll take it"
- 0 UI knowledge needed - just chat!

**That's the power of agentic AI in Web3.** 🚀

