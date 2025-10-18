import { type Address, createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";

// Chain configuration
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532");
export const CHAIN = CHAIN_ID === 8453 ? base : baseSepolia;

// Contract addresses
export const ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "0x") as Address;
export const DEFAULT_USDC = (process.env.NEXT_PUBLIC_DEFAULT_USDC || "0x") as Address;

// Public client for reading contract state
export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(
    CHAIN_ID === 8453
      ? process.env.NEXT_PUBLIC_BASE_RPC
      : process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC
  ),
});

// Escrow contract ABI (minimal for demo)
export const escrowAbi = [
  {
    type: "function",
    name: "createJob",
    stateMutability: "payable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "deadline", type: "uint64" },
      { name: "metadataCID", type: "string" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    type: "function",
    name: "accept",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "deliver",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "artifactHash", type: "bytes32" },
      { name: "attestationCID", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "release",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "to", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "refund",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "to", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getJob",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "creator", type: "address" },
          { name: "assignee", type: "address" },
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "deadline", type: "uint64" },
          { name: "state", type: "uint8" },
          { name: "metadataCID", type: "string" },
          { name: "artifactHash", type: "bytes32" },
          { name: "attestationCID", type: "string" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "nextId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "JobCreated",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "token", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "deadline", type: "uint64", indexed: false },
      { name: "metadataCID", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "JobAccepted",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "assignee", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "JobDelivered",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "artifactHash", type: "bytes32", indexed: false },
      { name: "attestationCID", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Released",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

// Job states
export enum JobState {
  Open = 0,
  Accepted = 1,
  Delivered = 2,
  Released = 3,
  Refunded = 4,
}

export const JobStateLabels: Record<JobState, string> = {
  [JobState.Open]: "Open",
  [JobState.Accepted]: "In Progress",
  [JobState.Delivered]: "Pending Review",
  [JobState.Released]: "Completed",
  [JobState.Refunded]: "Refunded",
};

// Helper to convert CID or hex string to bytes32
export function toBytes32(input: string): `0x${string}` {
  // If already bytes32, return as-is
  if (input.startsWith("0x") && input.length === 66) {
    return input as `0x${string}`;
  }
  
  // For IPFS CIDs or other strings, hash them
  // In production, use keccak256 from viem
  // For demo, we'll use a simple encoding
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // Simple hash simulation (use proper keccak256 in production)
  let hash = "0x";
  for (let i = 0; i < Math.min(32, data.length); i++) {
    hash += data[i].toString(16).padStart(2, "0");
  }
  // Pad to 32 bytes
  hash = hash.padEnd(66, "0");
  
  return hash as `0x${string}`;
}

// Format amounts
export function formatAmount(amount: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  
  if (fraction === 0n) {
    return whole.toString();
  }
  
  const fractionStr = fraction.toString().padStart(decimals, "0");
  const trimmed = fractionStr.replace(/0+$/, "");
  return `${whole}.${trimmed}`;
}

