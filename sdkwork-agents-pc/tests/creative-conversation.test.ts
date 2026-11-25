import assert from 'node:assert/strict';
import test from 'node:test';

import type { GenerationMediaResult } from '@sdkwork/agents-pc-core/sdk/generationsService';
import type { GenerationRecord } from '@sdkwork/agents-pc-core/sdk/generationsAppSdkClient';

import {
  CreativeService,
} from '../packages/sdkwork-agents-pc-creative/src/services/CreativeService';
import {
  hasUnsavedResults,
  isSavedToAssets,
  type CreativeMessage,
} from '../packages/sdkwork-agents-pc-creative/src/types';

/**
 * Regression tests for the creative composer's multi-turn conversation
 * reassembly. The reload used to map every generation record to its own
 * session, which fragmented one conversation into one session per record.
 */

function record(overrides: Partial<GenerationRecord>): GenerationRecord {
  return {
    id: 'generation-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    modality: 'image',
    operationType: 'text_to_image',
    status: 'succeeded',
    favorite: false,
    resultCount: 1,
    createdAt: '2026-10-31T10:00:00Z',
    updatedAt: '2026-10-31T10:01:00Z',
    ...overrides,
  };
}

function fakeMediaService(
  mediaByRecord: Readonly<Record<string, GenerationMediaResult[]>>,
) {
  return {
    async listMediaResults(generationId: string): Promise<GenerationMediaResult[]> {
      return mediaByRecord[generationId] ?? [];
    },
  };
}

const IMAGE_URL = 'https://cdn.example/cat.png';

test('one conversation reassembles from its grouped records in turn order', async () => {
  // The service returns records newest first; the session must replay them
  // oldest first with each turn's prompt message ahead of its result.
  const records: GenerationRecord[] = [
    record({
      id: 'g-second',
      conversationId: 'conv-1',
      promptPreview: '把猫改成蓝色',
      createdAt: '2026-10-31T10:05:00Z',
    }),
    record({
      id: 'g-first',
      conversationId: 'conv-1',
      promptPreview: '画一只猫',
      createdAt: '2026-10-31T10:00:00Z',
    }),
  ];
  const session = await CreativeService.buildConversationSession(
    fakeMediaService({
      'g-first': [{
        generationResult: {} as GenerationMediaResult['generationResult'],
        kind: 'image',
        url: IMAGE_URL,
      }],
      'g-second': [],
    }),
    'conv-1',
    records,
  );

  assert.ok(session);
  assert.equal(session.id, 'conv-1');
  assert.deepEqual(
    session.messages.map((message) => [message.role, message.text]),
    [
      ['user', '画一只猫'],
      ['assistant', '画一只猫'],
      ['user', '把猫改成蓝色'],
      ['assistant', '把猫改成蓝色'],
    ],
    'turns replay oldest first, prompt ahead of result',
  );
  const firstResult = session.messages[1];
  assert.equal(firstResult.imageUrl, IMAGE_URL);
  assert.equal(firstResult.stage, 'completed');
});

test('a reloaded failed record renders as a terminal failure, not a spinner', async () => {
  const session = await CreativeService.buildConversationSession(
    fakeMediaService({}),
    'conv-failed',
    [record({
      id: 'g-failed',
      conversationId: 'conv-failed',
      promptPreview: '会失败的一轮',
      status: 'failed',
      createdAt: '2026-10-31T10:00:00Z',
    })],
  );
  assert.ok(session);
  const assistant = session.messages[1];
  assert.equal(assistant.stage, 'failed');
  assert.match(assistant.errorText ?? '', /失败/);
});

test('media resolution is deferred unless the caller asks for it', async () => {
  const records: GenerationRecord[] = [
    record({ id: 'g-a', conversationId: 'conv-media', promptPreview: '第一轮' }),
    record({ id: 'g-b', conversationId: 'conv-media', promptPreview: '第二轮' }),
  ];
  let mediaCalls = 0;
  const countingService = {
    async listMediaResults(): Promise<GenerationMediaResult[]> {
      mediaCalls += 1;
      return [];
    },
  };
  await CreativeService.buildConversationSession(countingService, 'conv-media', records, { resolveMedia: false });
  assert.equal(mediaCalls, 0, 'the sidebar read pays list queries only');
  await CreativeService.buildConversationSession(countingService, 'conv-media', records);
  assert.equal(mediaCalls, 2, 'an opened session resolves every turn');
});

test('locally deleted turns stay deleted across a reload', async () => {
  // Node has no localStorage; the presentation store degrades gracefully and
  // the test seeds the hidden set through the same window global. The key is
  // account-scoped, and with no session the scope is the anonymous bucket.
  const backingStore = new Map<string, string>([
    ['creative_hidden_record_ids::anonymous', JSON.stringify(['g-dropped'])],
  ]);
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => backingStore.get(key) ?? null,
    setItem: (key: string, value: string) => { backingStore.set(key, value); },
    removeItem: (key: string) => { backingStore.delete(key); },
  };
  const records: GenerationRecord[] = [
    record({ id: 'g-kept', conversationId: 'conv-hidden', promptPreview: '保留的一轮' }),
    record({ id: 'g-dropped', conversationId: 'conv-hidden', promptPreview: '删除的一轮' }),
  ];
  const session = await CreativeService.buildConversationSession(
    fakeMediaService({}),
    'conv-hidden',
    records,
  );
  assert.ok(session);
  assert.deepEqual(
    session.messages.map((message) => message.text),
    ['保留的一轮', '保留的一轮'],
  );
});

test('records without a grouping key stay standalone', async () => {
  const session = await CreativeService.buildConversationSession(
    fakeMediaService({}),
    'legacy:g-solo',
    [record({ id: 'g-solo', conversationId: undefined, promptPreview: '一只早期的图' })],
  );
  assert.ok(session);
  assert.equal(session.messages.length, 2);
  assert.equal(session.title, '一只早期的图');
});

