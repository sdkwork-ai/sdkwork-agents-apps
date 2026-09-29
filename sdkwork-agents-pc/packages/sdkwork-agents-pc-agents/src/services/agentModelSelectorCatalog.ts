import type {
  UnifiedAgentModelOption,
  UnifiedAgentProviderOption,
} from '@sdkwork/models-pc-picker';

import { engineKeyToVendorLabel, type ModelCatalogItem } from './modelCatalog';

/**
 * Adapters from the agents runtime model catalog to the official picker's model.
 *
 * `CreateAgentView` used to render its own popover over `ModelCatalogItem[]`. The
 * selection UI is `sdkwork-models`' concern, so the editor now feeds the shared
 * `UnifiedAgentModelSelector` instead, and this module is the whole distance
 * between the two shapes. Keeping it separate from the page means the mapping —
 * which is where a silent mismatch would hide a model from the picker — is
 * testable on its own.
 */

/** Provider id used for runtime models that carry no engine of their own. */
export const RUNTIME_MODEL_PROVIDER_ID = 'runtime';

/**
 * The picker's provider axis is the catalog's engine key.
 *
 * Both the provider rail (`providerOptions[].id`) and each option's
 * `supportedProviderIds` go through this one function. That is deliberate: the
 * two lists are compared by value elsewhere, so deriving them from different
 * fields (`engineKey` for the rail, `providerId` for the option, say) would let
 * them disagree and strand a model on a provider that is not in the rail
 * whenever an engine publishes a `providerId` that differs from its key.
 *
 * `engineKey` wins over `providerId` because it is the identity the catalog is
 * grouped by (the list endpoint returns models nested under their engine) and
 * the one `engineKeyToVendorLabel` can label. `providerId` is runtime binding
 * metadata (`provider.<engine>` in the session layer) and stays out of the UI
 * axis; it is still searched, so typing it finds the model.
 */
export function providerIdForModel(model: ModelCatalogItem): string {
  return model.engineKey || RUNTIME_MODEL_PROVIDER_ID;
}

/**
 * One provider per engine in the catalog.
 *
 * Deriving the rail from the loaded catalog (rather than hard-coding a provider
 * list) keeps it exactly as wide as what the deployment actually serves.
 */
export function toUnifiedAgentProviderOptions(
  models: readonly ModelCatalogItem[],
): UnifiedAgentProviderOption[] {
  const providers = new Map<string, UnifiedAgentProviderOption>();
  for (const model of models) {
    const id = providerIdForModel(model);
    if (!providers.has(id)) {
      providers.set(id, { id, label: engineKeyToVendorLabel(id) });
    }
  }
  return [...providers.values()];
}

export function toUnifiedAgentModelOptions(
  models: readonly ModelCatalogItem[],
  defaultModelLabel: string,
): UnifiedAgentModelOption[] {
  return models.map((model) => ({
    id: model.id,
    // The picker keys options by `id` and reports the choice through
    // `onSelectModelOption`; the agent stores `modelId`, so they must agree.
    modelId: model.id,
    label: model.label,
    description: model.description,
    // Every option here comes from the runtime agent-engine catalog: there is no
    // user-authored provider configuration on this surface, so none is `custom`.
    kind: 'built-in',
    vendorCode: engineKeyToVendorCode(model.engineKey),
    vendorName: engineKeyToVendorLabel(model.engineKey),
    supportedProviderIds: [providerIdForModel(model)],
    searchTerms: [model.id, model.label, model.providerId, model.engineKey, model.bindingId],
    ...(model.defaultForEngine ? { metadataLabel: defaultModelLabel } : {}),
  }));
}

/**
 * Engine key → `sdkwork-models` vendor code, which is what the picker's
 * `VendorIcon` resolves brand art from.
 *
 * The agent-engine keys name the *runtime* (`codex`, `claude-code`, …), while
 * the icon catalog is keyed by *vendor* (`openai`, `anthropic`, …). Passing the
 * engine key straight through would leave every engine that is not literally a
 * vendor code — which is most of them — drawing an initials chip. Engines with
 * no brand equivalent in the catalog (`openclaw`, `hermes`, `rig`) are
 * deliberately absent: the initials-chip fallback is the honest rendering for
 * them, not a guessed vendor.
 */
export function engineKeyToVendorCode(engineKey: string): string {
  const vendorCodes: Record<string, string> = {
    codex: 'openai',
    'claude-code': 'anthropic',
    gemini: 'google',
    'mimo-code': 'mimo',
    opencode: 'opencode',
  };
  return vendorCodes[engineKey] ?? engineKey;
}

/**
 * The option id that represents the stored model.
 *
 * Agents persist the model id, and an option's id is that same id, so this is an
 * identity lookup — but it stays a function so the picker falls back to its own
 * label (rather than rendering an empty trigger) when the stored model is not in
 * the catalog, e.g. a stale default or a model retired since the agent was saved.
 */
export function resolveSelectedAgentModelOptionId(
  models: readonly ModelCatalogItem[],
  storedModelId: string,
): string {
  const trimmed = storedModelId.trim();
  if (!trimmed) {
    return '';
  }
  return models.some((model) => model.id === trimmed) ? trimmed : '';
}

/**
 * The provider rail the picker opens on: the selected model's engine when it is
 * in the catalog, otherwise the first provider so the rail is never blank.
 */
export function resolveActiveAgentModelProviderId(
  models: readonly ModelCatalogItem[],
  storedModelId: string,
  providers: readonly UnifiedAgentProviderOption[],
): string {
  const selected = models.find((model) => model.id === storedModelId.trim());
  if (selected) {
    return providerIdForModel(selected);
  }
  return providers[0]?.id ?? '';
}
