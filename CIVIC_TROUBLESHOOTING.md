# Civic Auth Troubleshooting Guide

## 🔍 Current Issue: Turnkey Iframe Not Loading

### Symptoms
- "Turnkey iframe not ready - skipping the rest of the app" in console
- Login completes but page doesn't update
- No wallet is created

### Root Cause
The Turnkey iframe (used by Civic for embedded wallets) isn't loading due to CORS/CSP issues.

---

## ✅ Steps to Fix

### 1. **Restart Dev Server** (Critical!)

```bash
# Stop current server (Ctrl+C)
cd /Users/jerielchan/Documents/Nimastic/Munus/apps/miniapp
pnpm dev
```

The config changes I made won't apply until you restart!

### 2. **Clear Browser Cache**

```bash
# Hard refresh:
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R

# Or use incognito mode:
# Mac: Cmd + Shift + N
# Windows: Ctrl + Shift + N
```

### 3. **Check Browser Console**

After logging in, open DevTools (F12) and look for:

**Good signs:**
```
👤 User Context Changed: { hasUser: true, hasWallet: false, ... }
🔑 Creating embedded wallet for user...
✅ Wallet created successfully!
🔍 Civic User Context: { hasUser: true, hasWallet: true, ... }
```

**Bad signs:**
```
❌ Turnkey iframe not ready
❌ Failed to create wallet: ...
```

---

## 🔧 Alternative Solutions

### Option A: Use Civic Auth (without embedded wallets)

If Turnkey keeps failing, we can switch to basic Civic Auth + external wallet:

1. Change package:
   ```bash
   cd apps/miniapp
   pnpm remove @civic/auth-web3
   pnpm add @civic/auth wagmi viem
   ```

2. Update to use RainbowKit or another wallet connector

**Pros:** More stable, widely tested
**Cons:** Users need to connect existing wallet (not embedded)

### Option B: Simplify for Demo

For hackathon demo purposes:

1. Use mock wallet addresses
2. Focus on contract/agent functionality
3. Add real wallet integration post-hackathon

---

## 🎯 What Should Work After Fix

### Expected Behavior

1. **Login**:
   - Click "Login with Civic"
   - Choose Google/Email
   - Redirect back to app

2. **Wallet Creation** (~5-10 seconds):
   - See "Creating your embedded wallet..."
   - Progress indicator
   - Success message

3. **Homepage Updates**:
   ```
   ✓ Logged in with Civic (only SSO)
   🔵 Embedded wallet: 0x1234...5678
   [Browse Jobs]  [Create Job]
   ```

4. **Console Logs**:
   ```
   👤 User Context Changed: { hasUser: true, hasWallet: true }
   🔍 Civic User Context: { hasUser: true, hasWallet: true, walletAddress: "0x..." }
   ```

---

## 🆘 If Still Not Working

### Debug Checklist

- [ ] Restarted dev server after config changes?
- [ ] Cleared browser cache / tried incognito?
- [ ] Civic Client ID is correct in `.env.local`?
- [ ] Domain `http://localhost:3000` saved in Civic dashboard?
- [ ] No other errors in browser console?
- [ ] Using Chrome/Firefox (not Safari)?

### Contact Info

If you're still stuck:

1. **Check Civic docs**: https://docs.civic.com/web3/embedded-wallets
2. **Civic Slack**: https://join.slack.com/t/civic-developers/...
3. **GitHub issues**: Check if others have similar Turnkey problems

---

## 📊 Current Configuration

### Environment Variables
```
NEXT_PUBLIC_CIVIC_CLIENT_ID=ac368fe8-81ea-4cd4-8a08-465bea0d20da
```

### Next.js Config
```javascript
// More permissive headers for Turnkey iframe
Cross-Origin-Embedder-Policy: credentialless
Cross-Origin-Opener-Policy: same-origin-allow-popups
```

### Wagmi Config
```typescript
// Civic embedded wallet ONLY
connectors: [embeddedWallet()]
```

---

## 🚀 Next Steps After Login Works

Once you see your wallet address:

1. **Deploy contracts** to Base Sepolia
2. **Update** `NEXT_PUBLIC_ESCROW_ADDRESS` in `.env.local`
3. **Test** creating a job
4. **Celebrate!** 🎉

---

**Last Updated**: After latest config changes
**Status**: Awaiting server restart and testing

