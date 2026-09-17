/**
 * App-surface route constants for the Agents H5 root.
 *
 * Route ownership lives in the shell so the root `src/` only assembles routes.
 * Physical mobile paths may be shorter than PC paths, but route ids stay aligned
 * through APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md; the ids below are the
 * `app.agents.<domain>.<screen>` capability segment.
 */
export const CREATE_AGENT_ROUTE = "create-agent" as const;
export const CHAT_ROUTE = "chat" as const;

/** Agent catalog and marketplace mobile surfaces. */
export const AGENT_MARKET_ROUTE = "mobile/market" as const;
export const AGENT_MARKET_SEARCH_ROUTE = "mobile/market/search" as const;

/** Agent management surface ("My Agents"): list, edit, delete, restore, chat entry. */
export const MY_AGENTS_ROUTE = "mobile/my-agents" as const;
