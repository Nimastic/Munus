"use client";

import { CHAIN, DEFAULT_USDC, ESCROW_ADDRESS, escrowAbi } from "@/lib/contracts";
import { UserButton, useWallet } from "@civic/auth-web3/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseUnits, type Address, encodeFunctionData } from "viem";

export default function CreateJobPage() {
  const router = useRouter();
  const { wallet, address } = useWallet({ type: "ethereum" });
  const [token, setToken] = useState<string>("0x0000000000000000000000000000000000000000"); // ETH by default
  const [amount, setAmount] = useState<string>("0.01");
  const [deadlineHours, setDeadlineHours] = useState<string>("24");
  const [description, setDescription] = useState<string>("");
  const [step, setStep] = useState<"form" | "approving" | "creating" | "success">("form");
  const [txHash, setTxHash] = useState<string>("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!address || !wallet) {
      alert("Please login with Civic to get your embedded wallet");
      return;
    }

    try {
      setIsPending(true);
      const isNative = token === "0x0000000000000000000000000000000000000000";
      const decimals = isNative ? 18 : 6; // ETH has 18, USDC has 6
      const amountWei = parseUnits(amount, decimals);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + parseInt(deadlineHours) * 3600);

      // For ERC-20, we'd need to approve first
      // Skipping approval step for simplicity - assume ETH for demo
      if (!isNative) {
        alert("ERC-20 tokens require approval first. Use ETH for this demo.");
        setIsPending(false);
        return;
      }

      setStep("creating");

      // Create job using Civic embedded wallet
      const hash = await wallet.sendTransaction({
        account: wallet.account!,
        chain: wallet.chain,
        to: ESCROW_ADDRESS,
        data: encodeFunctionData({
          abi: escrowAbi,
          functionName: "createJob",
          args: [
            token as Address,
            amountWei,
            deadline,
            description || "Job posted via Munus miniapp",
          ],
        }),
        value: isNative ? amountWei : 0n,
      });

      setTxHash(hash);
      setStep("success");
      
      // Wait for confirmation and redirect
      setTimeout(() => {
        router.push("/jobs");
      }, 2000);
    } catch (error: any) {
      console.error("Error creating job:", error);
      alert(`Error: ${error.message || "Transaction failed"}`);
      setStep("form");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/jobs" className="flex items-center gap-2 hover:opacity-80">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Jobs</span>
          </Link>
          <UserButton />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create Job</h1>
          <p className="text-gray-600 mt-1">Post a new paid task for your team</p>
        </div>

        {step === "success" ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Job Created!</h2>
            <p className="text-gray-600 mb-6">
              Your job has been posted to the escrow contract. Redirecting...
            </p>
            <Link
              href="/jobs"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Jobs
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 space-y-6">
            {/* Token Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Token
              </label>
              <select
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={step !== "form"}
              >
                <option value="0x0000000000000000000000000000000000000000">ETH (Native)</option>
                <option value={DEFAULT_USDC} disabled>
                  USDC (Requires approval)
                </option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.01"
                  required
                  disabled={step !== "form"}
                />
                <span className="absolute right-4 top-2 text-gray-500">
                  {token === "0x0000000000000000000000000000000000000000" ? "ETH" : "USDC"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This amount will be locked in escrow until the job is complete
              </p>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline (hours from now)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={deadlineHours}
                onChange={(e) => setDeadlineHours(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="24"
                required
                disabled={step !== "form"}
              />
              <p className="text-xs text-gray-500 mt-1">
                Job will be auto-refundable if not completed by deadline (min: 0.01 hours = 36 seconds)
              </p>
            </div>

            {/* Description / Metadata CID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description (or IPFS CID)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Parse invoice totals, generate sales report, fix bug in checkout flow..."
                required
                disabled={step !== "form"}
              />
              <p className="text-xs text-gray-500 mt-1">
                Describe what needs to be done. Or paste an IPFS CID with detailed requirements.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Link
                href="/jobs"
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={step !== "form" || isPending}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {step === "approving" ? "Approving..." : "Creating..."}
                  </>
                ) : (
                  "Create Job"
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="text-blue-900 font-medium mb-2">💡 How it works:</p>
              <ul className="text-blue-800 space-y-1 list-disc list-inside">
                <li>Your funds lock in escrow on Base</li>
                <li>Workers can accept the job in the jobs list</li>
                <li>When work is delivered, you approve payment</li>
                <li>If no one accepts by deadline, you can refund</li>
              </ul>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

