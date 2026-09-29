import { MAX_LIST_PAGE_SIZE } from "@sdkwork/agents-pc-core/sdk/pagination";

/**
 * Everything the agent editor needs to know about Memory, stated without a
 * single SDK import.
 *
 * `sdkwork-memory` owns memory storage, and the packages that adapt it to the
 * agents SDK pull a generated tree whose `dist/` is built by a sibling
 * repository. Keeping the semantics here — default-memory resolution, the
 * `space_type` a user memory gets, the record copy, the composition-slot
 * directive — means the rules stay reviewable and testable on their own, and
 * `AgentMemoryService` is left as the thin binding that supplies a client and
 * the signed-in user.
 */

/**
 * `space_type` of the memory that is used when nothing else is named.
 *
 * `ai_space` carries `uk_ai_space_owner_type ON (tenant_id, owner_subject_type,
 * owner_subject_id, space_type)`
 * (`sdkwork-memory/database/ddl/baseline/postgres/0001_memory_baseline.sql`), so
 * an owner holds **one space per type**. `personal` is the principal's own
 * space — the mem0 compatibility layer documents it as such when explaining why
 * it needs a type of its own, and the Memory console's own space-creation form
 * defaults to it. That makes `personal` the only type that can serve as "the
 * memory attached when the user chooses none": it is stable, singular, and
 * already the product's default body.
 *
 * The alternative authority, `MemorySubject.default_space_id`, is not reachable
 * from an app client: it appears only in the commercial/backend-admin contract,
 * the app API exposes no subject route, and the data plane never reads it when
 * creating a record.
 */
export const DEFAULT_MEMORY_SPACE_TYPE = "personal";

/**
 * Prefix for the additional memories a user creates.
 *
 * Distinct from `personal` so a second memory never competes with the default
 * one for the unique index. A prefix (rather than a closed enumeration) matches
 * how the rest of the platform namespaces synthetic references
 * (`kb.space.`, `skill.`, `tool.`), and `space_type` carries no `CHECK`
 * constraint and takes part in no authorization decision, so the additional
 * kinds are free.
 */
export const USER_MEMORY_SPACE_TYPE_PREFIX = "memory.";

/** Name given to the default memory when it has to be created. */
export const DEFAULT_MEMORY_DISPLAY_NAME = "默认记忆";

/** Bound on one clone, so a large source cannot turn a click into thousands of writes. */
export const MAX_CLONED_RECORDS = 500;

/** One page of the space list; the per-user space quota is 100, so this is the whole list. */
const SPACE_LIST_PAGE_SIZE = 200;

/** Cursor page size used when walking a space's records for a clone. */
const CLONE_PAGE_SIZE = MAX_LIST_PAGE_SIZE;

/**
 * Fixed composition slot an agent's memory lives under.
 *
 * One agent attaches at most one memory, under the same fixed id the
 * project-level instructions and memory slots already use
 * (`slot.project.instructions`, `slot.project.memory`). A per-space id would
 * make two attachments look like two legitimate slots instead of a conflict.
 */
export const AGENT_MEMORY_SLOT_ID = "slot.agent.memory";

/**
 * What a save wants done with the agent's memory slot.
 *
 * `preserve` exists because the memory attachment cannot be read back off the
 * agent record: `GET /agents/{id}` carries no memory field, so a caller that is
 * not editing the memory — every caller except the editor — says nothing and
 * the slot is left exactly as the last memory-aware save left it, instead of
 * being swept in the "not in the desired set" delete pass.
 */
export type AgentMemorySlotDirective =
  | { kind: "set"; spaceId: string }
  | { kind: "clear" }
  | { kind: "preserve" };

/**
 * The directive a save implies.
 *
 * Three states, because "no memory was mentioned" and "no memory should be
 * attached" are different requests. A patch that only renames an agent carries
 * no memory field at all, and detaching the user's memory in response would be
 * data loss; so an unmentioned memory is left alone and only an explicit choice
 * — or switching 连续性长记忆 off — changes the slot.
 */
