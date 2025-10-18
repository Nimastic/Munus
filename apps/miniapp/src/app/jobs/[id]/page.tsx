"use client";

import { EnsBadge } from "@/components/EnsBadge";
import {
    ESCROW_ADDRESS,
    escrowAbi,
    formatAmount,
    JobState,
    JobStateLabels,
    publicClient,
    toBytes32,
} from "@/lib/contracts";
import { UserButton } from "@civic/auth/react";
import Link from "link";
import { ArrowLeft, Ban, CheckCircle2, Clock, Loader2, Send } from "lucide-react";
import { use, useEffect, useState } from "react";
import { type Address } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

interface Job {
  id: number;
  creator: string;
  assignee: string;
  token: string;
  amount: bigint;
  deadline: bigint;
  state: JobState;
  metadataCID: string;
  artifactHash: string;
  attestationCID: string;
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const jobId = parseInt(resolvedParams.id);
  const { address } = useAccount();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // Forms
  const [artifactHash, setArtifactHash] = useState("");
  const [attestationCID, setAttestationCID] = useState("");
  const [showDeliverForm, setShowDeliverForm] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    loadJob();
  }, [jobId, isSuccess]);

  async function loadJob() {
    try {
      const jobData = await publicClient.readContract({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: "getJob",
        args: [BigInt(jobId)],
      }) as any;

      setJob({
        id: jobId,
        creator: jobData.creator,
        assignee: jobData.assignee,
        token: jobData.token,
        amount: jobData.amount,
        deadline: jobData.deadline,
        state: jobData.state,
        metadataCID: jobData.metadataCID,
        artifactHash: jobData.artifactHash,
        attestationCID: jobData.attestationCID,
      });
    } catch (error) {
      console.error("Error loading job:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    writeContract({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: "accept",
      args: [BigInt(jobId)],
    });
  }

  function handleDeliver() {
    if (!artifactHash || !attestationCID) {
      alert("Please provide both artifact hash and attestation CID");
      return;
    }

    writeContract({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: "deliver",
      args: [BigInt(jobId), toBytes32(artifactHash), attestationCID],
    });
  }

  function handleRelease() {
    if (!job) return;
    writeContract({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: "release",
      args: [BigInt(jobId), job.assignee as Address],
    });
  }

  function handleRefund() {
    if (!job) return;
    writeContract({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: "refund",
      args: [BigInt(jobId), job.creator as Address],
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
          <Link href="/jobs" className="text-blue-600 hover:underline">
            Back to jobs
          </Link>
        </div>
      </main>
    );
  }

  const isCreator = address && address.toLowerCase() === job.creator.toLowerCase();
  const isAssignee = address && address.toLowerCase() === job.assignee.toLowerCase();
  const canAccept = job.state === JobState.Open && !isCreator;
  const canDeliver = job.state === JobState.Accepted && isAssignee;
  const canRelease = job.state === JobState.Delivered && isCreator;
  const canRefund =
    (job.state === JobState.Open || job.state === JobState.Accepted) &&
    isCreator &&
    Number(job.deadline) < Date.now() / 1000;

  const getStateColor = (state: JobState) => {
    switch (state) {
      case JobState.Open:
        return "bg-green-100 text-green-800 border-green-200";
      case JobState.Accepted:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case JobState.Delivered:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case JobState.Released:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case JobState.Refunded:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Job Header */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Job #{job.id}</h1>
              <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium border ${getStateColor(job.state)}`}>
                {JobStateLabels[job.state]}
              </span>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">
                {formatAmount(job.amount, job.token === "0x0000000000000000000000000000000000000000" ? 18 : 6)}
              </div>
              <div className="text-sm text-gray-600">
                {job.token === "0x0000000000000000000000000000000000000000" ? "ETH" : "USDC"}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Creator</h3>
              <EnsBadge address={job.creator as `0x${string}`} />
              {isCreator && <span className="ml-2 text-xs text-blue-600">(You)</span>}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Worker</h3>
              {job.assignee !== "0x0000000000000000000000000000000000000000" ? (
                <>
                  <EnsBadge address={job.assignee as `0x${string}`} />
                  {isAssignee && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                </>
              ) : (
                <span className="text-gray-400">Not assigned yet</span>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Deadline</h3>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span>{new Date(Number(job.deadline) * 1000).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Chain</h3>
              <span>Base Sepolia</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap break-all">{job.metadataCID}</p>
        </div>

        {/* Deliverables (if delivered) */}
        {job.state >= JobState.Delivered && (
          <div className="bg-white rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Deliverables</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Artifact Hash</h3>
                <code className="block bg-gray-50 p-2 rounded text-sm break-all">
                  {job.artifactHash}
                </code>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Attestation CID</h3>
                <code className="block bg-gray-50 p-2 rounded text-sm break-all">
                  {job.attestationCID}
                </code>
                {job.attestationCID && (
                  <a
                    href={`https://ipfs.io/ipfs/${job.attestationCID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm mt-1 inline-block"
                  >
                    View on IPFS →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>

          {/* Accept */}
          {canAccept && (
            <button
              onClick={handleAccept}
              disabled={isPending || isConfirming}
              className="w-full mb-3 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isPending || isConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Accept Job
            </button>
          )}

          {/* Deliver */}
          {canDeliver && !showDeliverForm && (
            <button
              onClick={() => setShowDeliverForm(true)}
              className="w-full mb-3 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="w-5 h-5" />
              Submit Deliverables
            </button>
          )}

          {showDeliverForm && (
            <div className="mb-4 space-y-3 p-4 bg-blue-50 rounded-lg">
              <input
                type="text"
                placeholder="Artifact Hash (0x... or CID)"
                value={artifactHash}
                onChange={(e) => setArtifactHash(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Attestation CID (from Calimero workflow)"
                value={attestationCID}
                onChange={(e) => setAttestationCID(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeliverForm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeliver}
                  disabled={isPending || isConfirming}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending || isConfirming ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          )}

          {/* Release */}
          {canRelease && (
            <button
              onClick={handleRelease}
              disabled={isPending || isConfirming}
              className="w-full mb-3 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isPending || isConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Approve & Release Payment
            </button>
          )}

          {/* Refund */}
          {canRefund && (
            <button
              onClick={handleRefund}
              disabled={isPending || isConfirming}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isPending || isConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Ban className="w-5 h-5" />}
              Refund (Expired)
            </button>
          )}

          {!canAccept && !canDeliver && !canRelease && !canRefund && (
            <p className="text-center text-gray-600">
              {job.state === JobState.Released
                ? "✅ This job has been completed and paid."
                : job.state === JobState.Refunded
                ? "🔙 This job has been refunded."
                : "No actions available."}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

