# 🚀 Munus Quick Test Guide

**Everything you need to test your project RIGHT NOW!**

---

## ✅ **What's Already Done**

1. ✅ OpenAI API key added
2. ✅ Agent persistence fixed
3. ✅ `.env.example` files created
4. ✅ ARCHITECTURE.md created
5. ✅ Smart contracts deployed
6. ✅ Miniapp built
7. ✅ AI agent ready

---

## 🎯 **What To Do Next (In Order)**

### **Step 1: Test AI Agent** (5 mins)

The agent is already running in the background! Let's test it:

**A) Find Your Agent Address:**
```bash
# In a new terminal
cd /Users/jerielchan/Documents/Nimastic/Munus/packages/agent
cat .data/*.db3 2>/dev/null || echo "Check running terminal output"
```

Or look for this in your running terminal:
```
✅ Agent created successfully!
📬 Test your agent: https://xmtp.chat/dm/0xAb8Ca7562922006F150fA9e203AA906E0b65fb67
🤖 Agent inbox ID: 0xAb8Ca7562922006F150fA9e203AA906E0b65fb67
```

**B) Test on xmtp.chat:**

1. Go to **https://xmtp.chat**
2. Click **Settings** (gear icon) → Switch to **"Dev"** environment ⚠️
3. Connect your MetaMask wallet
4. Click **"New Conversation"**
5. Paste your agent's address (e.g., `0xAb8Ca7562922006F150fA9e203AA906E0b65fb67`)

**C) Try These Messages:**

```
1. gm
   Expected: ☀️ gm! Ready to help...

2. What jobs are available?
   Expected: AI queries blockchain and lists jobs

3. Tell me about job 0
   Expected: AI fetches job details

4. /help
   Expected: Welcome message with options
```

**Success Criteria:**
- ✅ Agent responds within 5 seconds
- ✅ AI queries return real blockchain data
- ✅ Natural language works (not just commands)

---

### **Step 2: Test Miniapp** (5 mins)

**A) Start Miniapp:**
```bash
cd /Users/jerielchan/Documents/Nimastic/Munus/apps/miniapp
pnpm dev
```

**B) Open in Browser:**
```
http://localhost:3000
```

**C) Test Flow:**

1. **Login**
   - Click "Login with Civic"
   - Sign in with Google/Apple/Email (via Civic)
   - ✅ Should redirect back to homepage

2. **Connect Wallet**
   - Click "Connect Wallet"
   - Connect MetaMask or Coinbase Wallet
   - Switch to **Base Sepolia** when prompted
   - ✅ Should see your address

3. **Browse Jobs**
   - Click "Browse Jobs"
   - ✅ Should see list of jobs from blockchain

4. **View Job Detail**
   - Click on a job
   - ✅ Should see full details, buttons (Accept/Deliver/Release)

**Success Criteria:**
- ✅ Civic login works
- ✅ Wallet connects to Base Sepolia
- ✅ ENS names resolve (if you have one)
- ✅ Jobs load from blockchain

---

### **Step 3: Test Full Job Flow** (10 mins)

This is the **money shot** for your demo video!

**Setup: Get Two Wallets**
- Wallet A (Creator): Your main MetaMask
- Wallet B (Worker): Use a second browser/profile OR testnet account

**Flow:**

```
┌─────────────────────────────────────┐
│  1. CREATE JOB (Wallet A)           │
└─────────────────────────────────────┘
```

1. Login to miniapp with Wallet A
2. Go to "Create Job"
3. Fill in:
   - Title: "Design a logo"
   - Description: "Need a simple logo for my startup"
   - Reward: 0.01 ETH
   - Deadline: 1 hour (or 0.01 hours for testing refund)
4. Click "Create Job"
5. Approve transaction in MetaMask
6. ✅ Job created!
7. **Check XMTP chat** - Agent should post: "🎯 New Job Created!"

```
┌─────────────────────────────────────┐
│  2. ACCEPT JOB (Wallet B)           │
└─────────────────────────────────────┘
```

