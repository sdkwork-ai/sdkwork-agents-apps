/**
 * Conversation route contributions.
 *
 * The route identities are owned by the shell package so every client root
 * declares the same ids (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7).
 */

import {
  CONVERSATION_CHAT_ROUTE_ID,
  CONVERSATION_LIST_ROUTE_ID,
  CONVERSATION_PATH,
  CONVERSATION_LIST_PATH,
  type AgentsH5RouteContribution,
} from "@sdkwork/agents-h5-shell";

export const conversationRouteContributions: readonly AgentsH5RouteContribution[] = [
  {
    id: CONVERSATION_CHAT_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "conversation",
    screen: "chat",
    path: CONVERSATION_PATH,
    titleKey: "agents.conversation.title",
    auth: "required",
    permissionHint: "ai.agents.read",
    presentation: { h5Mobile: "tab" },
  },
  {
    id: CONVERSATION_LIST_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "conversation",
    screen: "list",
    path: CONVERSATION_LIST_PATH,
    titleKey: "agents.conversation.sessions.title",
    auth: "required",
    permissionHint: "ai.agents.read",
    presentation: { h5Mobile: "sheet" },
  },
];
