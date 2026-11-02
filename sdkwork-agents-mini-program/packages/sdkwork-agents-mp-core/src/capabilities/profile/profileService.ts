import {
  type AgentsMpProfileIdentity,
  type AgentsMpProfileSnapshot,
} from "./profileModels";

/**
 * Profile orchestration.
 *
 * Platform facts (whether a session token exists, which runtime profile the build
 * targets, where the device stores values) are supplied through an injected port,
 * so this service reads no `wx.*` API itself
 * (`APP_MINI_PROGRAM_UI_SPEC.md` section 1).
 */

/** Device storage key for the locally chosen avatar and nickname. */
export const AGENTS_MP_PROFILE_IDENTITY_STORAGE_KEY = "sdkwork-agents-mp:profile-identity:v1";

export interface AgentsMpProfilePort {
  readSignedIn(): boolean;
  readEnvironment(): string;
  readStorage(key: string): string | null;
  writeStorage(key: string, value: string): void;
}

export interface AgentsMpProfileService {
  loadProfile(): AgentsMpProfileSnapshot;
  saveIdentity(identity: Partial<AgentsMpProfileIdentity>): AgentsMpProfileSnapshot;
}

const EMPTY_IDENTITY: AgentsMpProfileIdentity = { nickname: "", avatarUrl: "" };

function parseIdentity(raw: string | null): AgentsMpProfileIdentity {
  if (!raw) {
    return EMPTY_IDENTITY;
  }
  try {
    const parsed = JSON.parse(raw) as { nickname?: unknown; avatarUrl?: unknown };
    return {
      nickname: typeof parsed.nickname === "string" ? parsed.nickname : "",
      avatarUrl: typeof parsed.avatarUrl === "string" ? parsed.avatarUrl : "",
    };
  } catch {
    return EMPTY_IDENTITY;
  }
}

export function createAgentsMpProfileService(
  port: AgentsMpProfilePort,
): AgentsMpProfileService {
  const readSnapshot = (): AgentsMpProfileSnapshot => ({
    account: {
      signedIn: port.readSignedIn(),
      environment: port.readEnvironment(),
    },
    identity: parseIdentity(port.readStorage(AGENTS_MP_PROFILE_IDENTITY_STORAGE_KEY)),
  });

  return {
    loadProfile() {
      return readSnapshot();
    },

    saveIdentity(identity) {
      const current = readSnapshot().identity;
      const next: AgentsMpProfileIdentity = {
        nickname:
          typeof identity.nickname === "string" ? identity.nickname.trim() : current.nickname,
        avatarUrl:
          typeof identity.avatarUrl === "string" ? identity.avatarUrl : current.avatarUrl,
      };
      port.writeStorage(AGENTS_MP_PROFILE_IDENTITY_STORAGE_KEY, JSON.stringify(next));
      return readSnapshot();
    },
  };
}
