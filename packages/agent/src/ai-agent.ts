/**
 * Munus AI Agent
 * AI-powered agent for managing paid tasks on Base blockchain via XMTP
 */

import { Agent } from "@xmtp/agent-sdk";
import { getTestUrl } from "@xmtp/agent-sdk/debug";
import "dotenv/config";
import OpenAI from 'openai';
import type { Address } from 'viem';
import * as escrow from './utils/escrow';
import { broadcastToConversations, startEventListener } from "./utils/event-listener";
import { ActionBuilder, inlineActionsMiddleware, registerAction, sendActions } from './utils/inline-actions';
import { fetchJobMetadata, getShortDescription } from './utils/ipfs';

console.log("🚀 Starting Munus AI Agent...");

// Check for required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is required!");
  console.error("💡 Add it to your .env file or use a different AI provider");
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define tools in OpenAI format (not Zod)
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getOpenJobs",
      description: "Get all open jobs available on the marketplace",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getJobDetails",
      description: "Get detailed information about a specific job",
      parameters: {
        type: "object",
        properties: {
          jobId: { type: "number", description: "The ID of the job" }
        },
        required: ["jobId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getMyJobs",
      description: "Get jobs created by or assigned to a user",
      parameters: {
        type: "object",
        properties: {
          userAddress: { type: "string", description: "User's Ethereum address" },
          type: { type: "string", enum: ["created", "working"], description: "Job type filter" }
        },
        required: ["userAddress", "type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getJobCount",
      description: "Get total number of jobs in the system",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "acceptJob",
      description: "Guide user to accept a job - provides transaction details and miniapp link for signing",
      parameters: {
        type: "object",
        properties: {
          jobId: { type: "number", description: "Job ID to accept" },
          userAddress: { type: "string", description: "User's wallet address" }
        },
        required: ["jobId", "userAddress"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "findJobsByIntent",
      description: "Find jobs matching user's intent (e.g., 'all jobs under 0.01 ETH', 'design jobs due next week')",
      parameters: {
        type: "object",
        properties: {
          maxAmount: { type: "string", description: "Maximum amount willing to work for (e.g., '0.01')" },
          category: { type: "string", description: "Job category or keyword" },
          maxDeadline: { type: "string", description: "Latest acceptable deadline (ISO date)" }
        },
        required: []
      }
    }
  }
];

// Tool execution handlers
async function executeTool(name: string, args: any) {
  switch (name) {
    case "getOpenJobs":
        const jobs = await escrow.getOpenJobs();
        if (jobs.length === 0) {
        return { message: "No open jobs" };
        }
      
      // Fetch descriptions for all jobs (with error handling)
      const jobsWithDescriptions = await Promise.all(
        jobs.map(async ({ id, job }) => {
          const metadata = await fetchJobMetadata(job.metadataCID);
        return {
            id,
            amount: escrow.formatEth(job.amount) + ' ETH',
            deadline: escrow.formatDeadline(job.deadline),
            creator: job.creator,
            description: getShortDescription(metadata),
            title: metadata?.title || `Job #${id}`
          };
        })
      );
      
      return { jobs: jobsWithDescriptions };
    
    case "getJobDetails":
      const job = await escrow.getJob(args.jobId);
      const metadata = await fetchJobMetadata(job.metadataCID);
      return { 
        jobId: args.jobId, 
        title: metadata?.title || `Job #${args.jobId}`,
        description: metadata?.description || 'No description available',
        requirements: metadata?.requirements || [],
        skills: metadata?.skills || [],
        creator: job.creator, 
        assignee: job.assignee, 
        amount: escrow.formatEth(job.amount) + ' ETH', 
        deadline: escrow.formatDeadline(job.deadline), 
        state: escrow.formatJobState(job.state),
        metadataCID: job.metadataCID
      };
    
    case "getMyJobs":
      const userJobs = args.type === 'created'
        ? await escrow.getJobsByCreator(args.userAddress as Address)
        : await escrow.getJobsByAssignee(args.userAddress as Address);
      return userJobs.length === 0
        ? { message: `No ${args.type} jobs` }
        : { jobs: userJobs.map(({ id, job }) => ({ id, amount: escrow.formatEth(job.amount) + ' ETH', state: escrow.formatJobState(job.state) })) };
    
    case "getJobCount":
      return { totalJobs: await escrow.getJobCount() };
    
    case "acceptJob":
      try {
        const job = await escrow.getJob(args.jobId);
        
        // Check if job is available to accept
        if (job.state !== 0) { // 0 = Open
          return { 
            error: "Job not available", 
            reason: `Job #${args.jobId} is in state: ${escrow.formatJobState(job.state)}`,
            currentState: escrow.formatJobState(job.state)
          };
        }
        
        if (job.assignee !== '0x0000000000000000000000000000000000000000') {
          return { 
            error: "Job already assigned",
            assignee: job.assignee
          };
        }
        
        // Return instructions for accepting the job
        const miniappUrl = process.env.MINIAPP_URL || "https://munus.vercel.app";
        return {
          success: true,
          jobId: args.jobId,
          amount: escrow.formatEth(job.amount) + ' ETH',
          deadline: escrow.formatDeadline(job.deadline),
          creator: job.creator,
          miniappLink: `${miniappUrl}/jobs/${args.jobId}?action=accept`,
          instructions: "Click the link above to sign the transaction and accept this job"
        };
      } catch (error: any) {
        return { error: "Failed to fetch job", message: error.message };
      }
    
    case "findJobsByIntent":
      try {
        const allJobs = await escrow.getOpenJobs();
        let filtered = allJobs;
        
        // Filter by max amount
        if (args.maxAmount) {
          const maxWei = BigInt(Math.floor(parseFloat(args.maxAmount) * 1e18));
          filtered = filtered.filter(({ job }) => job.amount <= maxWei);
        }
        
        // Filter by deadline
        if (args.maxDeadline) {
          const maxTimestamp = BigInt(Math.floor(new Date(args.maxDeadline).getTime() / 1000));
          filtered = filtered.filter(({ job }) => job.deadline <= maxTimestamp);
        }
        
        // Filter by category (search in metadata)
        if (args.category) {
          const keyword = args.category.toLowerCase();
          const jobsWithMetadata = await Promise.all(
            filtered.map(async ({ id, job }) => {
              const metadata = await fetchJobMetadata(job.metadataCID);
              return { id, job, metadata };
            })
          );
          
          filtered = jobsWithMetadata
            .filter(({ metadata }) => {
              if (!metadata) return false;
              const searchText = `${metadata.title} ${metadata.description} ${metadata.skills?.join(' ')}`.toLowerCase();
              return searchText.includes(keyword);
            })
            .map(({ id, job }) => ({ id, job }));
        }
        
        // Add descriptions to results
        const results = await Promise.all(
          filtered.map(async ({ id, job }) => {
            const metadata = await fetchJobMetadata(job.metadataCID);
            return {
              id,
              amount: escrow.formatEth(job.amount) + ' ETH',
              deadline: escrow.formatDeadline(job.deadline),
              creator: job.creator,
              description: getShortDescription(metadata),
              title: metadata?.title || `Job #${id}`
            };
          })
        );

        return {
          matchingJobs: results.length,
          jobs: results
        };
      } catch (error: any) {
        return { error: "Failed to search jobs", message: error.message };
      }
    
    default:
      return { error: "Unknown tool" };
  }
}


async function main() {
  const agent = await Agent.createFromEnv({ 
    env: process.env.XMTP_ENV === "production" ? "production" : "dev",
  });

  console.log("✅ AI Agent created successfully!");
  console.log(`📬 Test your agent: ${getTestUrl(agent.client)}`);
  console.log(`🤖 Agent inbox ID: ${agent.client.inboxId}`);
  console.log(`🌍 Environment: ${process.env.XMTP_ENV || "dev"}`);
  console.log(`🧠 AI Model: GPT-4o`);
  console.log("🎯 Listening for messages...\n");
  
  // Message deduplication to prevent double responses (hash -> timestamp)
  const processedMessages = new Map<string, number>();

  // Register Quick Action handlers
  registerAction("view-jobs", async (ctx) => {
    const jobs = await escrow.getOpenJobs();
    if (jobs.length === 0) {
      await ctx.sendText("No open jobs available at the moment. Create one to get started!");
      return;
    }

    let message = "📋 **Open Jobs:**\n\n";
    
    // Fetch descriptions for up to 5 jobs
    const jobsToShow = jobs.slice(0, 5);
    for (const { id, job } of jobsToShow) {
      const metadata = await fetchJobMetadata(job.metadataCID);
      const title = metadata?.title || `Job #${id}`;
      const description = getShortDescription(metadata);
      
      message += `**${title}**\n`;
      message += `📝 ${description}\n`;
      message += `💰 Amount: ${escrow.formatEth(job.amount)} ETH\n`;
      message += `⏰ Deadline: ${escrow.formatDeadline(job.deadline)}\n\n`;
    }

    await ctx.sendText(message);
  });

  registerAction("my-jobs", async (ctx) => {
    const userAddress = await ctx.getSenderAddress();
    if (!userAddress) {
      await ctx.sendText("Could not determine your address.");
      return;
    }

    const createdJobs = await escrow.getJobsByCreator(userAddress as Address);
    const workingJobs = await escrow.getJobsByAssignee(userAddress as Address);

    let message = "👤 **Your Jobs:**\n\n";
    
    if (createdJobs.length > 0) {
      message += "**Created by you:**\n";
      createdJobs.forEach(({ id, job }) => {
        message += `• Job #${id} - ${escrow.formatJobState(job.state)} - ${escrow.formatEth(job.amount)} ETH\n`;
      });
      message += "\n";
    }

    if (workingJobs.length > 0) {
      message += "**Working on:**\n";
      workingJobs.forEach(({ id, job }) => {
        message += `• Job #${id} - ${escrow.formatJobState(job.state)} - ${escrow.formatEth(job.amount)} ETH\n`;
      });
    }

    if (createdJobs.length === 0 && workingJobs.length === 0) {
      message += "You haven't created or accepted any jobs yet.";
    }

    await ctx.sendText(message);
  });

  registerAction("create-job", async (ctx) => {
    await ctx.sendText(
      "🎯 **Create a Job**\n\n" +
      "To create a new job:\n" +
      "1. Open the Munus miniapp: " + (process.env.MINIAPP_URL || "https://munus.vercel.app") + "\n" +
      "2. Fill in the job details\n" +
      "3. Lock your ETH in escrow\n" +
      "4. I'll notify everyone about the new opportunity!"
    );
  });

  // Use inline actions middleware
  agent.use(inlineActionsMiddleware);

  // Main AI-powered message handler
  agent.on("text", async (ctx) => {
    const message = ctx.message.content;
    const senderAddress = await ctx.getSenderAddress();
    
    // Deduplicate messages (XMTP can send duplicates)
    const messageHash = `${senderAddress}-${String(message).substring(0, 100)}`;
    const now = Date.now();
    const lastSeen = processedMessages.get(messageHash);
    
    if (lastSeen && (now - lastSeen < 5000)) {  // 5 second window
      console.log(`⚠️  Duplicate message detected (within 5s), ignoring`);
      return;
    }
    processedMessages.set(messageHash, now);
    
    // Clean up old entries (older than 1 minute)
    if (processedMessages.size > 50) {
      for (const [hash, timestamp] of processedMessages.entries()) {
        if (now - timestamp > 60000) {
          processedMessages.delete(hash);
        }
      }
    }

    console.log(`💬 Message from ${senderAddress}: ${message}`);

    // Group etiquette: Only respond if mentioned or replied to
    if (ctx.conversation.isGroup) {
      const agentAddress = agent.client.inboxId.toLowerCase();
      const messageContent = String(message).toLowerCase();
      
      // Check if agent is mentioned (e.g., @munus or contains agent address)
      const isMentioned = messageContent.includes('@munus') || 
                         messageContent.includes(agentAddress);
      
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

    // Easter egg: gm feature 🌅
    const messageStr = String(message).toLowerCase().trim();
    if (messageStr === 'gm' || messageStr === 'gn' || messageStr === 'hello' || messageStr === 'hi') {
      const responses = {
        'gm': '☀️ gm! Ready to help you manage jobs on Base! Try /help to get started.',
        'gn': '🌙 gn! Sweet dreams! Message me anytime about your jobs.',
        'hello': '👋 Hello! I\'m Munus, your AI assistant for paid tasks on Base!',
        'hi': '👋 Hi there! How can I help you with jobs today?'
      };
      await ctx.sendText(responses[messageStr as keyof typeof responses] || responses['hi']);
      return;
    }

    // Quick commands for common actions
    if (typeof message === 'string' && message.startsWith("/")) {
      if (message.startsWith("/help") || message.startsWith("/start")) {
        const actions = ActionBuilder.create(
          "welcome",
          "👋 **Welcome to Munus!**\n\n" +
          "I'm your AI assistant for managing paid tasks on Base blockchain.\n\n" +
          "**What I can help you with:**\n" +
          "• 📋 View open jobs\n" +
          "• ✅ Accept jobs (I'll guide you!)\n" +
          "• 👤 Check your jobs\n" +
          "• ➕ Create new jobs\n\n" +
          "Just ask me in natural language, like:\n" +
          "- \"Show me available jobs\"\n" +
          "- \"I want to accept job 1\"\n" +
          "- \"What are my jobs?\""
        )
          .add("view-jobs", "📋 View Open Jobs", "primary")
          .add("my-jobs", "👤 My Jobs", "secondary")
          .add("create-job", "➕ Create Job", "primary")
          .build();

        await sendActions(ctx.conversation, actions);
        return;
      }
      
      // Easter egg: /gm command
      if (message.startsWith("/gm")) {
        await ctx.sendText("☀️ gm ser! Let's build something cool together! 🚀");
        return;
      }
    }

    // Handle numeric responses (button clicks) - route to Quick Actions
    if (typeof message === 'string' && message.trim().match(/^[0-9]$/)) {
      console.log('  ↳ Ignoring numeric input (likely button response)');
      return;
    }
    
    // Simple keyword triggers for common queries
    const messageText = String(message).toLowerCase();
    
    // Handle "create job" requests
    if (messageText.includes('create') && messageText.includes('job')) {
      await ctx.sendText(
        "🎯 **Create a Job**\n\n" +
        "To create a new job:\n" +
        "1. Open the Munus miniapp: " + (process.env.MINIAPP_URL || "https://munus.vercel.app") + "\n" +
        "2. Connect your wallet\n" +
        "3. Fill in job details (description, deadline, payment)\n" +
        "4. Lock ETH in escrow\n" +
        "5. I'll notify everyone about the new opportunity!\n\n" +
        "💡 Jobs are trustless - funds are held in escrow until work is delivered."
      );
      return;
    }
    
    // Handle "accept job" requests - let AI handle with acceptJob tool
    if (messageText.includes('accept') && messageText.includes('job')) {
      // Fall through to AI - it will use the acceptJob tool
    }
    
    // Handle "open jobs" / "available jobs" requests
    if (messageText.includes('job') && (messageText.includes('available') || messageText.includes('open') || messageText === 'jobs')) {
      try {
        const result = await executeTool('getOpenJobs', {});
        const jobs = result.jobs as any[];
        if (!jobs || jobs.length === 0) {
          await ctx.sendText("No open jobs available at the moment. Create one to get started!");
          return;
        }
        
        let response = "📋 **Open Jobs:**\n\n";
        jobs.slice(0, 5).forEach((job: any) => {
          response += `**${job.title}**\n`;
          response += `📝 ${job.description}\n`;
          response += `💰 Amount: ${job.amount}\n`;
          response += `⏰ Deadline: ${job.deadline}\n\n`;
        });
        await ctx.sendText(response);
        return;
      } catch (error) {
        console.error("Error fetching jobs:", error);
        // Fall through to AI
      }
    }

    // AI-powered natural language processing with function calling
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'system',
          content: `You are Munus, an AI assistant for a P2P job marketplace on Base blockchain.

Your capabilities:
- Find and list available jobs using getOpenJobs
- Show job details using getJobDetails
- Check user's created/accepted jobs using getMyJobs
- **Help users accept jobs** using acceptJob (provides transaction link)
- Guide users to create new jobs via the miniapp at ${process.env.MINIAPP_URL || "https://munus.vercel.app"}

Context: Jobs are managed by an Escrow contract on Base Sepolia. User address: ${senderAddress || "unknown"}.

When users want to accept a job, use acceptJob tool to guide them through the signing process.
When users want to create jobs, direct them to the miniapp.
Be helpful, concise, and use tools to fetch real blockchain data.`
        }, {
          role: 'user',
          content: String(message)
        }],
        tools,
        tool_choice: 'auto'
      });

      const responseMessage = completion.choices[0].message;
      
      // If AI wants to call tools
      if (responseMessage.tool_calls) {
        const toolCalls = responseMessage.tool_calls;
        console.log(`🤖 AI calling ${toolCalls.length} tool(s)`);
        
        // Execute all tool calls
        const toolResults = await Promise.all(
          toolCalls.map(async (toolCall) => {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await executeTool(toolCall.function.name, args);
            return {
              tool_call_id: toolCall.id,
              role: 'tool' as const,
              content: JSON.stringify(result)
            };
          })
        );
        
        // Get final response with tool results
        const finalCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: `You are Munus. Format responses nicely. User: ${senderAddress}` },
            { role: 'user', content: String(message) },
            responseMessage,
            ...toolResults
          ]
        });
        
        await ctx.sendText(finalCompletion.choices[0].message.content || "Done!");
      } else {
        // Direct response without tools
        await ctx.sendText(responseMessage.content || "I'm here to help!");
      }
    } catch (error) {
      console.error("AI error:", error);
      await ctx.sendText("Sorry, I encountered an error. Try /help");
    }
  });

  // Start contract event listener
  startEventListener({
    onJobCreated: async (jobId, creator, token, amount, deadline, metadataCID) => {
      const message = 
        `🎯 **New Job Created!**\n\n` +
        `**Job #${jobId}**\n` +
        `💰 Amount: ${escrow.formatEth(amount)} ETH\n` +
        `⏰ Deadline: ${escrow.formatDeadline(deadline)}\n` +
        `👤 Posted by: ${creator}\n\n` +
        `Ready to work? Ask me "tell me about job ${jobId}" or open the miniapp!`;
      
      await broadcastToConversations(agent, message);
    },

    onJobAccepted: async (jobId, assignee) => {
      const message = 
        `✅ **Job #${jobId} Accepted!**\n\n` +
        `👷 Assignee: ${assignee}\n\n` +
        `The work has begun! Good luck! 🚀`;
      
      await broadcastToConversations(agent, message);
    },

    onJobDelivered: async (jobId, artifactHash, attestationCID) => {
      const message = 
        `📦 **Job #${jobId} Delivered!**\n\n` +
        `📄 Artifact: ${artifactHash.slice(0, 10)}...${artifactHash.slice(-8)}\n` +
        `${attestationCID ? `🔐 Attestation: ${attestationCID}\n` : ''}` +
        `\nJob creator: Please review and release payment in the miniapp! 💰`;
      
      await broadcastToConversations(agent, message);
    },

    onReleased: async (jobId, to, amount) => {
      const message = 
        `💰 **Payment Released!**\n\n` +
        `**Job #${jobId}**\n` +
        `Amount: ${escrow.formatEth(amount)} ETH\n` +
        `Recipient: ${to}\n\n` +
        `Job completed successfully! Great work everyone! 🎉`;
      
      await broadcastToConversations(agent, message);
    },

    onRefunded: async (jobId, to, amount) => {
      const message = 
        `🔄 **Job #${jobId} Refunded**\n\n` +
        `Amount: ${escrow.formatEth(amount)} ETH returned to ${to}.\n` +
        `The deadline passed without delivery.`;
      
      await broadcastToConversations(agent, message);
    },
  });

  // Log when agent starts
  agent.on("start", () => {
    console.log("🎉 AI Agent is now online and ready!");
  });

  // Start the agent
  await agent.start();
}

main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});

