import type {
  AgentCompositionSlotRecord,
  SdkworkAgentsAppClient,
} from "@sdkwork/agents-pc-core/sdk/agentsAppSdkClient";
import { syncAllOffsetPages } from "@sdkwork/agents-pc-core/sdk/pagination";

import type { AgentConfig } from "./AgentService";
import { AGENT_MEMORY_SLOT_ID, type AgentMemorySlotDirective } from "./agentMemoryModel";

type CompositionSlotKind =
  | "memory"
  | "knowledge"
  | "skill"
  | "prompt"
  | "drive"
  | "tool"
  | "mcp";
type CompositionTargetModule =
  | "memory"
  | "knowledgebase"
  | "skills"
  | "prompts"
  | "drive"
  | "tools"
  | "mcp";

interface DesiredCompositionSlot {
  slotId: string;
  slotKind: CompositionSlotKind;
  targetModule: CompositionTargetModule;
  targetRef: string;
}

/**
 * One agent attaches at most one memory, under a fixed slot id — the same shape
 * the project-level instructions and memory slots already use
 * (`slot.project.instructions`, `slot.project.memory` in `AgentProjectService`).
 * A per-space id would let a second attachment coexist and leave the runtime
 * guessing which one it is bound to.
 *
 * The id and the directive it is driven by are declared beside the slot rules in
 * `agentMemoryModel` and re-exported here, so the sync below and the service
 * that decides the directive cannot drift apart.
 */
export { AGENT_MEMORY_SLOT_ID, type AgentMemorySlotDirective } from "./agentMemoryModel";

function slotIdForRef(targetRef: string): string {
  const normalized = targetRef.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return `slot.${normalized || "resource"}`;
}

function memorySlot(spaceId: string): DesiredCompositionSlot {
  return {
    slotId: AGENT_MEMORY_SLOT_ID,
    slotKind: "memory",
    targetModule: "memory",
    targetRef: spaceId,
  };
}

function buildDesiredCompositionSlots(
  config: AgentConfig,
  memory: AgentMemorySlotDirective,
): DesiredCompositionSlot[] {
  const slots: DesiredCompositionSlot[] = [];

  if (memory.kind === "set" && memory.spaceId.trim()) {
    slots.push(memorySlot(memory.spaceId.trim()));
  }

  for (const knowledgeId of config.knowledgeBaseIds ?? []) {
    const targetRef = knowledgeId.startsWith("kb.") ? knowledgeId : `kb.space.${knowledgeId}`;
    slots.push({
      slotId: slotIdForRef(targetRef),
      slotKind: "knowledge",
      targetModule: "knowledgebase",
      targetRef,
    });
  }

  for (const skillId of config.skillIds ?? []) {
    const targetRef = skillId.startsWith("skill.") ? skillId : `skill.${skillId}`;
    slots.push({
      slotId: slotIdForRef(targetRef),
      slotKind: "skill",
      targetModule: "skills",
      targetRef,
    });
  }

  for (const toolId of config.toolIds ?? []) {
    const targetRef = toolId.includes(".") ? toolId : `tool.${toolId}`;
    slots.push({
      slotId: slotIdForRef(targetRef),
      slotKind: "tool",
      targetModule: "tools",
      targetRef,
    });
  }

  for (const serverKey of config.mcpServerKeys ?? []) {
    const targetRef = serverKey.includes(".") ? serverKey : serverKey;
    slots.push({
      slotId: slotIdForRef(`mcp.${targetRef}`),
      slotKind: "mcp",
      targetModule: "mcp",
      targetRef,
    });
  }

  return slots;
}

export async function syncAgentCompositionSlots(
  client: SdkworkAgentsAppClient,
  agentId: string,
  config: AgentConfig,
  memory: AgentMemorySlotDirective = { kind: "preserve" },
): Promise<void> {
  const desired = buildDesiredCompositionSlots(config, memory);
  const desiredIds = new Set(desired.map((slot) => slot.slotId));

  // Batch diff sync on agent save — `syncAllOffsetPages` is allowed per `PAGINATION_SPEC.md` §7.
  const existingItems = await syncAllOffsetPages<AgentCompositionSlotRecord>(
    (params) => client.ai.agents.compositionSlots.list(agentId, params),
    {},
  );

  for (const item of existingItems) {
    if (desiredIds.has(item.slotId)) {
      continue;
    }
    // A caller that is not editing the memory must not silently detach one:
    // unlike knowledge, skill, tool and mcp — whose slot ids are derived from
    // their target, so a change shows up as a different id — the memory slot has
    // a fixed id and no read-back, which makes "absent from `desired`" mean
    // "this caller did not mention it".
    if (item.slotId === AGENT_MEMORY_SLOT_ID && memory.kind !== "clear") {
      continue;
    }
    await client.ai.agents.compositionSlots.delete(agentId, item.slotId);
  }

  const existingById = new Map(existingItems.map((item) => [item.slotId, item]));
  for (const [index, slot] of desired.entries()) {
    const current = existingById.get(slot.slotId);
    if (current) {
      // The memory slot keeps its id while its target changes, so it is the one
      // kind that needs an update rather than a re-create.
      if (current.targetRef !== slot.targetRef || !current.enabled) {
        await client.ai.agents.compositionSlots.update(agentId, slot.slotId, {
          slotKind: slot.slotKind,
          targetModule: slot.targetModule,
          targetRef: slot.targetRef,
          priority: index + 1,
          enabled: true,
          requestedAt: new Date().toISOString(),
        });
      }
      continue;
    }

    await client.ai.agents.compositionSlots.create(agentId, {
      slotId: slot.slotId,
      slotKind: slot.slotKind,
      targetModule: slot.targetModule,
      targetRef: slot.targetRef,
      priority: index + 1,
      enabled: true,
      policyJson: "{}",
      requestedAt: new Date().toISOString(),
    });
  }
}
