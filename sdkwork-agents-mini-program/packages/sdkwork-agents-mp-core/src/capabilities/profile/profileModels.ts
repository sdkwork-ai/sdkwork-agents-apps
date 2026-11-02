/**
 * Profile domain models for the Agents mini program.
 *
 * The profile surface shows the caller's account state plus the avatar and
 * nickname they picked with the WeChat picker. The picker result stays on the
 * device: this root composes no user-directory transport, so nothing about the
 * identity is uploaded (`PRIVACY` statement in the profile copy).
 */

export interface AgentsMpProfileIdentity {
  readonly nickname: string;
  /** Locally persisted avatar file path, empty when the user picked none. */
  readonly avatarUrl: string;
}

export interface AgentsMpProfileAccount {
  readonly signedIn: boolean;
  /** Runtime profile id the build was produced for (for example `standalone.development`). */
  readonly environment: string;
}

export interface AgentsMpProfileSnapshot {
  readonly account: AgentsMpProfileAccount;
  readonly identity: AgentsMpProfileIdentity;
}