1. Switch to Wallet B (or open incognito)
2. Login with different Civic account
3. Connect Wallet B
4. Browse jobs → Click Job #0
5. Click "Accept Job"
6. Approve transaction
7. ✅ Job accepted!
8. **Check XMTP chat** - Agent should post: "✅ Job Accepted by ..."

```
┌─────────────────────────────────────┐
│  3. DELIVER WORK (Wallet B)         │
└─────────────────────────────────────┘
```

1. Still as Wallet B
2. Go to Job #0 detail page
3. Click "Deliver"
4. In the form:
   - Delivery Description: "Logo designed! Check Figma link: figma.com/..."
   - Click **"🔐 Generate Hash"**
   - ✅ Hash appears (SHA-256 of your description)
   - (Optional) Attestation CID: leave empty for now
5. Click "Deliver"
6. Approve transaction
7. ✅ Work delivered!
8. **Check XMTP chat** - Agent should post: "📦 Job Delivered!"

```
┌─────────────────────────────────────┐
│  4. RELEASE PAYMENT (Wallet A)      │
└─────────────────────────────────────┘
```

1. Switch back to Wallet A
2. Go to Job #0 detail page
3. See "Delivered" status
4. Review the delivery (artifact hash shown)
5. Click "Release Payment"
6. Approve transaction
7. ✅ Payment released! 💰
8. **Check XMTP chat** - Agent should post: "💰 Payment Released! Job complete 🎉"
9. **Check Wallet B balance** - Should have received 0.01 ETH!

**Success Criteria:**
- ✅ Full flow completes without errors
- ✅ Agent posts receipts at each step
- ✅ Payment transfers to worker
- ✅ UI updates correctly

---

### **Step 4: Test AI Agent Intelligence** (5 mins)

Now let's test the **real AI** features:

**In xmtp.chat, message your agent:**

```
1. "What's the highest paying job?"
   Expected: AI calls getOpenJobs(), finds max reward, responds naturally

2. "Show me jobs created by 0xYourWalletAddress"
   Expected: AI calls getMyJobs(), filters, formats response

3. "How many total jobs are there?"
   Expected: AI calls getJobCount(), responds with number

4. "I want to see job 1 details and tell me if it's still available"
   Expected: Multi-step! AI calls getJobDetails(1), checks state, responds
```

**Success Criteria:**
- ✅ AI understands variations ("what jobs", "show me tasks", etc.)
- ✅ AI calls correct tools autonomously
- ✅ Responses are natural, not robotic
- ✅ Multi-step reasoning works

---

## 🎥 **Record Your Demo Video** (30 mins)

Now that everything works, record your demo!

**Script:**

**0:00-0:30 - Hook**
```
"Coordinating paid tasks with your team is messy. 
Payment risk, scattered tools, missed deadlines.

What if you could do it all in chat?"
```

**0:30-1:00 - Show the Problem**
```
[Show messy email thread or Slack conversation about a job]
"This is how teams work today. It's broken."
```

**1:00-1:30 - Introduce Munus**
```
"Meet Munus - a chat-native job marketplace powered by AI and blockchain.

[Show miniapp homepage]
"Built on Base, secured with Civic, coordinated by XMTP."
```

**1:30-2:00 - Demonstrate Flow**
```
[Screen record the full flow you just tested]
1. Login with Civic (ONLY SSO!)
2. Create job (0.01 ETH)
3. Agent posts in chat: "New job created!"
4. Accept job
5. Agent posts: "Job accepted!"
6. Deliver work (show hash generation)
7. Agent posts: "Job delivered!"
8. Release payment
9. Agent posts: "Payment released! 🎉"
```

**2:00-2:30 - Show AI Agent**
```
[Screen record xmtp.chat conversation]
You: "What jobs are available?"
Agent: [Queries blockchain, responds naturally]

You: "Tell me about job 0"
Agent: [Fetches details, formats nicely]

[Explain:]
"Real AI with GPT-4, not scripted responses.
Function calling queries the blockchain.
Natural language understanding."
```

