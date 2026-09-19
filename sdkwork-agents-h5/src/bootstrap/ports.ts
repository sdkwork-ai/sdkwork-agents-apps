/**
 * Composition-root port wiring.
 *
 * Client capability packages `MUST NOT` construct or import generated SDK
 * clients; they declare ports and the application root injects the SDK-backed
 * implementations (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` sections 1, 5 and
 * 8). This module is the single place that bridges the two, so swapping a
 * transport (standalone session storage, a host-injected client such as
 * sdkwork-im-h5, or a future mini program runtime) only touches this file.
 */

import {
  agentChatService,
  agentService,
  loadMobileModelCatalog,
  type AgentConfig,
  type AgentTurnWireProtocol,
  type ChatMessage,
  type ChatSessionSummary,
} from "@sdkwork/agents-h5-agents";
import {
  DEFAULT_CONVERSATION_AGENT_ID,
  configureConversationPort,
  type ConversationMessage,
  type ConversationPort,
  type ConversationSession,
} from "@sdkwork/agents-h5-conversation";
import { configureLibraryPort, type LibraryPort } from "@sdkwork/agents-h5-library";
import { configureProjectsPort, type ProjectsPort } from "@sdkwork/agents-h5-projects";
import { configureAutomationPort, type AutomationPort } from "@sdkwork/agents-h5-automation";
import {
  getAgentsAppSdkClientWithSession,
  getDriveAppSdkClientWithSession,
  CHAT_FILE_LIBRARY_PROPERTY_KEY,
  type AgentProjectRecord,
  type AgentTaskRecord,
} from "@sdkwork/agents-h5-core/sdk";
import { toOffsetPageInfo } from "@sdkwork/agents-h5-core/sdk/pagination";
import { createSdkworkChatRequestContext } from "@sdkwork/agents-h5-core/session";

/** Bounded fan-out for the automation tab (agent list page size). */
const AUTOMATION_AGENT_FANOUT = 10;
/** Bounded per-agent task page size for the automation tab. */
const AUTOMATION_AGENT_TASK_PAGE_SIZE = 20;
/** Memo TTL for the aggregated automation listing. */
const AUTOMATION_CACHE_TTL_MS = 30_000;

const AGENT_TURN_WIRE_PROTOCOLS = new Set<AgentTurnWireProtocol>([
  "chat_completions",
  "anthropic_messages",
  "google_content",
  "openai_responses",
]);

/** Narrows an untyped wire-protocol hint onto the generated request union. */
function toWireProtocol(value?: string): AgentTurnWireProtocol | undefined {
  return value && AGENT_TURN_WIRE_PROTOCOLS.has(value as AgentTurnWireProtocol)
    ? (value as AgentTurnWireProtocol)
    : undefined;
}

function toConversationMessage(message: ChatMessage): ConversationMessage {
  return {
    id: message.id,
    role: message.role,
    text: message.content,
    ...(message.createdAt ? { createdAt: message.createdAt } : {}),
    ...(message.reasoning ? { reasoning: message.reasoning } : {}),
    ...(message.toolCalls?.length ? { toolCalls: message.toolCalls } : {}),
  };
}

function toConversationSession(summary: ChatSessionSummary): ConversationSession {
  const parsed = Date.parse(summary.updatedAt);
  return {
    id: summary.id,
    title: summary.title,
    // The conversation surface sorts by epoch milliseconds (locale-independent),
    // while the wire record carries an ISO timestamp.
    updatedAt: Number.isFinite(parsed) ? parsed : Date.now(),
    version: summary.version,
  };
}

function toAgentRecord(agent: AgentConfig | null): {
  id: string;
  name?: string;
  model?: string;
  systemPrompt?: string;
  welcomeMessage?: string;
} | null {
  if (!agent?.id) {
    return null;
  }
  return {
    id: agent.id,
    ...(agent.name ? { name: agent.name } : {}),
    ...(agent.model ? { model: agent.model } : {}),
    ...(agent.systemPrompt ? { systemPrompt: agent.systemPrompt } : {}),
    ...(agent.welcomeMessage ? { welcomeMessage: agent.welcomeMessage } : {}),
  };
}

