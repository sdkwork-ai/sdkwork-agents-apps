import assert from 'node:assert/strict';
import test from 'node:test';

import type { GenerationMediaResult } from '@sdkwork/agents-pc-core/sdk/generationsService';
import type { GenerationRecord } from '@sdkwork/agents-pc-core/sdk/generationsAppSdkClient';

import {
  CreativeService,
} from '../packages/sdkwork-agents-pc-creative/src/services/CreativeService';

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