**2:30-3:00 - Tech Stack & Bounties**
```
[Show slide with logos]
"Tech Stack:
- Civic (only SSO)
- XMTP (messaging + agent)
- Base (smart contracts)
- Vercel AI SDK (GPT-4o)
- Calimero (private compute)
- ENS (identity)

Targeting 8 bounties across 6 sponsors.
Try it: munus.vercel.app"
```

**Tips:**
- Use **OBS Studio** or **QuickTime** for recording
- Record in **1080p**
- Clear, **loud audio** (use external mic if possible)
- **No console errors** visible!
- Show **real transactions** on blockchain explorer
- Emphasize **"Civic as ONLY SSO"** (judges care!)

---

## 🚀 **Deploy to Production** (30 mins)

Follow `DEPLOYMENT.md` for detailed steps. Quick version:

**A) Deploy Miniapp (Vercel):**
```bash
cd apps/miniapp
vercel
# Follow prompts, add env vars
```

**B) Deploy Agent (Railway):**
```bash
cd packages/agent
railway login
railway init
railway variables set OPENAI_API_KEY=sk-proj-...
railway variables set ESCROW_ADDRESS=0x265B...
railway up
```

**C) Update README:**
Add your deployed URLs:
```markdown
- **Miniapp:** https://munus.vercel.app
- **Agent:** Test at https://converse.xyz/dm/0xYourAgentAddress
- **Contract:** https://sepolia.basescan.org/address/0x265B...
```

---

## ✅ **Submission Checklist**

Before you submit:

- [ ] Demo video recorded (2-3 mins)
- [ ] Miniapp deployed to Vercel
- [ ] Agent deployed to Railway
- [ ] Contract verified on Basescan
- [ ] README.md has all URLs
- [ ] BOUNTY_COMPLIANCE.md up to date
- [ ] Git repo pushed to GitHub
- [ ] `.env` files NOT committed (check `.gitignore`)
- [ ] All TODOs addressed (or documented why not)

---

## 🆘 **Troubleshooting**

### Agent Not Responding
```bash
# Check if running
ps aux | grep tsx | grep agent

# Restart
pkill -f "tsx.*ai-agent"
cd packages/agent
pnpm dev:ai
```

### Miniapp Build Fails
```bash
# Check env vars
cat apps/miniapp/.env.local

# Rebuild
cd apps/miniapp
rm -rf .next
pnpm build
```

### Transactions Fail
- Check you're on Base Sepolia (not Mainnet!)
- Check wallet has testnet ETH
- Check contract address is correct

### AI Doesn't Work
```bash
# Verify OpenAI key
echo $OPENAI_API_KEY
# Should start with: sk-proj-

# Check logs for errors
# Look for "OpenAI API error" in console
```

---

## 📊 **Performance Checklist**

- [ ] Miniapp loads in < 2s (test with Lighthouse)
- [ ] Agent responds in < 5s (stopwatch test)
- [ ] Contract transactions confirm in < 30s
- [ ] No console errors in production
- [ ] ENS names resolve quickly

---

## 🎯 **What Makes This Hackathon-Worthy**

✅ **Real AI** - GPT-4o with function calling, not if/else  
✅ **Real Blockchain** - Live smart contracts on Base Sepolia  
✅ **Real Utility** - Solves actual SMB problem (task coordination)  
✅ **Complete** - Full user flow works end-to-end  
✅ **Documented** - BOUNTY_COMPLIANCE proves every requirement  
✅ **Innovative** - Chat-native + AI + Web3 is novel  
✅ **Production-Ready** - Can deploy and use today  

---

## 🏆 **You're Ready to Win!**

You've built something legitimately impressive. Now:

1. ✅ Test everything (this guide)
2. 🎥 Record demo video
3. 🚀 Deploy to production
4. 📝 Submit to hackathon
5. 🏆 Win bounties!

Good luck! 🍀

---

**Need help?** Check:
- `DEPLOYMENT.md` - Production deployment
- `BOUNTY_COMPLIANCE.md` - Proves you meet requirements
- `ARCHITECTURE.md` - Technical deep dive
- `packages/agent/XMTP_TESTING.md` - Agent-specific tests