/** The library property may not be provisioned for a caller yet; treat 404 as empty. */
function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const record = error as Record<string, unknown>;
  const status = record.status ?? record.statusCode ?? record.httpStatus;
  if (status === 404 || status === "404") {
    return true;
  }
  if (record.code === "NOT_FOUND" || record.code === 40401) {
    return true;
  }
  const problem = record.problem;
  if (problem && typeof problem === "object") {
    const detail = problem as Record<string, unknown>;
    if (detail.status === 404 || detail.status === "404" || detail.code === 40401) {
      return true;
    }
  }
  return false;
}

function toProjectSummary(record: AgentProjectRecord) {
  return {
    id: record.projectId,
    name: record.name,
    ...(record.description ? { description: record.description } : {}),
    ...(record.status ? { status: String(record.status) } : {}),
    ...(record.updatedAt ? { updatedAt: record.updatedAt } : {}),
  };
}

function describeSchedule(record: AgentTaskRecord): string | undefined {
  if (record.scheduleKind === "cron" && record.cronExpression) {
    return record.cronExpression;
  }
  if (record.scheduledAt) {
    return record.scheduledAt;
  }
  return undefined;
}

function toTaskSummary(record: AgentTaskRecord) {
  const schedule = describeSchedule(record);
  return {
    id: record.taskId,
    name: record.title ?? record.prompt.slice(0, 60),
    status: record.status,
    ...(schedule ? { schedule } : {}),
    ...(record.updatedAt ? { updatedAt: record.updatedAt } : {}),
  };
}

let automationCache: { expiresAt: number; tasks: ReturnType<typeof toTaskSummary>[] } | null = null;

/**
 * The Agents app API scopes scheduled tasks to one managed agent, so the
 * automation tab aggregates the caller's own agents with a bounded fan-out and
 * memoizes the result for the tab's lifetime.
 */
async function collectAutomationTasks(): Promise<ReturnType<typeof toTaskSummary>[]> {
  const now = Date.now();
  if (automationCache && automationCache.expiresAt > now) {
    return automationCache.tasks;
  }

  const client = getAgentsAppSdkClientWithSession();
  const agents = await agentService.listAgentsPage({
    page: 1,
    pageSize: AUTOMATION_AGENT_FANOUT,
    scope: "mine",
  });
  const agentIds = agents.items
    .map((agent) => agent.id)
    .filter((id): id is string => Boolean(id));

  const settled = await Promise.allSettled(
    agentIds.map(async (agentId) => {
      const response = await client.ai.agents.tasks.list(agentId, {
        pageSize: AUTOMATION_AGENT_TASK_PAGE_SIZE,
      });
      return (response.items as AgentTaskRecord[]).map(toTaskSummary);
    }),
  );

  const failures = settled.filter((entry) => entry.status === "rejected");
  if (agentIds.length > 0 && failures.length === settled.length) {
    // Every agent failed: surface the first reason instead of an empty tab.
    throw (failures[0] as PromiseRejectedResult).reason;
  }

  const tasks = settled.flatMap((entry) =>
    entry.status === "fulfilled" ? entry.value : [],
  );
  tasks.sort((left, right) => (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""));
  automationCache = { expiresAt: now + AUTOMATION_CACHE_TTL_MS, tasks };
  return tasks;
}

/** Test-only reset for the memoized automation aggregation. */
export function resetAutomationCache(): void {
  automationCache = null;
}