export function resolveAgentMemorySlotDirective(config: {
  memoryEnabled?: boolean;
  memorySpaceId?: string;
}): AgentMemorySlotDirective {
  if (config.memoryEnabled === false) {
    return { kind: "clear" };
  }
  const spaceId = config.memorySpaceId?.trim();
  return spaceId ? { kind: "set", spaceId } : { kind: "preserve" };
}

export interface AgentMemoryOption {
  spaceId: string;
  displayName: string;
  spaceType: string;
  /**
   * True for the space attached when an agent names no memory of its own.
   *
   * Derived from {@link DEFAULT_MEMORY_SPACE_TYPE} rather than from a marker
   * column, because Memory exposes no per-user "default space" field on this
   * surface: the only stable answer available to a client is the type the
   * product already reserves for the principal's own space.
   */
  isDefault: boolean;
}

export interface CloneAgentMemoryResult {
  /** The newly created space, which is what the agent should now be attached to. */
  space: AgentMemoryOption;
  copiedRecords: number;
  /** True when the source held more records than {@link MAX_CLONED_RECORDS}. */
  truncated: boolean;
}

export class AgentMemoryError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "AgentMemoryError";
  }
}

/**
 * The part of the Memory app API this feature uses.
 *
 * Declared structurally, rather than imported from the generated SDK, so the
 * rules above can be exercised without a build of that tree. `AgentMemoryService`
 * passes the real client to it, which is what keeps the declaration honest:
 * a drift in the generated surface fails the type check there.
 */
export interface MemorySpaceLike {
  spaceId: string;
  displayName: string;
  spaceType: string;
}

export interface MemoryRecordLike {
  memoryId: string;
  scope: string;
  memoryType: string;
  subject?: string | null;
  predicate?: string | null;
  objectText?: string | null;
  canonicalText: string;
  summaryText?: string | null;
  expiresAt?: string | null;
  sensitivityLevel?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Body of a record write; mirrors `MemoryRecordRequest` minus the fields a client must not set. */
export interface MemoryRecordRequestLike {
  spaceId: string;
  scope: string;
  memoryType: string;
  subject?: string | null;
  predicate?: string | null;
  objectText?: string | null;
  canonicalText: string;
  summaryText?: string | null;
  expiresAt?: string | null;
  sensitivityLevel?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AgentMemoryClientLike {
  memory: {
    spaces: {
      list(params: { cursor?: string; pageSize?: number }): Promise<{ items: readonly MemorySpaceLike[] }>;
      create(
        body: {
          ownerSubjectType: string;
          ownerSubjectId: string;
          spaceType: string;
          displayName: string;
        },
        params: { idempotencyKey: string },
      ): Promise<MemorySpaceLike>;
    };
    list(params: { spaceId: string; cursor?: string; pageSize?: number }): Promise<{
      items: readonly MemoryRecordLike[];
      pageInfo?: { hasMore?: boolean; nextCursor?: string | null } | null;
    }>;
    create(
      body: MemoryRecordRequestLike,
      params: { idempotencyKey: string },
    ): Promise<MemoryRecordLike>;
  };
}

export class AgentMemoryService {
  constructor(
    private readonly getClient: () => AgentMemoryClientLike,
    /**
     * The principal a created space belongs to.
     *
     * Injected rather than read from a module-level session accessor so the
     * owner resolution is exercised by tests instead of depending on whatever
     * session happens to be ambient.
     */
    private readonly resolveUserId: () => string | undefined,
  ) {}

  /**
   * Every memory owned by the signed-in user, default first.
   *
   * `GET /memory/spaces` scopes to the caller's own spaces, so no owner filter
   * is sent and none is needed.
   */
  async listUserMemories(): Promise<AgentMemoryOption[]> {
    const response = await this.getClient().memory.spaces.list({ pageSize: SPACE_LIST_PAGE_SIZE });
    return response.items
      .map((space) => toMemoryOption(space.spaceId, space.displayName, space.spaceType))
      .sort(compareMemoryOptions);
  }

