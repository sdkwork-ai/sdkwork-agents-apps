import type { RemoteCreativeModelItem } from './creativeModelCatalogTypes';
import { vendorDisplayName } from './creativeModelParameters';

/** One language model the agent composer can be configured with. */
export interface AgentLlmModel {
  /** Canonical model id sent to the agent backend (`parameters.agentModel`). */
  id: string;
  label: string;
  vendorCode: string;
  vendorLabel: string;
  desc: string;
}

let cached: AgentLlmModel[] | null = null;
let inflight: Promise<AgentLlmModel[]> | null = null;

/** Normalize the app catalog response into LLM picker options. */
function toAgentLlmModels(items: readonly RemoteCreativeModelItem[]): AgentLlmModel[] {
  const byId = new Map<string, AgentLlmModel>();
  for (const item of items) {
    const outputsText = (item.outputModalities ?? []).some((modality) => modality === 'text');
    const isChat = (item.capabilities ?? []).includes('chat');
    if (!outputsText || (!isChat && (item.capabilities ?? []).length > 0)) continue;
    if (byId.has(item.model)) continue;
    byId.set(item.model, {
      id: item.model,
      label: item.displayName || item.model,
      vendorCode: item.vendorCode,
      vendorLabel: vendorDisplayName(item.vendorCode),
      desc: item.description || item.capabilityIntro || '',
    });
  }
  return [...byId.values()].sort((left, right) => (
    left.vendorLabel.localeCompare(right.vendorLabel)
    || left.label.localeCompare(right.label)
  ));
}

/**
 * Load the catalog's language models for the agent composer.
 *
 * The media catalog service only syncs image/video/music/voice modalities;
 * the agent's orchestration model comes from the same app catalog filtered by
 * the `chat` capability and text output. The list is cached for the session.
 *
 * @returns language-model options, newest catalog order preserved within vendor.
 */
export async function loadAgentLlmModels(): Promise<AgentLlmModel[]> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    const { getModelsAppSdkClientWithSession } = await import(
      '@sdkwork/agents-pc-core/sdk/modelsAppSdkClient'
    );
    const client = getModelsAppSdkClientWithSession();
    const items: RemoteCreativeModelItem[] = [];
    for (let page = 1; page <= 5; page += 1) {
      const response = await client.ai.models.list({
        capabilities: ['chat'],
        page,
        pageSize: 100,
      });
      items.push(...(response.items as RemoteCreativeModelItem[]));
      if (!response.pageInfo?.hasMore) break;
    }
    cached = toAgentLlmModels(items);
    return cached;
  })();
  return inflight;
}

/** Test seam: reset the session cache. */
export function resetAgentLlmModelsCache(): void {
  cached = null;
  inflight = null;
}

export { toAgentLlmModels };