test('a conversation longer than the sidebar page still loads fully per session', async () => {
  // loadSession re-fetches one conversation's own turns; the fake here only
  // proves the grouping path stays turn-complete for many records.
  const records: GenerationRecord[] = Array.from({ length: 12 }, (_, index) => record({
    id: `g-turn-${index}`,
    conversationId: 'conv-long',
    promptPreview: `第${index + 1}轮`,
    createdAt: `2026-10-31T10:${String(index).padStart(2, '0')}:00Z`,
  }));
  const session = await CreativeService.buildConversationSession(
    fakeMediaService({}),
    'conv-long',
    records,
  );
  assert.ok(session);
  assert.equal(session.messages.length, 24, 'every turn contributes prompt + result');
  assert.equal(session.messages[0].text, '第1轮');
  assert.equal(session.messages.at(-1)?.text, '第12轮');
});

// ---------------------------------------------------------------------------
// Asset catalog closed loop (`sdkwork-assets`)
// ---------------------------------------------------------------------------

function mediaResult(
  resultId: string,
  kind: GenerationMediaResult['kind'],
  url: string,
  assetId?: string,
): GenerationMediaResult {
  return {
    generationResult: {
      id: resultId,
      generationId: 'generation-1',
      resultType: kind,
      createdAt: '2026-10-31T10:01:00Z',
      ...(assetId ? { assetId } : {}),
    } as GenerationMediaResult['generationResult'],
    kind,
    url,
  };
}

test('a reloaded turn carries its record id and each result asset state', async () => {
  const session = await CreativeService.buildConversationSession(
    fakeMediaService({
      'g-assets': [
        mediaResult('res-saved', 'image', 'https://cdn.example/a.png', 'asset-1'),
        mediaResult('res-pending', 'image', 'https://cdn.example/b.png'),
      ],
    }),
    'conv-assets',
    [record({ id: 'g-assets', conversationId: 'conv-assets', promptPreview: '两张图' })],
  );
  assert.ok(session);
  const assistant = session.messages[1];
  assert.equal(assistant.generationId, 'g-assets');
  assert.deepEqual(assistant.results, [
    { resultId: 'res-saved', kind: 'image', assetId: 'asset-1' },
    { resultId: 'res-pending', kind: 'image' },
  ]);
  assert.equal(isSavedToAssets(assistant), false, 'one unsaved result keeps the turn unsaved');
  assert.equal(hasUnsavedResults(assistant), true, 'the manual save is offered');
});

test('a fully cataloged turn reads as saved and offers no manual save', () => {
  const message: CreativeMessage = {
    id: 'm-1',
    role: 'assistant',
    generationId: 'g-1',
    results: [
      { resultId: 'r-1', kind: 'video', assetId: 'asset-1' },
      { resultId: 'r-2', kind: 'audio', assetId: 'asset-2' },
    ],
  };
  assert.equal(isSavedToAssets(message), true);
  assert.equal(hasUnsavedResults(message), false);
  // A turn without results (legacy or agent text) shows neither state.
  const bare: CreativeMessage = { id: 'm-2', role: 'assistant', generationId: 'g-2' };
  assert.equal(isSavedToAssets(bare), false);
  assert.equal(hasUnsavedResults(bare), false);
});

test('saveToAssets saves only unsaved results and patches each confirmed assetId', async () => {
  const saved: string[] = [];
  const fakeSaveService = {
    async saveToAssets(input: { generationId: string; resultId: string; title?: string }) {
      saved.push(`${input.generationId}/${input.resultId}:${input.title ?? ''}`);
      return { assetId: `asset-${input.resultId}` };
    },
  };
  const message: CreativeMessage = {
    id: 'm-1',
    role: 'assistant',
    text: '一只猫',
    generationId: 'g-1',
    results: [
      { resultId: 'r-1', kind: 'image', assetId: 'asset-r-0' },
      { resultId: 'r-2', kind: 'image' },
      { resultId: 'r-3', kind: 'image' },
    ],
  };
  const updates: CreativeMessage[] = [];
  const finalMessage = await CreativeService.saveToAssets(
    message,
    (updated) => updates.push(updated),
    fakeSaveService,
  );
  assert.deepEqual(saved, ['g-1/r-2:一只猫', 'g-1/r-3:一只猫'], 'already-saved results are skipped');
  assert.deepEqual(
    updates.map((update) => update.results?.map((result) => result.assetId)),
    [['asset-r-0', 'asset-r-2', undefined], ['asset-r-0', 'asset-r-2', 'asset-r-3']],
    'each confirmed save is pushed before the next one starts',
  );
  assert.equal(isSavedToAssets(finalMessage), true);
});

test('saveToAssets rejects a turn without a generation id before calling the service', async () => {
  let calls = 0;
  await assert.rejects(
    () => CreativeService.saveToAssets(
      { id: 'm-1', role: 'assistant', results: [{ resultId: 'r-1', kind: 'image' }] },
      undefined,
      { saveToAssets: async () => { calls += 1; return { assetId: 'asset-1' }; } },
    ),
    /缺少 id/u,
  );
  assert.equal(calls, 0);
});

test('saveToAssets surfaces a catalog answer without assetId instead of marking it saved', async () => {
  const message: CreativeMessage = {
    id: 'm-1',
    role: 'assistant',
    generationId: 'g-1',
    results: [{ resultId: 'r-1', kind: 'image' }],
  };
  await assert.rejects(
    () => CreativeService.saveToAssets(message, undefined, { saveToAssets: async () => ({}) }),
    /assetId/u,
  );
});
