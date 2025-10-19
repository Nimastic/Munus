"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS || "0xb511e79390b62333309fd5ef3c348f85dc0df6ef";
const XMTP_ENV = process.env.NEXT_PUBLIC_XMTP_ENV || "dev";

export function XMTPChatLink() {
  const xmtpChatUrl = `https://xmtp.chat/dm/${AGENT_ADDRESS}?env=${XMTP_ENV}`;
  
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Chat with Munus AI</CardTitle>
        </div>
        <CardDescription>
          Get personalized job recommendations and instant help
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          💬 Ask in natural language: "Show me design jobs under 0.01 ETH"
        </p>
        <p className="text-sm text-muted-foreground">
          🔔 Get notified when new jobs match your skills
        </p>
        <p className="text-sm text-muted-foreground">
          ⚡ Accept jobs directly from chat - just say "I'll take it"
        </p>
        <Button 
          asChild 
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <a href={xmtpChatUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" />
            Open Chat with AI Agent
          </a>
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Opens in XMTP Chat (dev network)
        </p>
      </CardContent>
    </Card>
  );
}

export function XMTPQuickLink() {
  const xmtpChatUrl = `https://xmtp.chat/dm/${AGENT_ADDRESS}?env=${XMTP_ENV}`;
  
  return (
    <Button 
      variant="outline" 
      size="sm"
      asChild
    >
      <a href={xmtpChatUrl} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="mr-2 h-4 w-4" />
        Chat with AI
      </a>
    </Button>
  );
}