  /**
   * The memory to attach when the user has not chosen one.
   *
   * Returns `undefined` when the user owns no `personal` space, which is the
   * honest answer for a brand-new principal: creating it here would write to the
   * user's memory store as a side effect of merely opening an editor. The
   * editor's "new memory" action is the user's own way to ask for one.
   */
  async resolveDefaultMemory(): Promise<AgentMemoryOption | undefined> {
    const memories = await this.listUserMemories();
    return memories.find((memory) => memory.isDefault);
  }

  /** A memory attached to an agent, or `undefined` when it no longer exists as one. */
  async findMemory(spaceId: string): Promise<AgentMemoryOption | undefined> {
    if (!spaceId.trim()) {
      return undefined;
    }
    const memories = await this.listUserMemories();
    return memories.find((memory) => memory.spaceId === spaceId);
  }

  /**
   * The user's default memory, created if the owner has none yet.
   *
   * Memory never provisions `personal` on its own — `GET /memory/spaces` returns
   * an empty list for a fresh principal — while a record write requires a
   * `space_id`. So a user whose memory has just been switched on for the first
   * time would otherwise be handed an attachment that resolves to nothing. The
   * caller invokes this only from a save the user initiated, which is what makes
   * the write the user's request rather than a side effect of opening a page.
   *
   * Safe to retry: the create carries a fixed idempotency key and the unique
   * index admits one `personal` space per owner, so a concurrent save cannot
   * produce a second one.
   */
  async ensureDefaultMemory(
    displayName: string = DEFAULT_MEMORY_DISPLAY_NAME,
  ): Promise<AgentMemoryOption> {
    const existing = await this.resolveDefaultMemory();
    if (existing) {
      return existing;
    }
    const space = await this.createSpace(displayName, DEFAULT_MEMORY_SPACE_TYPE);
    return toMemoryOption(space.spaceId, space.displayName, space.spaceType);
  }

  /**
   * Create a memory the user can attach.
   *
   * The owner is the signed-in user: Memory rejects any `ownerSubjectId` that
   * does not match the authenticated actor (`validate_user_space_owner`), so the
   * id is read from the session rather than accepted from a caller.
   */
  async createMemory(displayName: string): Promise<AgentMemoryOption> {
    const name = displayName.trim();
    if (!name) {
      throw new AgentMemoryError("A memory needs a name.");
    }
    const space = await this.createSpace(name, createUserMemorySpaceType(name));
    return toMemoryOption(space.spaceId, space.displayName, space.spaceType);
  }

  /**
   * Copy a memory into an independent one and return the copy.
   *
   * Memory exposes no clone route, so this is a create plus a record-by-record
   * copy. It is bounded by {@link MAX_CLONED_RECORDS} and reports when it had to
   * stop, because a silent partial copy would be indistinguishable from an
   * empty memory and the user would only find out by trusting it.
   */
  async cloneMemory(sourceSpaceId: string, displayName: string): Promise<CloneAgentMemoryResult> {
    const name = displayName.trim();
    if (!name) {
      throw new AgentMemoryError("A memory copy needs a name.");
    }
    const source = await this.findMemory(sourceSpaceId);
    if (!source) {
      throw new AgentMemoryError("The memory to copy no longer exists.");
    }

    const client = this.getClient();
    const space = await this.createSpace(name, createUserMemorySpaceType(name));

    let copiedRecords = 0;
    let cursor: string | undefined;
    let truncated = false;
    for (;;) {
      const page = await client.memory.list({
        spaceId: source.spaceId,
        pageSize: CLONE_PAGE_SIZE,
        ...(cursor ? { cursor } : {}),
      });
      for (const record of page.items) {
        if (copiedRecords >= MAX_CLONED_RECORDS) {
          truncated = true;
          break;
        }
        await client.memory.create(toRecordRequest(record, space.spaceId), {
          // Replaying a copy must not duplicate a record, so the key names the
          // source record and the destination it was copied into.
          idempotencyKey: `clone.${source.spaceId}.${space.spaceId}.${record.memoryId}`,
        });
        copiedRecords += 1;
      }
      const nextCursor = page.pageInfo?.nextCursor ?? undefined;
      if (truncated || !(page.pageInfo?.hasMore === true || nextCursor)) {
        break;
      }
      cursor = nextCursor;
    }

    return {
      space: toMemoryOption(space.spaceId, space.displayName, space.spaceType),
      copiedRecords,
      truncated,
    };
  }

