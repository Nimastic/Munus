/**
 * Inline Actions (Quick Actions) for Base App
 * Based on coinbase.com/actions:1.0 content type
 */

import type { Conversation } from "@xmtp/node-sdk";
import type { MessageContext } from "@xmtp/agent-sdk";

export type ActionStyle = "primary" | "secondary" | "danger";

export interface Action {
  id: string;
  label: string;
  imageUrl?: string;
  style?: ActionStyle;
  expiresAt?: string;
}

export interface ActionsContent {
  id: string;
  description: string;
  actions: Action[];
  expiresAt?: string;
}

// Action handler registry
const actionHandlers = new Map<string, (ctx: MessageContext) => Promise<void>>();

/**
 * Register an action handler
 */
export function registerAction(
  actionId: string,
  handler: (ctx: MessageContext) => Promise<void>
) {
  actionHandlers.set(actionId, handler);
}

/**
 * Get action handler
 */
export function getActionHandler(actionId: string) {
  return actionHandlers.get(actionId);
}

/**
 * Action builder utility
 */
export class ActionBuilder {
  private id: string;
  private description: string;
  private actions: Action[] = [];
  private expiresAt?: string;

  private constructor(id: string, description: string) {
    this.id = id;
    this.description = description;
  }

  static create(id: string, description: string): ActionBuilder {
    return new ActionBuilder(id, description);
  }

  add(
    id: string,
    label: string,
    style: ActionStyle = "primary",
    imageUrl?: string
  ): ActionBuilder {
    this.actions.push({ id, label, style, imageUrl });
    return this;
  }

  expires(expiresAt: string): ActionBuilder {
    this.expiresAt = expiresAt;
    return this;
  }

  build(): ActionsContent {
    return {
      id: this.id,
      description: this.description,
      actions: this.actions,
      expiresAt: this.expiresAt,
    };
  }
}

/**
 * Send Quick Actions to a conversation
 */
export async function sendActions(
  conversation: Conversation,
  actions: ActionsContent
): Promise<void> {
  // For now, send as structured text since we're using the agent-sdk's simple approach
  // In production, this would use the ActionsCodec
  let message = `${actions.description}\n\n`;
  actions.actions.forEach((action, index) => {
    message += `[${index + 1}] ${action.label}\n`;
  });
  message += `\nReply with the number to select`;

  await conversation.send(message);
}

/**
 * Middleware for handling inline actions
 */
export async function inlineActionsMiddleware(
  ctx: MessageContext,
  next: () => Promise<void>
): Promise<void> {
  const content = ctx.message.content;

  // Check if this is a numeric response to action selection
  if (typeof content === "string" && /^\d+$/.test(content.trim())) {
    // This might be an action selection, but we need context
    // For now, just pass through
    await next();
    return;
  }

  await next();
}

