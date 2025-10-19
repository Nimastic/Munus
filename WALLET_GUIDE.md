# 🔐 Your Wallet Address Guide

## ✅ **Your Address: `0x4748...354E` is REAL!**

This is your **actual** MetaMask/Coinbase Wallet address. Not fake, not simulated!

---

## 📋 **How to Get Your Full Address**

### **Method 1: Click the Copy Button** (NEW! ✨)
- Look for the small copy icon (📋) next to `0x4748...354E`
- Click it
- Full address copied to clipboard!
- Paste anywhere to see: `0x4748xxxxxxxxxxxxxxxxxxxx354E`

### **Method 2: MetaMask Extension**
1. Click MetaMask icon in browser
2. Your address is at the top
3. Click to copy

### **Method 3: Browser Console**
1. Press F12 (DevTools)
2. Console tab
3. Type: `window.ethereum.selectedAddress`
4. Press Enter

---

## 🧪 **How to Test Your Wallet Works**

### **Test 1: Check Balance**
```bash
# In browser console (F12 → Console)
ethereum.request({ method: 'eth_getBalance', params: [ethereum.selectedAddress, 'latest'] })
```

You'll see your balance in Wei (1 ETH = 10^18 Wei)

### **Test 2: Sign a Message**
```bash
# In browser console
ethereum.request({
  method: 'personal_sign',
  params: ['Hello Munus!', ethereum.selectedAddress]
})
```

MetaMask will pop up asking you to sign. Click "Sign" to test!

### **Test 3: Check Network**
```bash
# In browser console
ethereum.request({ method: 'eth_chainId' })
```

Should return: `"0x14a34"` (Base Sepolia = 84532 in hex)

---

## 💰 **Get Test ETH**

Your wallet needs Base Sepolia ETH to:
- Create jobs
- Accept jobs
- Pay gas fees

### **Free Faucets:**

1. **Coinbase Base Faucet** (BEST)
   - https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
   - Requires Coinbase account
   - Gives 0.05 ETH instantly

2. **Alchemy Base Sepolia Faucet**
   - https://www.alchemy.com/faucets/base-sepolia
   - Free, no account needed
   - Gives 0.1 ETH

3. **Bridge from Sepolia**
   - Get Sepolia ETH from https://sepoliafaucet.com/
   - Bridge to Base Sepolia: https://bridge.base.org/

---

## 🎯 **Your Full Setup**

```
┌─────────────────────────────────────────┐
│          What You Have Now              │
├─────────────────────────────────────────┤
│                                         │
│  ✅ Civic Account (logged in)          │
│     └─ Email: your-email@gmail.com     │
│                                         │
│  ✅ Wallet Connected                   │
│     ├─ Address: 0x4748...354E          │
│     ├─ Network: Base Sepolia (84532)   │
│     └─ Balance: 0 ETH (need faucet!)   │
│                                         │
│  ⏳ Next: Get test ETH from faucet     │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔍 **View Your Address on Explorer**

Copy your full address, then paste it here:

**Base Sepolia Explorer:**
- https://sepolia.basescan.org/address/YOUR_ADDRESS

You'll see:
- Your ETH balance
- Transaction history
- Contracts you've interacted with

---

## 🚀 **Test the Full Flow**

Once you have test ETH:

### **1. Create a Job**
1. Click "Create Job"
2. Enter:
   - Description: "Test job"
   - Amount: 0.001 ETH
   - Deadline: 1 hour
3. Click "Create" → MetaMask pops up
4. Approve transaction
5. Wait ~2 seconds for confirmation

### **2. View on Explorer**
1. Copy your address
2. Go to: https://sepolia.basescan.org/address/YOUR_ADDRESS
3. See your transaction!

### **3. Browse Jobs**
1. Click "Browse Jobs"
2. See your created job
3. Copy the escrow contract address
4. View it on BaseScan

---

## 🔐 **Security Notes**

### **Your Wallet is:**
- ✅ **Non-custodial** - You control it
- ✅ **Yours** - Real Ethereum address
- ✅ **Testnet** - Not real money (Base Sepolia)
- ✅ **Safe** - Only you have private key

### **Never Share:**
- ❌ Private key (12/24 word phrase)
- ❌ Seed phrase
- ❌ MetaMask password

### **Safe to Share:**
- ✅ Public address (0x4748...354E)
- ✅ Transaction hashes
- ✅ Contract addresses

---

## 📊 **What's This Address Used For?**

| Action | What Happens |
|--------|--------------|
| **Create Job** | Your address becomes `creator` in contract |
| **Accept Job** | Your address becomes `assignee` in contract |
| **Pay** | ETH transfers FROM your address |
| **Receive** | ETH transfers TO your address |
| **Sign** | MetaMask proves you own this address |

---

## 🎓 **Understanding Your Address**

```
0x4748xxxxxxxxxxxxxxxxxxxxxxxxxxxx354E
│  │                              │
│  └─ First 4 characters           └─ Last 4 characters
│
└─ "0x" means hexadecimal (Ethereum format)

Full: 42 characters (0x + 40 hex digits)
Represents: Your public key (mathematically linked to your private key)
```

---

## 🆘 **Troubleshooting**

### **"Insufficient funds" error**
**Fix:** Get test ETH from faucet (see above)

### **"Wrong network" error**
**Fix:** 
1. Open MetaMask
2. Click network dropdown
3. Select "Base Sepolia"
4. Refresh page

### **"Transaction failed"**
**Fix:**
1. Check you have enough ETH for gas
2. Check deadline isn't in the past
3. Try increasing gas limit

### **Can't see my address**
**Fix:**
1. Refresh page
2. Click the copy button next to `0x4748...354E`
3. Paste in notepad to see full address

---

## ✅ **You're Ready!**

Your wallet is:
- ✅ Real Ethereum address
- ✅ Connected to Munus
- ✅ On Base Sepolia testnet
- ⏳ Needs test ETH (use faucet!)

**Next step:** Get 0.05 ETH from the Coinbase faucet and create your first job! 🚀

---

**Your Full Address:**
Click the copy button next to `0x4748...354E` on the homepage to copy your complete address!

