// Base Miniapp Configuration
// This file configures your manifest and metadata for Base App

const ROOT_URL = process.env.NEXT_PUBLIC_MINIAPP_URL || 'https://munus-miniapp-jo66.vercel.app';

export const minikitConfig = {
  accountAssociation: {
    // This will be filled in after you generate credentials at base.dev/preview
    "header": "",
    "payload": "",
    "signature": ""
  },
  miniapp: {
    version: "1",
    name: "Munus",
    subtitle: "Chat-native Jobs with AI",
    description: "Post jobs in XMTP group chats, coordinate with AI agents, and get paid instantly on Base. Frictionless freelance marketplace with Civic auth, ENS identity, and trustless escrow.",
    screenshotUrls: [
      `${ROOT_URL}/screenshot-home.png`,
      `${ROOT_URL}/screenshot-jobs.png`,
      `${ROOT_URL}/screenshot-detail.png`
    ],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#3b82f6", // Blue
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "business",
    tags: ["jobs", "freelance", "ai", "xmtp", "base", "civic"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Chat-native jobs where AI coordinates and Base secures payment",
    ogTitle: "Munus - Chat-native Job Marketplace",
    ogDescription: "Post jobs in chat, coordinate with AI, get paid on Base. Built for ETHRome 2025.",
    ogImageUrl: `${ROOT_URL}/og-image.png`,
  },
} as const;

export type MiniKitConfig = typeof minikitConfig;

