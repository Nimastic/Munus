"use client";

import { EnsBadge } from "@/components/EnsBadge";
import { ESCROW_ADDRESS, escrowAbi, formatAmount, JobState, JobStateLabels, publicClient } from "@/lib/contracts";
import { UserButton, useWallet } from "@civic/auth-web3/react";
import { AlertCircle, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Job {
  id: number;
  creator: string;
  assignee: string;
  token: string;
  amount: bigint;
  deadline: bigint;
  state: JobState;
  metadataCID: string;
}

export default function JobsPage() {
  const { address } = useWallet({ type: "ethereum" });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "mine">("all");

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setLoading(true);

      // Get total number of jobs
      const nextId = await publicClient.readContract({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: "nextId",
      }) as bigint;

      // Fetch all jobs
      const jobPromises = [];
      for (let i = 0; i < Number(nextId); i++) {
        jobPromises.push(
          publicClient.readContract({
            address: ESCROW_ADDRESS,
            abi: escrowAbi,
            functionName: "getJob",
            args: [BigInt(i)],
          })
        );
      }

      const jobsData = await Promise.all(jobPromises);

      const parsedJobs: Job[] = jobsData.map((job: any, index) => ({
        id: index,
        creator: job.creator,
        assignee: job.assignee,
        token: job.token,
        amount: job.amount,
        deadline: job.deadline,
        state: job.state,
        metadataCID: job.metadataCID,
      }));

      setJobs(parsedJobs);
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = jobs.filter((job) => {
    if (filter === "open") return job.state === JobState.Open;
    if (filter === "mine") {
      console.log("Filtering 'mine':", {
        jobCreator: job.creator,
        myAddress: address,
        match: job.creator.toLowerCase() === address?.toLowerCase()
      });
      return (
        address &&
        (job.creator.toLowerCase() === address.toLowerCase() ||
          job.assignee.toLowerCase() === address.toLowerCase())
      );
    }
    return true;
  });

  console.log("Jobs loaded:", jobs.length);
  console.log("Filtered jobs:", filteredJobs.length);
  console.log("Current filter:", filter);
  console.log("My address:", address);

  const getStateColor = (state: JobState) => {
    switch (state) {
      case JobState.Open:
        return "bg-green-100 text-green-800";
      case JobState.Accepted:
        return "bg-blue-100 text-blue-800";
      case JobState.Delivered:
        return "bg-yellow-100 text-yellow-800";
      case JobState.Released:
        return "bg-gray-100 text-gray-800";
      case JobState.Refunded:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTimeRemaining = (deadline: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = Number(deadline) - now;

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / 3600);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d left`;
    return `${hours}h left`;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
            <h1 className="text-xl font-bold">Munus</h1>
          </Link>
          <UserButton />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Jobs</h1>
            <p className="text-gray-600 mt-1">Browse and manage jobs</p>
          </div>
          <Link
            href="/jobs/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Job
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "all", label: "All Jobs" },
            { id: "open", label: "Open" },
            { id: "mine", label: "My Jobs" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === f.id
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-6">
              {filter === "open"
                ? "No open jobs right now. Check back later!"
                : filter === "mine"
                ? "You haven't created or accepted any jobs yet."
                : "No jobs have been created yet. Be the first!"}
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="text-blue-600 hover:underline"
              >
                View all jobs
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">Job #{job.id}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStateColor(
                          job.state
                        )}`}
                      >
                        {JobStateLabels[job.state]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 break-all">{job.metadataCID}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatAmount(job.amount, job.token === "0x0000000000000000000000000000000000000000" ? 18 : 6)}
                      <span className="text-sm text-gray-600 ml-1">
                        {job.token === "0x0000000000000000000000000000000000000000" ? "ETH" : "USDC"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Creator:</span>
                    <div className="mt-1">
                      <EnsBadge address={job.creator as `0x${string}`} showAddress={false} />
                    </div>
                  </div>
                  {job.assignee !== "0x0000000000000000000000000000000000000000" && (
                    <div>
                      <span className="text-gray-600">Worker:</span>
                      <div className="mt-1">
                        <EnsBadge address={job.assignee as `0x${string}`} showAddress={false} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{getTimeRemaining(job.deadline)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

