/**
 * Profile hub types (`app.agents.profile.index`).
 *
 * The profile hub is reachable from every tab and is the only route to the
 * secondary PC surfaces. Account facts come from the host IAM runtime through
 * the injected port; links are navigation metadata owned by the shell.
 */

export interface ProfileAccount {
  readonly signedIn: boolean;
  readonly displayName?: string;
  readonly avatarUrl?: string;
  readonly environment?: string;
}

export interface ProfileMembership {
  readonly active: boolean;
  readonly label?: string;
}

/** Compact account usage shown on the profile hub. */
export interface ProfileUsage {
  readonly turnCount: string;
  readonly inputTokens: string;
  readonly outputTokens: string;
}

export interface ProfileLink {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  /** Physical H5 path. */
  readonly path: string;
  readonly badge?: string;
}
