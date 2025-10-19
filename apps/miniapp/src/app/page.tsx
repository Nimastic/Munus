"use client";

import { EnsBadge } from "@/components/EnsBadge";
import { UserButton, useUser, useWallet } from "@civic/auth-web3/react";
import { MessageSquare, Shield, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const { user } = useUser();
  const { wallet, address } = useWallet({ type: "ethereum" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  // Civic embedded wallet is automatically created when user logs in
  const isConnected = !!address;

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
            {/* Civic Auth Button - Embedded wallet is created automatically on login */}
            <UserButton />
            {isConnected && address && (
              <div className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
              </div>
            )}
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
            /* Step 1: Login with Civic - Embedded Wallet Created Automatically */
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Login with Civic</h2>
              </div>
              <p className="text-gray-600">
                Sign in with Civic to get started. An embedded Web3 wallet will be created automatically for you!
              </p>
              <div className="flex justify-center pt-4">
                <UserButton />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-xs text-blue-800 font-semibold">✨ What you get:</p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>Secure authentication via Civic SSO</li>
                  <li>Non-custodial embedded wallet (auto-created)</li>
                  <li>No seed phrases to remember</li>
                  <li>Support for 18+ EVM chains including Base</li>
                </ul>
              </div>
            </div>
          ) : (
            /* All set - User is logged in with embedded wallet */
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                  <Shield className="w-4 h-4" />
                  <span>✓ Logged in with Civic</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                  <Wallet className="w-4 h-4" />
                  <span>✓ Embedded wallet ready</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <Wallet className="w-5 h-5 text-blue-600" />
                {address ? (
                  <EnsBadge address={address as `0x${string}`} />
                ) : (
                  <span className="text-sm text-gray-600">Loading wallet...</span>
                )}
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-xs text-purple-800 text-center">
                  🎉 <strong>Civic Embedded Wallet:</strong> Non-custodial, no seed phrases, works across 18+ EVM chains!
                </p>
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

