import { type SdkworkAgentsAppClient } from "@sdkwork/agents-mp-core/sdk";

/**
 * Built-in assistant provisioning.
 *
 * Creating and updating agent records belongs to the agents capability, not to
 * the conversation surface (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section
 * 5). The conversation capability therefore consumes provisioning through an
 * injected port and this module supplies the SDK-backed implementation.
 *
 * The request shapes mirror `sdkwork-agents-h5-agents` so the same record is
 * produced regardless of which client root provisions it first.
 */

/** Agent id of the built-in conversational assistant (shared by all roots). */
export const AGENTS_MP_DEFAULT_CONVERSATION_AGENT_ID = "agent.chat.default";

const DEFAULT_AGENT_BINDING_ID = "binding.manifest.default";
const DEFAULT_AGENT_PROVIDER_ID = "provider.agent.manifest";
const DEFAULT_AGENT_CONFIGURATION_PROFILE_ID = "profile.agent.manifest.default";
const DEFAULT_AGENT_PROVIDER_CAPABILITIES = ["model.chat", "tool.invoke"] as const;

const ASSISTANT_NAME = "SDKWork Agents";
const ASSISTANT_DESCRIPTION = "SDKWork Agents built-in conversational assistant.";
const ASSISTANT_SYSTEM_PROMPT =
  "You are SDKWork Agents. Provide accurate, concise, secure, and useful answers.";
const ASSISTANT_WELCOME_MESSAGE = "How can I help?";

export interface AgentsMpDefaultAssistantDraft {
  readonly name: string;
  readonly description: string;
  readonly systemPrompt: string;
  readonly welcomeMessage: string;
  readonly model: string;
}

export function createAgentsMpDefaultAssistantDraft(model: string): AgentsMpDefaultAssistantDraft {
  return {
    name: ASSISTANT_NAME,
    description: ASSISTANT_DESCRIPTION,
    systemPrompt: ASSISTANT_SYSTEM_PROMPT,
    welcomeMessage: ASSISTANT_WELCOME_MESSAGE,
    model,
  };
}

/** Manifest accepted by `POST /ai/agents` for a built-in assistant. */
export function buildAgentsMpAgentManifest(
  draft: AgentsMpDefaultAssistantDraft,
  agentId: string = AGENTS_MP_DEFAULT_CONVERSATION_AGENT_ID,
): Record<string, unknown> {
  return {
    schema_version: "1.0.0",
    manifest_type: "agent",
    agent_id: agentId,
    name: agentId,
    display_name: draft.name,
    description: draft.systemPrompt,
    version: "0.1.0",
    domain: "intelligence",
    required_capabilities: [{ capability_id: "model.chat" }],
    optional_capabilities: [
      { capability_id: "tool.invoke" },
      { capability_id: "knowledge.read" },
      { capability_id: "memory.query" },
    ],
    event_families: ["agent.lifecycle"],
    owner: { name: "sdkwork-agents-mini-program" },
    status: "active",
  };
}

export interface AgentsMpAgentProvisioner {
  /** Returns the built-in assistant id, creating the record when absent. */
  ensureBuiltInAssistant(model: string): Promise<string>;
  /** Syncs the assistant model. Requires `ai.agents.manage`. */
  updateAssistantModel(agentId: string, model: string): Promise<void>;
  /** Creates the default provider binding after publish (`ai.agents.manage`). */
  publishAssistant(agentId: string): Promise<void>;
}

function isAgentNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const record = error as Record<string, unknown>;
  const status = record.status ?? record.statusCode ?? record.httpStatus;
  if (status === 404 || status === "404") {
    return true;
  }
  const problem = record.problem as Record<string, unknown> | undefined;
  return problem?.status === 404 || problem?.status === "404";
}

function isBindingConflictError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const message = error instanceof Error ? error.message : String(error);
  return message.includes(DEFAULT_AGENT_BINDING_ID) || message.includes("already exists");
}

export function createAgentsMpAgentProvisioner(
  client: SdkworkAgentsAppClient,
): AgentsMpAgentProvisioner {
  return {
    async ensureBuiltInAssistant(model) {
      try {
        const existing = await client.ai.agents.retrieve(AGENTS_MP_DEFAULT_CONVERSATION_AGENT_ID);
        return existing.agentId ?? AGENTS_MP_DEFAULT_CONVERSATION_AGENT_ID;
      } catch (error) {
        if (!isAgentNotFoundError(error)) {
          throw error;
        }
      }
      const draft = createAgentsMpDefaultAssistantDraft(model);
      const created = await client.ai.agents.create({
        agentId: AGENTS_MP_DEFAULT_CONVERSATION_AGENT_ID,
        code: AGENTS_MP_DEFAULT_CONVERSATION_AGENT_ID,
        displayName: draft.name,
        description: draft.description,
        manifest: buildAgentsMpAgentManifest(draft),
        managementProfile: {
          type: "normal",
          model: draft.model,
          systemPrompt: draft.systemPrompt,
          welcomeMessage: draft.welcomeMessage,
        },
        implementationProviderId: null,
        implementationKind: "manifest-only",
        visibility: "private",
        tags: [],
        requestedAt: new Date().toISOString(),
      });
      return created.agentId ?? AGENTS_MP_DEFAULT_CONVERSATION_AGENT_ID;
    },

    async updateAssistantModel(agentId, model) {
      const current = await client.ai.agents.retrieve(agentId);
      const draft = createAgentsMpDefaultAssistantDraft(model);
      await client.ai.agents.update(agentId, {
        displayName: draft.name,
        description: draft.description,
        manifest: buildAgentsMpAgentManifest(draft, agentId),
        managementProfile: {
          type: "normal",
          model,
          systemPrompt: draft.systemPrompt,
          welcomeMessage: draft.welcomeMessage,
        },
        requestedAt: new Date().toISOString(),
        ...(current.version ? { expectedVersion: current.version } : {}),
      });
    },

    async publishAssistant(agentId) {
      try {
        await client.ai.agents.providerBindings.create(agentId, {
          bindingId: DEFAULT_AGENT_BINDING_ID,
          providerId: DEFAULT_AGENT_PROVIDER_ID,
          implementationKind: "manifest-only",
          configurationProfileId: DEFAULT_AGENT_CONFIGURATION_PROFILE_ID,
          capabilities: [...DEFAULT_AGENT_PROVIDER_CAPABILITIES],
          makeDefault: true,
          requestedAt: new Date().toISOString(),
        });
      } catch (error) {
        if (!isBindingConflictError(error)) {
          throw error;
        }
      }
    },
  };
}
