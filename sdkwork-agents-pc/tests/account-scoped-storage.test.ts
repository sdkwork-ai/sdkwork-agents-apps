import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test, { afterEach, beforeEach } from 'node:test';

import {
  clearActiveAccountScopedStorage,
  readAccountScopedItem,
  resetAgentsAccountScopeForTests,
  writeAccountScopedItem,
} from '../packages/sdkwork-agents-pc-core/src/session/accountStorage';
import {
  clearAppSdkSessionTokens,
  persistAppSdkSessionTokens,
} from '../packages/sdkwork-agents-pc-core/src/session/session';
import {
  clearModelSettingsApiKeys,
  getModelSettings,
  persistModelSettings,
} from '../packages/sdkwork-agents-pc-chat/src/hooks/useModelSettings';
import {
  readProfileAvatarIndex,
  readProfileBio,
  writeProfileBio,
} from '../packages/sdkwork-agents-pc-commons/src/profile/accountProfile';

/**
 * Cross-account storage regression tests.
 *
 * The app used to persist canvas graphs, drafts, prompt history, profile copies
 * and BYO model API keys under bare keys, so the next account on the same
 * browser/Electron profile read the previous account's data. Every user-content
 * key is now `<base>::<tenantId>:<userId>`, the session store clears the
 * previous scope, and provider API keys never reach storage at all.
 */

interface AccountFixture {
  accessToken: string;
  authToken: string;
  context: { appId: string; tenantId: string; userId: string };
}

const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
let values = new Map<string, string>();

function account(tenantId: string, userId: string): AccountFixture {
  return {
    accessToken: `access-${tenantId}-${userId}`,
    authToken: `auth-${tenantId}-${userId}`,
    context: { appId: 'sdkwork-agents-pc', tenantId, userId },
  };
}

function installLocalStorage(): void {
  values = new Map<string, string>();
  const storage = {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.has(key) ? values.get(key)! : null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, String(value));
    },
  } as Storage;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    enumerable: true,
    value: storage,
  });
}

function signIn(fixture: AccountFixture): void {
  persistAppSdkSessionTokens(fixture as never);
}

