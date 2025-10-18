import { Agent, getTestUrl } from "@xmtp/agent-sdk";
import "dotenv/config";
import { createPublicClient, http, type Address } from "viem";
import { baseSepolia } from "viem/chains";

const ENV = (process.env.XMTP_ENV as "dev" | "production") || "dev";
const ESCROW = process.env.ESCROW_ADDRESS as Address;
const RPC_URL = process.env.RPC_BASE_SEPOLIA || "https://sepolia.base.org";

// Public client for reading contract state
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
});

/**
 * Check if message mentions the agent
 */
function isMentioningMe(text: string, agentName: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes(`@${agentName.toLowerCase()}`) || lower.includes("munus");
}

/**
 * Generate Quick Actions card for a job
 * (Base App custom content type)
 */
function quickActionsCard(jobId: number) {
  return {
    type: "coinbase.com/actions:1.0",
    title: `Job #${jobId}`,
    description: "Tap an action below to interact with this job",
    actions: [
      {
        id: "open-miniapp",
        label: "📱 Open Miniapp",
        style: "primary",
        intent: { type: "open", path: `/jobs/${jobId}` },
      },
      {
        id: "accept",
        label: "✅ Accept Job",
        style: "primary",
        intent: { type: "accept", jobId },
      },
      {
        id: "deliver",
        label: "📦 Mark Delivered",
        style: "secondary",
        intent: { type: "deliver", jobId },
      },
      {
        id: "approve",
        label: "💰 Approve & Pay",
        style: "positive",
        intent: { type: "release", jobId },
      },
      {
        id: "refund",
        label: "🔙 Refund",
        style: "negative",
        intent: { type: "refund", jobId },
      },
    ],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  };
}

/**
 * Parse job ID from message
 */
function parseJobId(text: string): number | null {
  const match = text.match(/\/job\s+(?:new\s+)?(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Main agent function
 */
async function main() {
  console.log("🚀 Starting Munus XMTP Agent...");

  // Create agent from environment variables
  const agent = await Agent.createFromEnv({
    env: ENV,
    dbPath: "./db", // Persistent DB to avoid 10-installation limit
  });

  const agentName = "munus";

  // Agent started event
  agent.on("start", () => {
    console.log(`✅ Munus agent online!`);
    console.log(`📍 Environment: ${ENV}`);
    if (ENV === "dev") {
      console.log(`🧪 Test URL: ${getTestUrl(agent.client)}`);
      console.log(`💬 DM this address on xmtp.chat to test`);
    }
    console.log(`\n🎯 Listening for mentions and commands...`);
    console.log(`   - @munus /job <id>`);
    console.log(`   - @munus /help`);
    console.log(`   - Reply to agent messages`);
  });

  // Handle text messages
  agent.on("text", async (ctx) => {
    try {
      const message = ctx.message.content?.trim() || "";
      const mentioned = isMentioningMe(message, agentName);
      const isReply = !!ctx.message?.reference;

      // Etiquette: Only respond to mentions or replies
      if (!(mentioned || isReply)) {
        return;
      }

      console.log(`\n📨 Received message: "${message.slice(0, 50)}..."`);
      console.log(`   Mentioned: ${mentioned}, Reply: ${isReply}`);

      // Acknowledge receipt
      await ctx.react("👀");

      // Help command
      if (/\/help|help/i.test(message)) {
        await ctx.send(
          `🤖 **Munus Agent - Help**\n\n` +
            `I help coordinate jobs in your chat!\n\n` +
            `**Commands:**\n` +
            `• \`@munus /job <id>\` - Show job actions\n` +
            `• \`@munus /help\` - Show this help\n\n` +
            `**How it works:**\n` +
            `1. Create jobs in the miniapp\n` +
            `2. Mention me with job ID\n` +
            `3. I'll post interactive actions\n` +
            `4. Team accepts, delivers, approves\n` +
            `5. Smart contract handles escrow\n\n` +
            `Visit the miniapp to create your first job!`
        );
        await ctx.react("✅");
        return;
      }

      // Job command: /job <id>
      const jobId = parseJobId(message);
      if (jobId !== null) {
        console.log(`   Fetching job ${jobId}...`);

        // TODO: Fetch job state from contract
        // For now, send the actions card
        try {
          const card = quickActionsCard(jobId);
          await ctx.send(JSON.stringify(card, null, 2)); // Send as formatted JSON for now
          
          // Also send a text explanation
          await ctx.send(
            `📋 **Job #${jobId}**\n\n` +
              `Tap actions above or open the miniapp to:\n` +
              `• View full details\n` +
              `• Accept the job\n` +
              `• Submit deliverables\n` +
              `• Release payment\n\n` +
              `All funds are secured in escrow on Base! 🔐`
          );
          await ctx.react("✅");
        } catch (error) {
          console.error("Error sending job card:", error);
          await ctx.send(`❌ Error fetching job ${jobId}. Make sure it exists!`);
        }
        return;
      }

      // Generic greeting or unrecognized command
      if (/hello|hi|hey|gm|gn/i.test(message)) {
        await ctx.send(
          `👋 Hey! I'm Munus, your job coordination agent.\n\n` +
            `Try:\n` +
            `• \`@munus /help\` for commands\n` +
            `• \`@munus /job 0\` to see a job\n\n` +
            `I help teams coordinate paid tasks right in chat!`
        );
        await ctx.react("✅");
        return;
      }

      // Default response
      await ctx.send(
        `I didn't quite understand that. Try:\n` +
          `• \`@munus /help\` - Show available commands\n` +
          `• \`@munus /job <id>\` - Show job actions`
      );
      await ctx.react("❓");
    } catch (error) {
      console.error("Error handling message:", error);
      await ctx.send("❌ Oops, something went wrong. Please try again!");
    }
  });

  // Handle reactions (optional - for fun)
  agent.on("reaction", async (ctx) => {
    console.log(`👍 Received reaction: ${ctx.message.content}`);
    // Could track sentiment or engagement here
  });

  // Handle errors
  agent.on("error", (error) => {
    console.error("❌ Agent error:", error);
  });

  // Start the agent
  await agent.start();
  console.log("\n✨ Agent is running. Press Ctrl+C to stop.\n");
}

// Run the agent
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

