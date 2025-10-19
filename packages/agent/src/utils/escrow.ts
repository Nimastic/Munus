/**
 * Escrow Contract Utilities
 * Interact with the Munus Escrow contract on Base
 */

import { createPublicClient, http, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';

const ESCROW_ADDRESS = (process.env.ESCROW_ADDRESS || '0x0') as Address;

const escrowAbi = [
  {
    inputs: [],
    name: "nextId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "jobs",
    outputs: [
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "address", name: "assignee", type: "address" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint64", name: "deadline", type: "uint64" },
      { internalType: "enum Escrow.State", name: "state", type: "uint8" },
      { internalType: "string", name: "metadataCID", type: "string" },
      { internalType: "bytes32", name: "artifactHash", type: "bytes32" },
      { internalType: "string", name: "attestationCID", type: "string" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint64", name: "deadline", type: "uint64" },
      { internalType: "string", name: "metadataCID", type: "string" }
    ],
    name: "createJob",
    outputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "accept",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "bytes32", name: "artifactHash", type: "bytes32" },
      { internalType: "string", name: "attestationCID", type: "string" }
    ],
    name: "deliver",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "address", name: "to", type: "address" }
    ],
    name: "release",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "address", name: "to", type: "address" }
    ],
    name: "refund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "getJob",
    outputs: [
      {
        components: [
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "address", name: "assignee", type: "address" },
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint64", name: "deadline", type: "uint64" },
          { internalType: "enum Escrow.State", name: "state", type: "uint8" },
          { internalType: "string", name: "metadataCID", type: "string" },
          { internalType: "bytes32", name: "artifactHash", type: "bytes32" },
          { internalType: "string", name: "attestationCID", type: "string" }
        ],
        internalType: "struct Escrow.Job",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org')
});

export enum JobState {
  Open = 0,
  Accepted = 1,
  Delivered = 2,
  Released = 3,
  Refunded = 4
}

export interface Job {
  creator: Address;
  assignee: Address;
  token: Address;
  amount: bigint;
  deadline: bigint;
  state: JobState;
  metadataCID: string;
  artifactHash: string;
  attestationCID: string;
}

/**
 * Get total number of jobs
 */
export async function getJobCount(): Promise<number> {
  const count = await publicClient.readContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: 'nextId'  // Contract uses nextId, not jobCount
  });
  return Number(count);
}

/**
 * Get job details
 */
export async function getJob(jobId: number): Promise<Job> {
  const job = await publicClient.readContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: 'jobs',
    args: [BigInt(jobId)]
  });

  return {
    creator: job[0],
    assignee: job[1],
    token: job[2],
    amount: job[3],
    deadline: job[4],
    state: job[5] as JobState,
    metadataCID: job[6],
    artifactHash: job[7],
    attestationCID: job[8]
  };
}

/**
 * Get all open jobs
 */
export async function getOpenJobs(): Promise<Array<{ id: number; job: Job }>> {
  const count = await getJobCount();
  const jobs: Array<{ id: number; job: Job }> = [];

  for (let i = 0; i < count; i++) {
    const job = await getJob(i);
    if (job.state === JobState.Open) {
      jobs.push({ id: i, job });
    }
  }

  return jobs;
}

/**
 * Get jobs created by an address
 */
export async function getJobsByCreator(creator: Address): Promise<Array<{ id: number; job: Job }>> {
  const count = await getJobCount();
  const jobs: Array<{ id: number; job: Job }> = [];

  for (let i = 0; i < count; i++) {
    const job = await getJob(i);
    if (job.creator.toLowerCase() === creator.toLowerCase()) {
      jobs.push({ id: i, job });
    }
  }

  return jobs;
}

/**
 * Get jobs accepted by an address
 */
export async function getJobsByAssignee(assignee: Address): Promise<Array<{ id: number; job: Job }>> {
  const count = await getJobCount();
  const jobs: Array<{ id: number; job: Job }> = [];

  for (let i = 0; i < count; i++) {
    const job = await getJob(i);
    if (job.assignee.toLowerCase() === assignee.toLowerCase()) {
      jobs.push({ id: i, job });
    }
  }

  return jobs;
}

/**
 * Format ETH amount
 */
export function formatEth(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(4);
}

/**
 * Format job state
 */
export function formatJobState(state: JobState): string {
  const states = ['Open', 'Accepted', 'Delivered', 'Released', 'Refunded'];
  return states[state] || 'Unknown';
}

/**
 * Format deadline
 */
export function formatDeadline(deadline: bigint): string {
  const date = new Date(Number(deadline) * 1000);
  return date.toLocaleString();
}