function readPackageSource(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

beforeEach(() => {
  installLocalStorage();
  resetAgentsAccountScopeForTests();
  clearModelSettingsApiKeys();
});

afterEach(() => {
  resetAgentsAccountScopeForTests();
  clearModelSettingsApiKeys();
  if (originalLocalStorage) {
    Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
  } else {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  }
});

test('user content keys embed the tenantId and userId of the active session', () => {
  signIn(account('tenant-a', 'user-1'));

  writeAccountScopedItem('chat_input_draft', 'hello');

  assert.equal(values.get('chat_input_draft::tenant-a:user-1'), 'hello');
  assert.equal(readAccountScopedItem('chat_input_draft'), 'hello');
});

test('switching accounts never exposes the previous account content', () => {
  signIn(account('tenant-a', 'user-1'));
  writeAccountScopedItem('sdkwork_agents_canvas_workflow_v1', '{"nodes":[]}');

  signIn(account('tenant-b', 'user-2'));

  assert.equal(readAccountScopedItem('sdkwork_agents_canvas_workflow_v1'), null);
  assert.equal(
    values.has('sdkwork_agents_canvas_workflow_v1::tenant-a:user-1'),
    false,
    'the previous account values are removed, not just hidden',
  );
});

test('sign-out clears the account scope, the anonymous bucket and legacy keys', () => {
  signIn(account('tenant-a', 'user-1'));
  writeAccountScopedItem('chat_input_draft', 'account draft');
  writeAccountScopedItem('creative_session_title:conv-1', 'account title');
  values.set('creative_input_draft', 'legacy unscoped draft');
  values.set('chat_input_draft::tenant-b:user-2', 'other account draft');
  values.set('sdkwork-agents-chat-wire-protocol', 'openai');

  const removed = clearActiveAccountScopedStorage();

  assert.ok(removed.includes('chat_input_draft::tenant-a:user-1'));
  assert.ok(removed.includes('creative_session_title:conv-1::tenant-a:user-1'));
  assert.ok(removed.includes('creative_input_draft'));
  assert.equal(values.has('chat_input_draft::tenant-a:user-1'), false);
  assert.equal(values.has('creative_session_title:conv-1::tenant-a:user-1'), false);
  assert.equal(values.has('creative_input_draft'), false);
  assert.equal(
    values.get('chat_input_draft::tenant-b:user-2'),
    'other account draft',
    'another account values are left alone',
  );
  assert.equal(
    values.get('sdkwork-agents-chat-wire-protocol'),
    'openai',
    'device preferences stay shared',
  );
});

test('the session clear hook removes account content on sign-out', () => {
  signIn(account('tenant-a', 'user-1'));
  writeAccountScopedItem('sdkwork_agents_canvas_snapshots_v1', '[]');

  clearAppSdkSessionTokens();

  assert.equal(values.has('sdkwork_agents_canvas_snapshots_v1::tenant-a:user-1'), false);
  assert.equal(readAccountScopedItem('sdkwork_agents_canvas_snapshots_v1'), null);
});

test('BYO model API keys stay out of browser storage and drop on account change', () => {
  signIn(account('tenant-a', 'user-1'));

  persistModelSettings('Google', {
    apiKey: 'sk-account-a-secret',
    baseUrl: 'https://gateway.example/v1',
    temperature: 0.3,
  });

  const stored = values.get('sdkwork-agents-google-settings::tenant-a:user-1') ?? '';
  assert.ok(stored.includes('https://gateway.example/v1'));
  assert.ok(!stored.includes('sk-account-a-secret'), 'the API key is never persisted');
  assert.equal(getModelSettings('Google').apiKey, 'sk-account-a-secret');
  assert.equal(getModelSettings('Google').baseUrl, 'https://gateway.example/v1');

  signIn(account('tenant-b', 'user-2'));

  assert.equal(getModelSettings('Google').apiKey, '');
  assert.equal(getModelSettings('Google').baseUrl, '');
});

test('legacy unscoped provider settings are removed instead of shown to the next account', () => {
  signIn(account('tenant-a', 'user-1'));
  values.set(
    'sdkwork-agents-openai-settings',
    JSON.stringify({ apiKey: 'sk-legacy', baseUrl: 'https://legacy.example', temperature: 0.5 }),
  );

  assert.deepEqual(getModelSettings('OpenAI'), { apiKey: '', baseUrl: '', temperature: 0.7 });
  assert.equal(values.has('sdkwork-agents-openai-settings'), false);
});

test('account bio and avatar style are account scoped', () => {
  signIn(account('tenant-a', 'user-1'));
  writeProfileBio('account bio');
  writeAccountScopedItem('profile_avatar_index', '99');

  assert.equal(readProfileBio(), 'account bio');
  assert.equal(readProfileAvatarIndex(6), 3);

  signIn(account('tenant-b', 'user-2'));

  assert.equal(readProfileBio(), '');
  assert.equal(readProfileAvatarIndex(6), 0);
});

/**
 * Wiring assertions for the user-content stores: the authored sources must go
 * through the account-scoped helpers (and never read/write a bare key).
 */
test('canvas, creative, chat draft and profile stores use the account-scoped helpers', () => {
  const workflow = readPackageSource(
    '../packages/sdkwork-agents-pc-canvas/src/services/CanvasService.ts',
  );
  assert.match(workflow, /readAccountScopedItem\(LOCAL_STORAGE_KEY\)/u);
  assert.match(workflow, /writeAccountScopedItem\(LOCAL_STORAGE_KEY/u);
  assert.doesNotMatch(workflow, /localStorage\.(get|set|remove)Item/u);

  const snapshots = readPackageSource(
    '../packages/sdkwork-agents-pc-canvas/src/components/CanvasSnapshotPanel.tsx',
  );
  assert.match(snapshots, /readAccountScopedItem\(LOCAL_STORAGE_KEY\)/u);
  assert.doesNotMatch(snapshots, /localStorage\.(get|set|remove)Item/u);

  const templates = readPackageSource(
    '../packages/sdkwork-agents-pc-canvas/src/components/CanvasTemplatesPanel.tsx',
  );
  assert.match(templates, /readAccountScopedItem\(LOCAL_STORAGE_KEY\)/u);
  assert.doesNotMatch(templates, /localStorage\.(get|set|remove)Item/u);

  const creative = readPackageSource(
    '../packages/sdkwork-agents-pc-creative/src/services/CreativeService.ts',
  );
  assert.match(creative, /readAccountScopedItem\(SESSION_TITLE_PREFIX \+ conversationId\)/u);
  assert.match(creative, /writeAccountScopedItem\(HIDDEN_RECORD_IDS_KEY/u);
  assert.doesNotMatch(creative, /localStorage\.(get|set|remove)Item/u);

  const creativeView = readPackageSource(
    '../packages/sdkwork-agents-pc-creative/src/CreativeView.tsx',
  );
  assert.match(creativeView, /readAccountScopedItem\(CREATIVE_PROMPT_HISTORY_KEY\)/u);
  assert.match(creativeView, /writeAccountScopedItem\(CREATIVE_PROMPT_HISTORY_KEY/u);
  assert.doesNotMatch(creativeView, /localStorage\.(get|set|remove)Item/u);

  const chatView = readPackageSource(
    '../packages/sdkwork-agents-pc-chat/src/ChatView.tsx',
  );
  assert.match(chatView, /readAccountScopedItem\(CHAT_DRAFT_STORAGE_KEY\)/u);
  assert.match(chatView, /writeAccountScopedItem\(CHAT_DRAFT_STORAGE_KEY/u);
  assert.doesNotMatch(chatView, /localStorage\.(get|set|remove)Item/u);

  const creativeInput = readPackageSource(
    '../packages/sdkwork-agents-pc-commons/src/hooks/useCreativeInputBox.ts',
  );
  assert.match(creativeInput, /readAccountScopedItem\(CREATIVE_INPUT_DRAFT_KEY\)/u);
  assert.doesNotMatch(creativeInput, /localStorage\.(get|set|remove)Item/u);
});
