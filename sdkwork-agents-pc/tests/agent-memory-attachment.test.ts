import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AGENT_MEMORY_SLOT_ID,
  AgentMemoryError,
  AgentMemoryService,
  DEFAULT_MEMORY_SPACE_TYPE,
  MAX_CLONED_RECORDS,
  createUserMemorySpaceType,
  resolveAgentMemorySlotDirective,
  type AgentMemoryClientLike,
} from '../packages/sdkwork-agents-pc-agents/src/services/agentMemoryModel';

/**
 * The memory attachment is the one part of the agent editor whose failure mode
 * is silent: a clone that stops early, or a default that resolves to nothing,
 * leaves the user with an agent that looks configured and stores nothing. These
 * tests drive the service through a stub client so both are observable.
 */

interface RecordedCall {
  readonly body: Record<string, unknown>;
  readonly params: Record<string, unknown>;
}

function memorySpace(spaceId: string, spaceType: string, displayName: string) {
  return {
    spaceId,
    tenantId: '1',
    ownerSubjectType: 'user',
    ownerSubjectId: 'user-1',
    spaceType,
    displayName,
    lifecycleStatus: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    version: '1',
  };
}

function memoryRecord(memoryId: string, spaceId: string) {
  return {
    memoryId,
    spaceId,
    scope: 'user',
    memoryType: 'semantic' as const,
    subject: `subject-${memoryId}`,
    predicate: 'prefers',
    objectText: `object-${memoryId}`,
    canonicalText: `canonical-${memoryId}`,
    summaryText: `summary-${memoryId}`,
    confidence: 0.9,
    status: 'active' as const,
    sensitivityLevel: 'internal',
    metadata: { source: 'test' },
    expiresAt: '2030-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    version: '1',
  };
}

interface StubOptions {
  readonly spaces: readonly ReturnType<typeof memorySpace>[];
  /** Records per space, keyed by `spaceId`. */
  readonly records?: Record<string, readonly ReturnType<typeof memoryRecord>[]>;
}

function createStubClient(options: StubOptions) {
  const createdSpaces: RecordedCall[] = [];
  const createdRecords: RecordedCall[] = [];
  const spaces = [...options.spaces];

  const client = {
    memory: {
      spaces: {
        list: async () => ({ items: [...spaces], pageInfo: { mode: 'cursor', hasMore: false } }),
        create: async (body: Record<string, unknown>, params: Record<string, unknown>) => {
          createdSpaces.push({ body, params });
          const space = memorySpace(`space-${spaces.length + 1}`, String(body.spaceType), String(body.displayName));
          spaces.push(space);
          return space;
        },
      },
      list: async (params: { spaceId: string; cursor?: string }) => {
        const all = options.records?.[params.spaceId] ?? [];
        // One record per page keeps the cursor walk honest: a service that
        // forgets to advance the cursor would loop or stop early.
        const cursor = params.cursor ? Number(params.cursor) : 0;
        const page = all.slice(cursor, cursor + 1);
        const next = cursor + 1;
        return {
          items: [...page],
          pageInfo: {
            mode: 'cursor' as const,
            hasMore: next < all.length,
            nextCursor: next < all.length ? String(next) : null,
          },
        };
      },
      create: async (body: Record<string, unknown>, params: Record<string, unknown>) => {
        createdRecords.push({ body, params });
        return memoryRecord(String(params.idempotencyKey), String(body.spaceId));
      },
    },
  };

  return {
    client: client as unknown as AgentMemoryClientLike,
    createdSpaces,
    createdRecords,
  };
}

function createService(options: StubOptions) {
  const stub = createStubClient(options);
  const service = new AgentMemoryService(() => stub.client, () => 'user-1');
  return { ...stub, service };
}

test('lists the user memories with the default one first', async () => {
  const { service } = createService({
    spaces: [
      memorySpace('space-b', 'memory.work-1a2b', 'Work'),
      memorySpace('space-default', DEFAULT_MEMORY_SPACE_TYPE, '默认记忆'),
      memorySpace('space-a', 'memory.ideas-3c4d', 'Ideas'),
    ],
  });

  const memories = await service.listUserMemories();

  assert.deepEqual(
    memories.map(({ displayName, isDefault }) => ({ displayName, isDefault })),
    [
      { displayName: '默认记忆', isDefault: true },
      { displayName: 'Ideas', isDefault: false },
      { displayName: 'Work', isDefault: false },
    ],
  );
});

