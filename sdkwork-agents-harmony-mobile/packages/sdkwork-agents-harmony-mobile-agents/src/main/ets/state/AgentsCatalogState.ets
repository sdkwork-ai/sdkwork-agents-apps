/**
 * Package-local state slice descriptor.
 *
 * State stays package-local unless declared as a public integration contract.
 */
export interface AgentsCatalogStateSlice {
  readonly selectedAgentId?: string;
  readonly lastLoadedProfileId?: string;
}

export const initialAgentsCatalogStateSlice: AgentsCatalogStateSlice = {};
