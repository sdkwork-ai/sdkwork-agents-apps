import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  RUNTIME_MODEL_PROVIDER_ID,
  engineKeyToVendorCode,
  resolveActiveAgentModelProviderId,
  resolveSelectedAgentModelOptionId,
  toUnifiedAgentModelOptions,
  toUnifiedAgentProviderOptions,
} from '../packages/sdkwork-agents-pc-agents/src/services/agentModelSelectorCatalog';
import type { ModelCatalogItem } from '../packages/sdkwork-agents-pc-agents/src/services/modelCatalog';
import { buildAgentModelSelectorMessages } from '../packages/sdkwork-agents-pc-agents/src/pages/agentModelSelectorMessages';

function catalogItem(overrides: Partial<ModelCatalogItem> & { id: string }): ModelCatalogItem {
  return {
    label: overrides.id,
    description: '',
    providerId: '',
    engineKey: 'rig',
    bindingId: 'binding.rig',
    defaultForEngine: false,
    ...overrides,
  };
}

const CATALOG: ModelCatalogItem[] = [
  catalogItem({ id: 'gpt-5-codex', label: 'GPT-5 Codex', engineKey: 'codex', providerId: 'provider.codex', defaultForEngine: true }),
  catalogItem({ id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', engineKey: 'claude-code', providerId: 'provider.claude' }),
  catalogItem({ id: 'gemini-2-5-pro', label: 'Gemini 2.5 Pro', engineKey: 'gemini', providerId: 'provider.gemini' }),
  catalogItem({ id: 'rig-default', label: 'Rig Default', engineKey: 'rig', providerId: '' }),
];

test('every catalog model reaches the picker as an option', () => {
  const options = toUnifiedAgentModelOptions(CATALOG, '默认模型');

  assert.equal(options.length, CATALOG.length);
  assert.deepEqual(
    options.map((option) => option.id),
    CATALOG.map((model) => model.id),
  );
});

test('the option id is the model id the agent persists', () => {
  // The picker reports back `option.modelId`; the agent stores `model.id`. If
  // these ever diverge the editor would save a model the runtime cannot resolve.
  for (const option of toUnifiedAgentModelOptions(CATALOG, '默认模型')) {
    assert.equal(option.modelId, option.id);
    assert.equal(option.kind, 'built-in');
  }
});

test('every option is reachable from the provider rail the picker opens on', () => {
  // A provider rail that does not contain the option's own provider id is how a
  // model ends up unreachable: the rail filters, the option disappears, and
  // nothing errors.
  const providers = toUnifiedAgentProviderOptions(CATALOG);
  const providerIds = new Set(providers.map((provider) => provider.id));

  assert.ok(providers.length > 0, 'rail must not be empty for a non-empty catalog');
  for (const option of toUnifiedAgentModelOptions(CATALOG, '默认模型')) {
    for (const providerId of option.supportedProviderIds ?? []) {
      assert.ok(
        providerIds.has(providerId),
        `option ${option.id} points at provider ${providerId}, which is not in the rail`,
      );
    }
  }
});

test('the provider rail is one entry per engine, not one per model', () => {
  const providers = toUnifiedAgentProviderOptions(CATALOG);

  assert.deepEqual(
    providers.map((provider) => provider.id),
    ['codex', 'claude-code', 'gemini', 'rig'],
  );
  assert.deepEqual(
    providers.map((provider) => provider.label),
    ['OpenAI Codex', 'Anthropic', 'Google', 'Rig'],
  );
});

test('the engine default is the only option carrying the default badge', () => {
  const options = toUnifiedAgentModelOptions(CATALOG, '默认模型');
  const badged = options.filter((option) => option.metadataLabel);

  assert.deepEqual(badged.map((option) => option.id), ['gpt-5-codex']);
  assert.equal(badged[0]?.metadataLabel, '默认模型');
});

test('an engine with no engine key still gets a provider rail entry', () => {
  const models = [catalogItem({ id: 'anon', engineKey: '' })];

  assert.deepEqual(
    toUnifiedAgentProviderOptions(models).map((provider) => provider.id),
    [RUNTIME_MODEL_PROVIDER_ID],
  );
  assert.deepEqual(
    toUnifiedAgentModelOptions(models, '默认模型')[0]?.supportedProviderIds,
    [RUNTIME_MODEL_PROVIDER_ID],
  );
});

test('engine keys map onto the icon catalog vendor codes', () => {
  assert.equal(engineKeyToVendorCode('codex'), 'openai');
  assert.equal(engineKeyToVendorCode('claude-code'), 'anthropic');
  assert.equal(engineKeyToVendorCode('gemini'), 'google');
  assert.equal(engineKeyToVendorCode('mimo-code'), 'mimo');
  assert.equal(engineKeyToVendorCode('opencode'), 'opencode');
  // No brand equivalent: pass through so the initials chip renders rather than
  // a wrong vendor's logo.
  assert.equal(engineKeyToVendorCode('hermes'), 'hermes');
  assert.equal(engineKeyToVendorCode('rig'), 'rig');
});

test('the selected option id is empty when the stored model is not in the catalog', () => {
  // An empty id is what makes the picker fall back to its own label; returning
  // the stale id would leave the trigger blank.
  assert.equal(resolveSelectedAgentModelOptionId(CATALOG, 'claude-sonnet-4-5'), 'claude-sonnet-4-5');
  assert.equal(resolveSelectedAgentModelOptionId(CATALOG, '  claude-sonnet-4-5  '), 'claude-sonnet-4-5');
  assert.equal(resolveSelectedAgentModelOptionId(CATALOG, 'retired-model'), '');
  assert.equal(resolveSelectedAgentModelOptionId(CATALOG, ''), '');
});

test('the open provider is the selected model engine, else the first entry', () => {
  const providers = toUnifiedAgentProviderOptions(CATALOG);

  assert.equal(resolveActiveAgentModelProviderId(CATALOG, 'gemini-2-5-pro', providers), 'gemini');
  assert.equal(resolveActiveAgentModelProviderId(CATALOG, 'retired-model', providers), 'codex');
  assert.equal(resolveActiveAgentModelProviderId([], 'anything', []), '');
});

test('the picker message bag looks up every key exactly once', () => {
  const lookedUp: string[] = [];
  const messages = buildAgentModelSelectorMessages((key, defaultValue) => {
    lookedUp.push(key);
    return defaultValue;
  });

  // The parameter type already forces every field to be present; this catches
  // the failure the type cannot see — two fields wired to the same key, which
  // renders the same word twice.
  assert.equal(lookedUp.length, Object.keys(messages).length);
  assert.equal(new Set(lookedUp).size, lookedUp.length, 'a translation key is reused');

  for (const key of lookedUp) {
    assert.ok(key.startsWith('agentsConsoleModelSelector.'), `unprefixed key: ${key}`);
  }
  for (const [field, value] of Object.entries(messages)) {
    assert.equal(typeof value, 'string');
    assert.ok(value.trim().length > 0, `${field} rendered empty copy`);
  }
});

test('every key the message bag looks up exists in both registered locales', () => {
  // A key that misses the catalog does not fail: `t` falls back to the Chinese
  // default, so an en-US user silently reads Chinese. Only a catalog check can
  // see that.
  const shellCatalogDir = path.join(
    import.meta.dirname,
    '../packages/sdkwork-agents-pc-commons/src/i18n',
  );
  const catalogs = ['zh-CN', 'en-US'].map((locale) => ({
    locale,
    keys: new Set(
      Object.keys(
        JSON.parse(
          readFileSync(
            path.join(shellCatalogDir, locale, 'agents/workbench/shell.json'),
            'utf8',
          ),
        ) as Record<string, string>,
      ),
    ),
  }));

  const lookedUp = new Set<string>();
  buildAgentModelSelectorMessages((key, defaultValue) => {
    lookedUp.add(key);
    return defaultValue;
  });

  for (const { locale, keys } of catalogs) {
    const missing = [...lookedUp].filter((key) => !keys.has(key));
    assert.deepEqual(missing, [], `${locale} shell catalog is missing ${missing.join(', ')}`);
  }
});
