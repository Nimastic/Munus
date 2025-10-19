# Convert Munus to Base Miniapp - Setup Guide

I've added the necessary files to make your app a Base miniapp. Follow these steps to complete the setup.

---

## ✅ What I've Already Done

1. ✅ Created `minikit.config.ts` - Miniapp configuration
2. ✅ Created `.well-known/farcaster.json` route - Manifest endpoint
3. ✅ Created `/api/webhook` route - Base App webhook
4. ✅ Created OpenGraph image generator - Social preview

---

## 🎯 What You Need To Do

### Step 1: Create Required Images (10 minutes)

You need to create these image assets and place them in the `public/` folder:

<function_calls>
<invoke name="run_terminal_cmd">
<parameter name="command">mkdir -p /Users/jerielchan/Documents/Nimastic/Munus/apps/miniapp/public
