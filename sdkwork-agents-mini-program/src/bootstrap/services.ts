import {
  createAgentsMpAgentProvisioner,
  createAgentCatalogService,
  type AgentCatalogService,
} from "@sdkwork/agents-mp-agents";
import {
  createAgentsMpAutomationService,
  type AgentsMpAutomationAgentSource,
  type AgentsMpAutomationService,
} from "@sdkwork/agents-mp-automation";
import {
  createAgentsMpAssetsService,
  createAgentsMpCreativeService,
  createAgentsMpInspirationService,
  createAgentsMpMembershipService,
  createAgentsMpProfileService,
  createAgentsMpUsageService,
  type AgentsMpAssetsService,
  type AgentsMpCreativeService,
  type AgentsMpInspirationFeedPort,
  type AgentsMpInspirationItem,
  type AgentsMpInspirationService,
  type AgentsMpMembershipCatalogPort,
  type AgentsMpMembershipPlan,
  type AgentsMpMembershipService,
  type AgentsMpMembershipSummary,
  type AgentsMpProfileService,
  type AgentsMpUsageService,
} from "@sdkwork/agents-mp-core/capabilities";
import {
  createAgentsMpConversationService,
  type AgentsMpConversationService,
} from "@sdkwork/agents-mp-conversation";
import { getAgentsAppSdkClient, getDriveAppSdkClient } from "@sdkwork/agents-mp-core/sdk";
import {
  getFeedsOpenSdkClient,
  getMembershipAppSdkClient,
  bootstrapAgentsMpOrderService,
  getAgentsMpMembershipCheckoutService,
} from "@sdkwork/agents-mp-core/sdk";
import {
  createAgentsMpLibraryService,
  type AgentsMpLibraryService,
} from "@sdkwork/agents-mp-library";
import {
  createAgentsMpProjectsService,
  type AgentsMpProjectsService,
} from "@sdkwork/agents-mp-projects";

import { createCreativeRunStore, createProfilePort } from "./platformStores";

/**
 * Capability service composition for the Agents mini program.
 *
 * This is the single place where capability services are wired to the generated
 * app SDK clients, the device store, and the session facts; capability code only
 * ever receives an injected client or a narrow port
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 5 and section 8). Platform
 * pages call these factories instead of constructing transport themselves.
 */

interface AgentsMpRawAgentListRecord {
  readonly agentId?: string;
  readonly id?: string;
}