test('treats only the personal space as the default memory', async () => {
  const { service } = createService({
    spaces: [
      memorySpace('space-extra', 'memory.work-1a2b', '默认记忆'),
      memorySpace('space-default', DEFAULT_MEMORY_SPACE_TYPE, 'Personal'),
    ],
  });

  assert.equal((await service.resolveDefaultMemory())?.spaceId, 'space-default');
});

test('resolves the default without creating a second space when it exists', async () => {
  const { service, createdSpaces } = createService({
    spaces: [memorySpace('space-default', DEFAULT_MEMORY_SPACE_TYPE, 'Personally named')],
  });

  const resolved = await service.ensureDefaultMemory();

  assert.equal(resolved.spaceId, 'space-default');
  assert.equal(createdSpaces.length, 0);
});

test('creates the default memory on demand, under a retry-safe key', async () => {
  const { service, createdSpaces } = createService({ spaces: [] });

  const created = await service.ensureDefaultMemory();

  assert.equal(created.isDefault, true);
  assert.equal(created.spaceType, DEFAULT_MEMORY_SPACE_TYPE);
  assert.deepEqual(
    createdSpaces.map(({ body, params }) => ({
      spaceType: body.spaceType,
      ownerSubjectType: body.ownerSubjectType,
      ownerSubjectId: body.ownerSubjectId,
      idempotencyKey: params.idempotencyKey,
    })),
    [
      {
        spaceType: DEFAULT_MEMORY_SPACE_TYPE,
        ownerSubjectType: 'user',
        ownerSubjectId: 'user-1',
        // Fixed rather than random: two saves racing to provision the default
        // must collapse into one space, not two.
        idempotencyKey: `space.${DEFAULT_MEMORY_SPACE_TYPE}`,
      },
    ],
  );
});

test('refuses to create a memory for a session with no user id', async () => {
  const stub = createStubClient({ spaces: [] });
  const service = new AgentMemoryService(() => stub.client, () => undefined);

  await assert.rejects(
    () => service.createMemory('No session'),
    (error: unknown) => error instanceof AgentMemoryError && /user id/u.test(error.message),
  );
  assert.equal(stub.createdSpaces.length, 0);
});

test('copies every record of the source memory and reports no truncation', async () => {
  const source = memorySpace('space-source', 'memory.source-1a2b', 'Source');
  const { service, createdSpaces, createdRecords } = createService({
    spaces: [source],
    records: { 'space-source': [memoryRecord('m-1', 'space-source'), memoryRecord('m-2', 'space-source')] },
  });

  const result = await service.cloneMemory('space-source', 'Copy of Source');

  assert.equal(result.copiedRecords, 2);
  assert.equal(result.truncated, false);
  assert.equal(createdSpaces.length, 1);
  // The copy is a copy: same predicate/object/summary as the source.
  assert.deepEqual(
    createdRecords.map(({ body }) => ({
      spaceId: body.spaceId,
      subject: body.subject,
      predicate: body.predicate,
      objectText: body.objectText,
      canonicalText: body.canonicalText,
      summaryText: body.summaryText,
      sensitivityLevel: body.sensitivityLevel,
      expiresAt: body.expiresAt,
    })),
    [
      {
        spaceId: result.space.spaceId,
        subject: 'subject-m-1',
        predicate: 'prefers',
        objectText: 'object-m-1',
        canonicalText: 'canonical-m-1',
        summaryText: 'summary-m-1',
        sensitivityLevel: 'internal',
        expiresAt: '2030-01-01T00:00:00Z',
      },
      {
        spaceId: result.space.spaceId,
        subject: 'subject-m-2',
        predicate: 'prefers',
        objectText: 'object-m-2',
        canonicalText: 'canonical-m-2',
        summaryText: 'summary-m-2',
        sensitivityLevel: 'internal',
        expiresAt: '2030-01-01T00:00:00Z',
      },
    ],
  );
});

test('never sends server-owned fields when copying a record', async () => {
  const source = memorySpace('space-source', 'memory.source-1a2b', 'Source');
  const { service, createdRecords } = createService({
    spaces: [source],
    records: { 'space-source': [memoryRecord('m-1', 'space-source')] },
  });

  await service.cloneMemory('space-source', 'Copy');

  const [copied] = createdRecords;
  assert.ok(copied);
  const serverOwned = [
    'memoryId',
    'uuid',
    'status',
    'confidence',
    'supersedesMemoryId',
    'supersededByMemoryId',
    'version',
    'createdAt',
    'updatedAt',
    'userId',
  ];
  for (const owned of serverOwned) {
    assert.equal(
      Object.hasOwn(copied.body, owned),
      false,
      `a copy must not claim the source's ${owned}`,
    );
  }
  // The new space is the only space the copy may name.
  assert.equal(copied.body.spaceId, 'space-2');
});