  private async createSpace(displayName: string, spaceType: string): Promise<MemorySpaceLike> {
    const ownerSubjectId = this.resolveUserId();
    if (!ownerSubjectId) {
      throw new AgentMemoryError(
        "The session does not expose a user id, so a memory cannot be created for it.",
      );
    }
    return this.getClient().memory.spaces.create(
      {
        ownerSubjectType: "user",
        ownerSubjectId,
        spaceType,
        displayName,
      },
      // The type already identifies the space within one owner, so the key is
      // stable: a retried create resolves to the same space instead of failing
      // on the unique index or creating a twin.
      { idempotencyKey: `space.${spaceType}` },
    );
  }
}

function toMemoryOption(spaceId: string, displayName: string, spaceType: string): AgentMemoryOption {
  return {
    spaceId,
    // A space with no display name is still selectable; falling back to the id
    // keeps the row identifiable instead of blank.
    displayName: displayName?.trim() || spaceId,
    spaceType,
    isDefault: spaceType === DEFAULT_MEMORY_SPACE_TYPE,
  };
}

function compareMemoryOptions(left: AgentMemoryOption, right: AgentMemoryOption): number {
  if (left.isDefault !== right.isDefault) {
    return left.isDefault ? -1 : 1;
  }
  return left.displayName.localeCompare(right.displayName);
}

/**
 * A stable `space_type` for a user-created memory.
 *
 * The unique index is per type, so the type has to differ between two memories
 * even when the user gives both the same name — hence the random suffix rather
 * than the name alone.
 */
export function createUserMemorySpaceType(displayName: string, random: () => number = Math.random): string {
  const slug = displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 32);
  const suffix = Math.floor(random() * 0xffffff).toString(36).padStart(4, "0");
  return `${USER_MEMORY_SPACE_TYPE_PREFIX}${slug || "memory"}-${suffix}`;
}

/**
 * Copy one record into a new space.
 *
 * Everything the record's own API reports is carried over — content, scope,
 * type, provenance fields, expiry and metadata — so a copy is a copy. Fields
 * the server owns are not: `memoryId`, `uuid`, `status`, `confidence` and the
 * supersession chain belong to the source record, and `MemoryRecordRequest`
 * does not even offer them. `userId` is left out on purpose: it must equal the
 * authenticated principal, which is the same user for every space this service
 * can list, so sending it would only add a way for the write to be rejected.
 */
export function toRecordRequest(
  record: MemoryRecordLike,
  spaceId: string,
): MemoryRecordRequestLike {
  return {
    spaceId,
    scope: record.scope,
    memoryType: record.memoryType,
    ...(record.subject ? { subject: record.subject } : {}),
    ...(record.predicate ? { predicate: record.predicate } : {}),
    ...(record.objectText ? { objectText: record.objectText } : {}),
    canonicalText: record.canonicalText,
    ...(record.summaryText ? { summaryText: record.summaryText } : {}),
    ...(record.expiresAt ? { expiresAt: record.expiresAt } : {}),
    ...(record.sensitivityLevel ? { sensitivityLevel: record.sensitivityLevel } : {}),
    ...(record.metadata ? { metadata: record.metadata } : {}),
  };
}