function createManagedAgentSource(client: ReturnType<typeof getAgentsAppSdkClient>): AgentsMpAutomationAgentSource {
  return {
    async listManagedAgentIds(limit) {
      const response = await client.ai.agents.list({
        scope: "mine",
        page: 1,
        pageSize: limit,
      });
      return (response.items as AgentsMpRawAgentListRecord[])
        .map((record) => record.agentId ?? record.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
    },
  };
}

const INSPIRATION_STREAM = "agents-inspiration-discover";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toInspirationItem(record: Record<string, unknown>): AgentsMpInspirationItem | null {
  const id = readString(record, "id");
  if (!id) {
    return null;
  }
  const payload = asRecord(record.payload) ?? {};
  const coverUrl = readString(payload, "src") ?? readString(record, "coverUrl");
  if (!coverUrl) {
    return null;
  }
  const author = asRecord(record.author);
  const mediaKind = readString(payload, "mediaKind") === "video" ? "video" : "image";
  const likes = record.reactionCount;
  return {
    id,
    title: readString(record, "title") ?? "",
    prompt: readString(payload, "prompt") ?? readString(record, "excerpt"),
    coverUrl,
    mediaKind,
    author: author ? readString(author, "name") : undefined,
    authorAvatarUrl: author ? readString(author, "avatarUrl") : undefined,
    likes: typeof likes === "number" ? likes : undefined,
    publishedAt: readString(record, "publishedAt"),
  };
}

function createInspirationFeedPort(): AgentsMpInspirationFeedPort {
  return {
    async listSegment(segment, cursor) {
      const page = await getFeedsOpenSdkClient().feeds.streams.items.list(
        INSPIRATION_STREAM,
        { pageSize: 20, ...(cursor ? { cursor } : {}) },
      );
      const items = page.items
        .map((record) => toInspirationItem(record))
        .filter((item): item is AgentsMpInspirationItem => item !== null);
      if (segment === "featured") {
        items.sort((left, right) => (right.likes ?? 0) - (left.likes ?? 0));
      }
      return {
        items: segment === "featured" ? items.slice(0, 6) : items,
        nextCursor: page.pageInfo?.nextCursor ?? null,
      };
    },
  };
}

function createMembershipCatalogPort(): AgentsMpMembershipCatalogPort {
  return {
    async loadCatalog() {
      const client = getMembershipAppSdkClient();
      const [currentResult, packagesResult, pointsResult] = await Promise.allSettled([
        client.memberships.current.retrieve(),
        client.memberships.packages.list({ status: "active", pageSize: 50 }),
        client.memberships.points.balance.retrieve(),
      ]);
      if (packagesResult.status === "rejected") {
        throw packagesResult.reason;
      }
      let summary: AgentsMpMembershipSummary = { active: false };
      if (currentResult.status === "fulfilled") {
        const current = currentResult.value;
        if ((Number(current.planRank) || 0) > 0 || current.membershipStatus === "active") {
          summary = {
            active: true,
            levelName: current.planName,
            expiresAt: current.expiresAt,
          };
        }
      }
      const plans: AgentsMpMembershipPlan[] = packagesResult.value.items.map((item) => ({
        id: String(item.id),
        name: item.name,
        priceLabel: item.price,
        benefits: item.tags ?? [],
      }));
      const rawPoints =
        pointsResult.status === "fulfilled"
          ? pointsResult.value.availablePoints ?? pointsResult.value.points
          : undefined;
      const pointsBalance =
        rawPoints !== undefined && Number.isFinite(Number(rawPoints))
          ? Number(rawPoints)
          : undefined;
      return {
        summary,
        plans,
        ...(pointsBalance !== undefined ? { pointsBalance } : {}),
      };
    },

    async startCheckout(planId) {
      const payment = await getAgentsMpMembershipCheckoutService().createCheckout({
        action: "purchase",
        packageId: Number(planId),
        paymentProduct: "mobile_cashier_h5",
      });
      return payment.cashierUrl;
    },
  };
}

export interface AgentsMpRuntimeServices {
  readonly catalog: AgentCatalogService;
  readonly conversation: AgentsMpConversationService;
  readonly library: AgentsMpLibraryService;
  readonly projects: AgentsMpProjectsService;
  readonly automation: AgentsMpAutomationService;
  readonly inspiration: AgentsMpInspirationService;
  readonly creative: AgentsMpCreativeService;
  readonly assets: AgentsMpAssetsService;
  readonly membership: AgentsMpMembershipService;
  readonly profile: AgentsMpProfileService;
  readonly usage: AgentsMpUsageService;
}

let cachedServices: AgentsMpRuntimeServices | null = null;

/**
 * Returns the session-scoped capability services.
 *
 * Services hold small caches (built-in assistant id, provisioned model,
 * automation aggregate), so pages must reuse one instance per session rather
 * than constructing a new one on every screen.
 */
export function getAgentsMpRuntimeServices(): AgentsMpRuntimeServices {
  if (!cachedServices) {
    cachedServices = createAgentsMpRuntimeServices();
  }
  return cachedServices;
}

/** Test-only reset for the session-scoped services. */
export function resetAgentsMpRuntimeServices(): void {
  cachedServices = null;
}

export function createAgentsMpRuntimeServices(): AgentsMpRuntimeServices {
  const client = getAgentsAppSdkClient();
  const driveClient = getDriveAppSdkClient();
  // Order/membership checkout shares the Agents session token boundary.
  bootstrapAgentsMpOrderService();
  const provisioner = createAgentsMpAgentProvisioner(client);

  const conversation = createAgentsMpConversationService(client, {
    async ensureAgent(model) {
      const resolved = model ?? (await conversation.resolveDefaultModel());
      return provisioner.ensureBuiltInAssistant(resolved);
    },
    async updateAgentModel(agentId, model) {
      await provisioner.updateAssistantModel(agentId, model);
    },
  });

  return {
    catalog: createAgentCatalogService(client),
    conversation,
    library: createAgentsMpLibraryService(driveClient),
    projects: createAgentsMpProjectsService(client),
    automation: createAgentsMpAutomationService(client, createManagedAgentSource(client)),
    // The inspiration feed and the membership catalog read their real
    // transports; checkout stays explicit until the order/payment flow is wired.
    inspiration: createAgentsMpInspirationService(createInspirationFeedPort()),
    creative: createAgentsMpCreativeService(client, createCreativeRunStore(), driveClient),
    assets: createAgentsMpAssetsService(client, driveClient),
    membership: createAgentsMpMembershipService(createMembershipCatalogPort()),
    profile: createAgentsMpProfileService(createProfilePort()),
    usage: createAgentsMpUsageService(client),
  };
}