function createConversationPort(): ConversationPort {
  return {
    async getAgent(agentId) {
      return toAgentRecord(await agentService.getAgent(agentId));
    },

    async createAgent(draft) {
      const created = await agentService.createAgent({
        id: draft.id,
        name: draft.name,
        description: draft.description,
        type: draft.type,
        model: draft.model,
        systemPrompt: draft.systemPrompt,
        welcomeMessage: draft.welcomeMessage,
      });
      return toAgentRecord(created) ?? { id: draft.id, name: draft.name };
    },

    async updateAgentModel(agentId, model) {
      await agentService.updateAgent(agentId, { model });
    },

    async resolveDefaultModel() {
      const catalog = await loadMobileModelCatalog();
      const preferred = catalog.find((item) => item.defaultForEngine) ?? catalog[0];
      if (!preferred) {
        throw new Error("Agent engine runtime catalog is unavailable.");
      }
      return preferred.id;
    },

    async listSessions(agentId) {
      const sessions = await agentChatService.listSessionSummaries(agentId);
      return sessions.map(toConversationSession);
    },

    async createSession(agentId, title) {
      return toConversationSession(await agentChatService.createSessionSummary(agentId, title));
    },

    async renameSession(agentId, sessionId, title) {
      await agentChatService.updateSession(agentId, sessionId, { title });
    },

    async deleteSession(agentId, sessionId) {
      await agentChatService.deleteSession(agentId, sessionId);
    },

    async listMessagesPage(agentId, sessionId, cursor) {
      // Newest-first window plus a backward cursor: the transcript loads one
      // bounded page and pages toward older items on scroll (PAGINATION_SPEC §8).
      const page = await agentChatService.listRecentMessagesPage(agentId, sessionId, cursor);
      return {
        items: page.items.map(toConversationMessage),
        hasMore: page.pageInfo.hasMore,
        ...(page.pageInfo.nextCursor ? { nextCursor: page.pageInfo.nextCursor } : {}),
      };
    },

    async sendTurn(request) {
      const message = await agentChatService.sendMessage(
        request.agentId,
        request.sessionId,
        request.content,
        request.model,
        request.systemPrompt,
        toWireProtocol(request.wireProtocol),
      );
      return { id: message.id, content: message.content };
    },

    async streamTurn(request, handlers) {
      const message = await agentChatService.sendMessageStream(
        request.agentId,
        request.sessionId,
        request.content,
        request.model,
        (delta) => handlers.onDelta?.(delta),
        request.systemPrompt,
        handlers.onReasoning ? (reasoning) => handlers.onReasoning?.(reasoning) : undefined,
        handlers.onToolEvent ? (event) => handlers.onToolEvent?.(event) : undefined,
        toWireProtocol(request.wireProtocol),
      );
      return { id: message.id, content: message.content };
    },

    readPermissionScope() {
      return createSdkworkChatRequestContext()?.permissionScope ?? [];
    },
  };
}

function createLibraryPort(): LibraryPort {
  return {
    async listFiles(pageSize, cursor) {
      try {
        const result = await getDriveAppSdkClientWithSession().drive.propertyNodes.list(
          CHAT_FILE_LIBRARY_PROPERTY_KEY,
          { pageSize: String(pageSize), ...(cursor ? { cursor } : {}) },
        );
        return {
          items: result.items.map((node) => ({
            id: node.id,
            name: node.nodeName,
            ...(node.contentType ? { mimeType: node.contentType } : {}),
            ...(node.contentLength ? { sizeBytes: node.contentLength } : {}),
            ...(node.updatedAt ? { updatedAt: node.updatedAt } : {}),
            ...(node.spaceId ? { spaceId: node.spaceId } : {}),
          })),
          nextCursor: result.pageInfo.nextCursor ?? null,
        };
      } catch (error) {
        if (isNotFoundError(error)) {
          return { items: [], nextCursor: null };
        }
        throw error;
      }
    },

    async resolvePreviewUrl(nodeId) {
      const response = await getDriveAppSdkClientWithSession().drive.nodes.downloadUrls.retrieve(
        nodeId,
        { requestedTtlSeconds: 900 },
      );
      return response.downloadUrl;
    },
  };
}

function createProjectsPort(): ProjectsPort {
  return {
    async listProjects(page, pageSize) {
      const response = await getAgentsAppSdkClientWithSession().ai.agents.projects.list({
        page,
        pageSize,
      });
      const pageInfo = toOffsetPageInfo(response.pageInfo);
      return {
        items: (response.items as AgentProjectRecord[]).map(toProjectSummary),
        page: pageInfo.page,
        hasMore: pageInfo.hasMore,
      };
    },
  };
}

function createAutomationPort(): AutomationPort {
  return {
    async listTasks(page, pageSize) {
      const tasks = await collectAutomationTasks();
      const start = (page - 1) * pageSize;
      return {
        items: tasks.slice(start, start + pageSize),
        page,
        hasMore: start + pageSize < tasks.length,
      };
    },
  };
}

/**
 * Wires every client capability port to its SDK-backed implementation. Called
 * once from the application bootstrap before the first render.
 */
export function configureAgentsH5Ports(): void {
  configureConversationPort(createConversationPort());
  configureLibraryPort(createLibraryPort());
  configureProjectsPort(createProjectsPort());
  configureAutomationPort(createAutomationPort());
}

export { DEFAULT_CONVERSATION_AGENT_ID };
