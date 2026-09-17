/**
 * Package-local state slice for the agents catalog.
 *
 * Sensitive state must clear on logout and account/tenant switch.
 */
export interface AgentsMpCatalogStateSlice {
  readonly page: number;
  readonly items: unknown[];
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly errorMessage: string;
}

export const initialAgentsMpCatalogState: AgentsMpCatalogStateSlice = {
  page: 1,
  items: [],
  hasMore: false,
  loading: true,
  errorMessage: "",
};

export function clearAgentsMpCatalogState(): AgentsMpCatalogStateSlice {
  return { ...initialAgentsMpCatalogState };
}
