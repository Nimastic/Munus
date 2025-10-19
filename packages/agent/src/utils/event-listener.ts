/**
 * Contract Event Listener
 * Listens to Escrow contract events and posts receipts in XMTP chat
 */

import type { Agent } from '@xmtp/agent-sdk';
import { createPublicClient, http, parseAbiItem, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';

const ESCROW_ADDRESS = (process.env.ESCROW_ADDRESS || '0x0') as Address;

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
  pollingInterval: 5_000, // Poll every 5 seconds
});

// Event signatures (matching actual Escrow.sol contract)
const events = {
  JobCreated: parseAbiItem('event JobCreated(uint256 indexed id, address indexed creator, address token, uint256 amount, uint64 deadline, string metadataCID)'),
  JobAccepted: parseAbiItem('event JobAccepted(uint256 indexed id, address indexed assignee)'),
  JobDelivered: parseAbiItem('event JobDelivered(uint256 indexed id, bytes32 artifactHash, string attestationCID)'),
  Released: parseAbiItem('event Released(uint256 indexed id, address indexed to, uint256 amount)'),
  Refunded: parseAbiItem('event Refunded(uint256 indexed id, address indexed to, uint256 amount)'),
};

interface EventHandlers {
  onJobCreated?: (jobId: bigint, creator: Address, token: Address, amount: bigint, deadline: bigint, metadataCID: string) => Promise<void>;
  onJobAccepted?: (jobId: bigint, assignee: Address) => Promise<void>;
  onJobDelivered?: (jobId: bigint, artifactHash: string, attestationCID: string) => Promise<void>;
  onReleased?: (jobId: bigint, to: Address, amount: bigint) => Promise<void>;
  onRefunded?: (jobId: bigint, to: Address, amount: bigint) => Promise<void>;
}

/**
 * Start listening to contract events
 */
export function startEventListener(handlers: EventHandlers) {
  console.log('🎧 Starting event listener for Escrow contract...');
  console.log(`📍 Contract: ${ESCROW_ADDRESS}`);
  console.log(`⛓️  Chain: Base Sepolia`);

  // Watch for JobCreated
  const unwatchJobCreated = publicClient.watchEvent({
    address: ESCROW_ADDRESS,
    event: events.JobCreated,
    onLogs: async (logs) => {
      for (const log of logs) {
        const { id, creator, token, amount, deadline, metadataCID } = log.args as {
          id: bigint;
          creator: Address;
          token: Address;
          amount: bigint;
          deadline: bigint;
          metadataCID: string;
        };
        console.log(`📋 JobCreated: #${id} by ${creator}`);
        if (handlers.onJobCreated) {
          await handlers.onJobCreated(id, creator, token, amount, deadline, metadataCID);
        }
      }
    },
  });

  // Watch for JobAccepted
  const unwatchJobAccepted = publicClient.watchEvent({
    address: ESCROW_ADDRESS,
    event: events.JobAccepted,
    onLogs: async (logs) => {
      for (const log of logs) {
        const { id, assignee } = log.args as {
          id: bigint;
          assignee: Address;
        };
        console.log(`✅ JobAccepted: #${id} by ${assignee}`);
        if (handlers.onJobAccepted) {
          await handlers.onJobAccepted(id, assignee);
        }
      }
    },
  });

  // Watch for JobDelivered
  const unwatchJobDelivered = publicClient.watchEvent({
    address: ESCROW_ADDRESS,
    event: events.JobDelivered,
    onLogs: async (logs) => {
      for (const log of logs) {
        const { id, artifactHash, attestationCID } = log.args as {
          id: bigint;
          artifactHash: string;
          attestationCID: string;
        };
        console.log(`📦 JobDelivered: #${id}`);
        if (handlers.onJobDelivered) {
          await handlers.onJobDelivered(id, artifactHash, attestationCID);
        }
      }
    },
  });

  // Watch for Released
  const unwatchReleased = publicClient.watchEvent({
    address: ESCROW_ADDRESS,
    event: events.Released,
    onLogs: async (logs) => {
      for (const log of logs) {
        const { id, to, amount } = log.args as { id: bigint; to: Address; amount: bigint };
        console.log(`💰 Released: #${id}`);
        if (handlers.onReleased) {
          await handlers.onReleased(id, to, amount);
        }
      }
    },
  });

  // Watch for Refunded
  const unwatchRefunded = publicClient.watchEvent({
    address: ESCROW_ADDRESS,
    event: events.Refunded,
    onLogs: async (logs) => {
      for (const log of logs) {
        const { id, to, amount } = log.args as { id: bigint; to: Address; amount: bigint };
        console.log(`🔄 Refunded: #${id}`);
        if (handlers.onRefunded) {
          await handlers.onRefunded(id, to, amount);
        }
      }
    },
  });

  console.log('✅ Event listener started!');

  // Return cleanup function
  return () => {
    unwatchJobCreated();
    unwatchJobAccepted();
    unwatchJobDelivered();
    unwatchReleased();
    unwatchRefunded();
    console.log('🛑 Event listener stopped');
  };
}

/**
 * Helper to broadcast message to all conversations (for demo purposes)
 * In production, you'd want to send to specific conversation based on job metadata
 */
export async function broadcastToConversations(
  agent: Agent,
  message: string,
  targetAddress?: Address
) {
  try {
    const conversations = await agent.client.conversations.list();
    
    for (const conversation of conversations) {
      try {
        // If targetAddress specified, only send to conversations including that address
        if (targetAddress) {
          const members = conversation.members;
          const hasTarget = members.some(
            (m) => m.toLowerCase() === targetAddress.toLowerCase()
          );
          if (!hasTarget) continue;
        }

        await conversation.send(message);
        console.log(`📤 Sent to conversation: ${conversation.id}`);
      } catch (error) {
        console.warn(`Failed to send to conversation ${conversation.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to broadcast:', error);
  }
}