test('reports a truncated copy instead of silently dropping records', async () => {
  const source = memorySpace('space-source', 'memory.source-1a2b', 'Source');
  const records = Array.from({ length: MAX_CLONED_RECORDS + 1 }, (_value, index) =>
    memoryRecord(`m-${index}`, 'space-source'),
  );
  const { service } = createService({ spaces: [source], records: { 'space-source': records } });

  const result = await service.cloneMemory('space-source', 'Huge copy');

  assert.equal(result.copiedRecords, MAX_CLONED_RECORDS);
  // The source held 501 records and only 500 were copied; a caller that cannot
  // see this flag would advertise a complete copy.
  assert.equal(result.truncated, true);
});

test('reports an empty source as a zero-record copy, not a failure', async () => {
  const source = memorySpace('space-source', 'memory.source-1a2b', 'Source');
  const { service, createdSpaces } = createService({ spaces: [source], records: {} });

  const result = await service.cloneMemory('space-source', 'Empty copy');

  assert.equal(result.copiedRecords, 0);
  assert.equal(result.truncated, false);
  assert.equal(createdSpaces.length, 1);
});

test('refuses to copy a memory that is no longer the user\u2019s', async () => {
  const { service, createdSpaces } = createService({ spaces: [] });

  await assert.rejects(
    () => service.cloneMemory('space-gone', 'Copy'),
    (error: unknown) => error instanceof AgentMemoryError && /no longer exists/u.test(error.message),
  );
  assert.equal(createdSpaces.length, 0);
});

test('names a user memory so it never competes with the default one', () => {
  const type = createUserMemorySpaceType('默认记忆', () => 0.5);

  assert.notEqual(type, DEFAULT_MEMORY_SPACE_TYPE);
  assert.match(type, /^memory\./u);
});

test('gives two identically named memories distinct space types', () => {
  const first = createUserMemorySpaceType('Work', () => 0.1);
  const second = createUserMemorySpaceType('Work', () => 0.9);

  // `ai_space` admits one space per (owner, space_type), so a shared type would
  // make the second memory impossible to create.
  assert.notEqual(first, second);
  assert.equal(first.startsWith('memory.work-'), true);
  assert.equal(second.startsWith('memory.work-'), true);
});

test('bounds a memory space type to an identifier the API accepts', () => {
  const type = createUserMemorySpaceType('  A Very Long Memory Name — with símbolos!  ', () => 0);

  assert.equal(type.startsWith('memory.'), true);
  assert.equal(/[^a-z0-9.-]/u.test(type), false, `unexpected character in ${type}`);
  assert.equal(type.length <= 'memory.'.length + 32 + 1 + 4, true, `too long: ${type}`);
});

test('rejects a memory with a blank name before writing anything', async () => {
  const { service, createdSpaces } = createService({ spaces: [] });

  await assert.rejects(() => service.createMemory('   '), AgentMemoryError);
  await assert.rejects(() => service.cloneMemory('space-x', '  '), AgentMemoryError);
  assert.equal(createdSpaces.length, 0);
});

test('a save that says nothing about memory leaves the attachment alone', () => {
  // The attachment cannot be read back off the agent record, so a patch that
  // omits both fields — every caller that is not the editor — must not be read
  // as "detach". Detaching here would silently delete the user's memory link.
  assert.deepEqual(resolveAgentMemorySlotDirective({}), { kind: 'preserve' });
  assert.deepEqual(
    resolveAgentMemorySlotDirective({ name: 'Renamed only' } as { memoryEnabled?: boolean }),
    { kind: 'preserve' },
  );
});

test('an explicit memory choice becomes the slot target', () => {
  assert.deepEqual(
    resolveAgentMemorySlotDirective({ memoryEnabled: true, memorySpaceId: '  space-9  ' }),
    { kind: 'set', spaceId: 'space-9' },
  );
});

test('switching long-term memory off detaches the slot', () => {
  // `clear` wins over any stale id so the toggle alone is enough to stop an
  // agent from writing memory, without the editor having to null the field.
  assert.deepEqual(
    resolveAgentMemorySlotDirective({ memoryEnabled: false, memorySpaceId: 'space-9' }),
    { kind: 'clear' },
  );
  assert.deepEqual(resolveAgentMemorySlotDirective({ memoryEnabled: true }), { kind: 'preserve' });
});

test('the agent memory slot id is the project slot shape, and unique to memory', () => {
  assert.equal(AGENT_MEMORY_SLOT_ID, 'slot.agent.memory');
  assert.match(AGENT_MEMORY_SLOT_ID, /^slot\.[a-z0-9._-]+$/u);
});
