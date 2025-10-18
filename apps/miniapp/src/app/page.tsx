"use client";

import { EnsBadge } from "@/components/EnsBadge";
import { UserButton, useUser } from "@civic/auth/react";
import { MessageSquare, Shield, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { user } = useUser();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
            <h1 className="text-xl font-bold">Munus</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Civic Auth Button */}
            <UserButton />
            {/* Wallet Connect Button */}
            {isConnected ? (
              <button
                onClick={() => disconnect()}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Disconnect Wallet
              </button>
            ) : user ? (
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Connect Wallet
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Chat-native Jobs
          </h1>
          <p className="text-xl text-gray-600">
            Coordinate paid tasks with your team, right in chat. AI agent handles the workflow,
            smart contracts handle the money.
          </p>

          {!user ? (
            /* Step 1: Login with Civic */
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Step 1: Login with Civic</h2>
              </div>
              <p className="text-gray-600">
                Sign in with Civic to get started. Civic is our ONLY SSO provider (bounty requirement!)
              </p>
              <div className="flex justify-center pt-4">
                <UserButton />
              </div>
              <p className="text-xs text-gray-500 text-center">
                ✅ Civic Auth ensures secure, compliant authentication
              </p>
            </div>
          ) : !isConnected ? (
            /* Step 2: Connect Wallet */
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 mb-4">
                <Shield className="w-4 h-4" />
                <span>✓ Logged in with Civic (only SSO)</span>
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Wallet className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Step 2: Connect Wallet</h2>
              </div>
              <p className="text-gray-600">
                Now connect your Web3 wallet for transactions. Use MetaMask, Coinbase Wallet, or any Web3 wallet!
              </p>
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="w-full px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Connect Wallet
              </button>
              <p className="text-xs text-gray-500 text-center">
                💡 Make sure you're on <strong>Base Sepolia</strong> testnet
              </p>
            </div>
          ) : (
            /* Step 3: Ready to Use */
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                  <Shield className="w-4 h-4" />
                  <span>✓ Logged in with Civic (only SSO)</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                  <Wallet className="w-4 h-4" />
                  <span>✓ Wallet connected</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
                <Wallet className="w-5 h-5 text-blue-600" />
                <EnsBadge address={address!} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  href="/jobs"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  Browse Jobs
                </Link>
                <Link
                  href="/jobs/create"
                  className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Zap className="w-5 h-5" />
                  Create Job
                </Link>
              </div>

              <p className="text-sm text-gray-500 text-center">
                Your funds are secured in escrow on Base. No counterparty risk! 🔐
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-20 grid md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg">Chat-native</h3>
            <p className="text-sm text-gray-600">
              Post jobs in XMTP group chats. No context-switching, no extra apps.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg">Secure Escrow</h3>
            <p className="text-sm text-gray-600">
              Smart contracts on Base hold funds. Pay only when work is delivered.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg">AI Orchestrated</h3>
            <p className="text-sm text-gray-600">
              Agent handles reminders, validation, and receipts. Just focus on the work.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-2xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="space-y-4">
            {[
              { step: 1, text: "Post a job in your group chat or create one here" },
              { step: 2, text: "Agent posts interactive card with actions" },
              { step: 3, text: "Worker accepts → funds lock in escrow" },
              { step: 4, text: "Worker delivers → submits proof" },
              { step: 5, text: "Creator approves → payment releases" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 p-4 bg-white rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <p className="text-gray-700 pt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>Built for ETHRome 2025 🇮🇹</p>
          <p className="mt-2">
            Powered by{" "}
            <span className="font-semibold">
              Civic • XMTP • Base • Calimero • ENS • BuidlGuidl
            </span>
          </p>
        </div>
      </footer>
    </main>
  );
}

