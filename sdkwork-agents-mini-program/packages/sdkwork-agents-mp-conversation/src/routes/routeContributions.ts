import {
  AGENTS_MP_CONVERSATION_CHAT_ROUTE_ID,
  AGENTS_MP_CONVERSATION_HISTORY_PAGE,
  AGENTS_MP_CONVERSATION_LIST_ROUTE_ID,
  AGENTS_MP_CONVERSATION_PAGE,
  type AgentsMpRouteContribution,
} from "@sdkwork/agents-mp-shell";

/**
 * Conversation route contributions.
 *
 * Route ids and page paths are owned by the shell package so every client root
 * declares the same identity (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md`
 * section 7).
 */
export const conversationMpRouteContributions: AgentsMpRouteContribution[] = [
  {
    id: AGENTS_MP_CONVERSATION_CHAT_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "conversation",
    screen: "chat",
    titleKey: "agents.conversation.title",
    auth: "required",
    permissionHint: "ai.agents.read",
    miniProgram: { rootPackage: true, pagePath: AGENTS_MP_CONVERSATION_PAGE, preload: true },
  },
  {
    id: AGENTS_MP_CONVERSATION_LIST_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "conversation",
    screen: "list",
    titleKey: "agents.conversation.sessions.title",
    auth: "required",
    permissionHint: "ai.agents.read",
    miniProgram: { rootPackage: false, subpackage: "agents-sessions", pagePath: AGENTS_MP_CONVERSATION_HISTORY_PAGE },
  },
];
