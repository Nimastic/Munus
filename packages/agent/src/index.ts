import { Agent } from "@xmtp/agent-sdk";
import { getTestUrl } from "@xmtp/agent-sdk/debug";
import "dotenv/config";
import { formatDeadline, formatEth } from "./utils/escrow";
import { broadcastToConversations, startEventListener } from "./utils/event-listener";

console.log("🚀 Starting Munus XMTP Agent...");

async function main() {
  const agent = await Agent.createFromEnv({ 
    env: process.env.XMTP_ENV === "production" ? "production" : "dev",
  });

  console.log("✅ Agent created successfully!");
  console.log(`📬 Test your agent: ${getTestUrl(agent.client)}`);
  console.log(`🤖 Agent inbox ID: ${agent.client.inboxId}`);
  console.log(`🌍 Environment: ${process.env.XMTP_ENV || "dev"}`);
  console.log("🎯 Listening for messages...\n");

  // Respond to text messages
  agent.on("text", async (ctx) => {
    const message = ctx.message.content;
    const messageStr = String(message).toLowerCase();
    const senderAddress = await ctx.getSenderAddress();

    console.log(`💬 Message from ${senderAddress}: ${messageStr}`);

    // Group etiquette: Only respond if mentioned or replied to
    if (ctx.conversation.isGroup) {
      const agentAddress = agent.client.inboxId.toLowerCase();
      
      // Check if agent is mentioned (e.g., @munus or contains agent address)
      const isMentioned = messageStr.includes('@munus') || 
                         messageStr.includes(agentAddress);
      
      // Check if this message is a reply to the agent
      const isReply = ctx.message.contentType?.toString().includes('reply');
      
      // If not mentioned and not a reply, ignore in groups
      if (!isMentioned && !isReply) {
        console.log('  ↳ Ignored (group message, not mentioned/replied)');
        return;
      }
      
      console.log('  ↳ Responding (mentioned or replied)');
    } else {
      console.log('  ↳ Responding (DM)');
    }

    // Parse commands
    if (messageStr.startsWith("/job")) {
      const parts = message.split(" ");
      const command = parts[1];

      if (command === "new" || command === "create") {
        await ctx.sendText(
          "🎯 Creating a new job!\n\n" +
            "To post a job:\n" +
            "1. Open the Munus miniapp\n" +
            "2. Fill in job details and reward\n" +
            "3. I'll help track the workflow!\n\n" +
            `🔗 Open miniapp: ${process.env.MINIAPP_URL || "https://munus.vercel.app"}`
        );
      } else if (command === "help") {
        await ctx.sendText(
          "🤖 **Munus Agent Commands**\n\n" +
            "• `/job new` - Create a new job\n" +
            "• `/job help` - Show this help\n" +
            "• `/help` - General help\n\n" +
            "I'll send reminders about deadlines and help coordinate your team's paid tasks!"
        );
      } else {
        await ctx.sendText(
          "❓ Unknown job command. Try:\n" +
            "• `/job new` - Create job\n" +
            "• `/job help` - Get help"
        );
      }
    } else if (message.startsWith("/help")) {
      await ctx.sendText(
        "👋 **Welcome to Munus!**\n\n" +
          "I help coordinate paid tasks in chat.\n\n" +
          "**Commands:**\n" +
          "• `/job new` - Post a new job\n" +
          "• `/job help` - Job commands\n" +
          "• `/help` - This message\n\n" +
          "All payments secured in escrow on Base! 🔐"
      );
    } else {
      // Default response for any other text
      await ctx.sendText(
        `Hey! 👋\n\n` +
          `I'm the Munus agent - I help coordinate paid tasks right in chat.\n\n` +
          `Try:\n` +
          `• \`/job new\` - Create a job\n` +
          `• \`/help\` - Learn more\n\n` +
          `Powered by XMTP + Base + Civic 🚀`
      );
    }
  });

  // Start contract event listener
  startEventListener({
    onJobCreated: async (jobId, creator, token, amount, deadline, metadataCID) => {
      const message = 
        `🎯 **New Job Created!**\n\n` +
        `**Job #${jobId}**\n` +
        `💰 Amount: ${formatEth(amount)} ETH\n` +
        `⏰ Deadline: ${formatDeadline(deadline)}\n` +
        `👤 Posted by: ${creator}\n\n` +
        `Want to accept it? Open the miniapp!`;
      
      await broadcastToConversations(agent, message);
    },

    onJobAccepted: async (jobId, assignee) => {
      const message = 
        `✅ **Job #${jobId} Accepted!**\n\n` +
        `👷 Assignee: ${assignee}\n\n` +
        `The work has begun! 🚀`;
      
      await broadcastToConversations(agent, message);
    },

    onJobDelivered: async (jobId, artifactHash, attestationCID) => {
      const message = 
        `📦 **Job #${jobId} Delivered!**\n\n` +
        `📄 Artifact: ${artifactHash.slice(0, 10)}...${artifactHash.slice(-8)}\n` +
        `${attestationCID ? `🔐 Attestation: ${attestationCID}\n` : ''}` +
        `\nJob creator: Please review and release payment! 💰`;
      
      await broadcastToConversations(agent, message);
    },

    onReleased: async (jobId, to, amount) => {
      const message = 
        `💰 **Payment Released!**\n\n` +
        `**Job #${jobId}**\n` +
        `Amount: ${formatEth(amount)} ETH\n` +
        `Recipient: ${to}\n\n` +
        `Job completed successfully! 🎉`;
      
      await broadcastToConversations(agent, message);
    },

    onRefunded: async (jobId, to, amount) => {
      const message = 
        `🔄 **Job #${jobId} Refunded**\n\n` +
        `Amount: ${formatEth(amount)} ETH returned to ${to}.\n` +
        `Deadline passed without delivery.`;
      
      await broadcastToConversations(agent, message);
    },
  });

  // Log when agent starts
  agent.on("start", () => {
    console.log("🎉 Agent is now online and ready!");
  });

  // Start the agent
  await agent.start();
}

main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
