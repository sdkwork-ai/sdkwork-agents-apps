import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import { isBlank, trim } from '@sdkwork/utils';
import type {
  AgentCategoryRecord,
  AgentRecord,
} from '@sdkwork/agents-pc-core/sdk/agentsBackendSdkClient';

import {
  createManagedAgent,
  listAgentCategories,
  listManagedAgents,
  restoreManagedAgent,
  updateManagedAgent,
  updateManagedAgentStatus,
} from './agentsAdminService.ts';
import { useAgentAdminCopy, type AgentAdminCopy } from './agentAdminCopy.ts';

const STATUS_OPTIONS = ['draft', 'active', 'disabled', 'archived'] as const;
const VISIBILITY_OPTIONS = ['private', 'organization', 'tenant', 'public'] as const;

type AgentStatusOption = (typeof STATUS_OPTIONS)[number];
type StatusTransitionAction = 'activate' | 'archive' | 'disable' | 'restore';

type StatusTransition = {
  /**
   * Stable transition identifier: the React list key and the
   * `copy.transitions` lookup key. The rendered label is localized.
   */
  label: StatusTransitionAction;
  /** Restores a soft-deleted agent instead of transitioning a live one. */
  restore?: boolean;
  targetStatus: AgentStatusOption;
};

const STATUS_TRANSITIONS: Record<string, readonly StatusTransition[]> = {
  draft: [
    { label: 'activate', targetStatus: 'active' },
    { label: 'archive', targetStatus: 'archived' },
  ],
  active: [
    { label: 'disable', targetStatus: 'disabled' },
    { label: 'archive', targetStatus: 'archived' },
  ],
  disabled: [
    { label: 'activate', targetStatus: 'active' },
    { label: 'archive', targetStatus: 'archived' },
  ],
  archived: [{ label: 'activate', targetStatus: 'active' }],
  deleted: [{ label: 'restore', restore: true, targetStatus: 'active' }],
};

/** Localized label for a status wire value, falling back to the wire value. */
function agentStatusLabel(copy: AgentAdminCopy, status: AgentRecord['status']): string {
  const labels: Record<string, string> = copy.status;
  return labels[status] ?? status;
}

/** Localized label for a visibility wire value, falling back to the wire value. */
function agentVisibilityLabel(copy: AgentAdminCopy, visibility: AgentRecord['visibility']): string {
  const labels: Record<string, string> = copy.visibility;
  return labels[visibility] ?? visibility;
}

/**
 * Cloud Router admin-console surface for managed agents, owned by
 * sdkwork-agents and consumed cross-repo through the backend-api surface
 * (`/backend/v3/api/ai/agents`).
 *
 * The host must bind `configureAgentsAdminRuntime({ getBackendSdkClient })`
 * before this page renders; the block never constructs transport itself.
 */
export function AgentsAdminPage() {
  const copy = useAgentAdminCopy();
  const [records, setRecords] = useState<AgentRecord[]>([]);
  const [categories, setCategories] = useState<AgentCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AgentRecord | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listManagedAgents()
      .then((page) => {
        if (!active) return;
        setRecords(page.items);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadToken]);

  useEffect(() => {
    let active = true;
    listAgentCategories({ pageSize: 200 })
      .then((page) => {
        if (active) setCategories(page.items);
      })
      .catch(() => {
        // Category lookup is a presentation enhancement for the agent list;
        // the page still works when the catalog is unavailable.
      });
    return () => {
      active = false;
    };
  }, [reloadToken]);

  const categoryNameByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) {
      map.set(category.categoryCode, category.name);
    }
    return map;
  }, [categories]);

  const runAction = useCallback(
    async (action: () => Promise<unknown>, successNotice: string): Promise<boolean> => {
      setError(null);
      setNotice(null);
      try {
        await action();
        setNotice(successNotice);
        reload();
        return true;
      } catch (cause: unknown) {
        setError(cause instanceof Error ? cause.message : String(cause));
        return false;
      }
    },
    [reload],
  );

  return (
    <section className="embedded-fill-page">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">{copy.title}</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">{copy.description}</p>
        </div>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          onClick={() => setCreateOpen(true)}
        >
          {copy.actions.newAgent}
        </button>
      </header>

      {error ? (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {copy.errors.requestFailed(error)}
        </div>
      ) : null}
      {notice ? (
        <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {notice}
        </div>
      ) : null}

      <div className="data-surface">
        <div className="table-frame">
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-zinc-400">{copy.table.loading}</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-zinc-400">{copy.table.empty}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">{copy.table.agent}</th>
                  <th className="px-3 py-2">{copy.table.code}</th>
                  <th className="px-3 py-2">{copy.table.implementation}</th>
                  <th className="px-3 py-2">{copy.table.category}</th>
                  <th className="px-3 py-2">{copy.table.visibility}</th>
                  <th className="px-3 py-2">{copy.table.status}</th>
                  <th className="px-3 py-2">{copy.table.version}</th>
                  <th className="px-3 py-2">{copy.table.updated}</th>
                  <th className="px-3 py-2">{copy.table.actions}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-t border-slate-200 dark:border-zinc-800">
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900 dark:text-zinc-100">{record.displayName}</div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400">{record.agentId}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-zinc-300">{record.code}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-zinc-300">{record.implementationType}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-zinc-300">
                      {(() => {
                        const categoryId = record.managementProfile?.categoryId;
                        if (!categoryId) {
                          return (
                            <span className="text-xs italic text-slate-400 dark:text-zinc-600">
                              {copy.table.uncategorized}
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-white/5 dark:text-zinc-400">
                            {categoryNameByCode.get(categoryId) ?? categoryId}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-zinc-300">
                      {agentVisibilityLabel(copy, record.visibility)}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-zinc-300">
                      {agentStatusLabel(copy, record.status)}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-zinc-300">{String(record.version)}</td>
                    <td className="px-3 py-2 text-xs text-slate-500 dark:text-zinc-400">{record.updatedAt}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                          onClick={() => setEditTarget(record)}
                        >
                          {copy.table.edit}
                        </button>
                        {(STATUS_TRANSITIONS[record.status] ?? []).map((transition) => (
                          <button
                            key={transition.label}
                            type="button"
                            className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                            onClick={() =>
                              void (transition.restore
                                ? runAction(
                                    () => restoreManagedAgent(record.agentId, String(record.version)),
                                    copy.notices.restored(record.displayName),
                                  )
                                : runAction(
                                    () =>
                                      updateManagedAgentStatus(
                                        record.agentId,
                                        transition.targetStatus,
                                        String(record.version),
                                      ),
                                    copy.notices.statusChanged(
                                      record.displayName,
                                      agentStatusLabel(copy, transition.targetStatus),
                                    ),
                                  ))
                            }
                          >
                            {copy.transitions[transition.label]}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {createOpen ? (
        <CreateAgentModal
          onClose={() => setCreateOpen(false)}
          onCreate={async (body) => {
            const succeeded = await runAction(
              () => createManagedAgent(body),
              copy.notices.created,
            );
            if (succeeded) {
              setCreateOpen(false);
            }
          }}
        />
      ) : null}
      {editTarget ? (
        <EditAgentModal
          categories={categories}
          record={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdate={async (agentId, body) => {
            const succeeded = await runAction(
              () => updateManagedAgent(agentId, body),
              copy.notices.updated(editTarget.displayName),
            );
            if (succeeded) {
              setEditTarget(null);
            }
          }}
        />
      ) : null}
    </section>
  );
}

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => trim(tag))
    .filter((tag) => tag.length > 0);
}

type ManifestParseFailure = 'invalidJson' | 'notObject';

type ManifestParseResult =
  | { ok: true; manifest: Record<string, unknown> }
  | { ok: false; error: ManifestParseFailure };

function parseJsonRecord(value: string): ManifestParseResult {
  if (isBlank(value)) {
    return { ok: true, manifest: {} };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return { ok: false, error: 'invalidJson' };
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'notObject' };
  }
  return { ok: true, manifest: parsed as Record<string, unknown> };
}

type CreateAgentModalProps = {
  onClose: () => void;
  onCreate: (body: Parameters<typeof createManagedAgent>[0]) => Promise<unknown>;
};

function CreateAgentModal({ onClose, onCreate }: CreateAgentModalProps) {
  const copy = useAgentAdminCopy();
  const [agentId, setAgentId] = useState('');
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<(typeof VISIBILITY_OPTIONS)[number]>('organization');
  const [implementationType, setImplementationType] = useState('sdkwork-native');
  const [manifest, setManifest] = useState('{}');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const manifestResult = parseJsonRecord(manifest);
    if (!manifestResult.ok) {
      setFormError(copy.errors.manifest[manifestResult.error]);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    void onCreate({
      agentId: trim(agentId),
      code: trim(code),
      displayName: trim(displayName),
      description: isBlank(description) ? null : description,
      manifest: manifestResult.manifest,
      implementationType: implementationType as Parameters<typeof createManagedAgent>[0]['implementationType'],
      visibility,
      tags: parseTags(''),
      allowedRoleCodes: [],
    })
      .catch((cause: unknown) => {
        setFormError(
          copy.errors.requestFailed(cause instanceof Error ? cause.message : String(cause)),
        );
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-zinc-900"
        onSubmit={submit}
      >
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-zinc-100">
          {copy.create.title}
        </h2>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">{copy.create.fields.agentId}</span>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={agentId}
              onChange={(event) => setAgentId(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">{copy.create.fields.code}</span>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">{copy.create.fields.displayName}</span>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">{copy.create.fields.description}</span>
            <textarea
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600 dark:text-zinc-300">{copy.create.fields.visibility}</span>
              <select
                className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as typeof visibility)}
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {copy.visibility[option]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600 dark:text-zinc-300">
                {copy.create.fields.implementation}
              </span>
              <input
                className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                value={implementationType}
                onChange={(event) => setImplementationType(event.target.value)}
              />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">{copy.create.fields.manifest}</span>
            <textarea
              className="rounded border border-slate-300 px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
              value={manifest}
              onChange={(event) => setManifest(event.target.value)}
              rows={4}
            />
          </label>
        </div>
        {formError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-zinc-700"
            onClick={onClose}
          >
            {copy.create.cancel}
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
            disabled={submitting}
          >
            {copy.create.submit}
          </button>
        </div>
      </form>
    </div>
  );
}

type EditAgentModalProps = {
  record: AgentRecord;
  categories: readonly AgentCategoryRecord[];
  onClose: () => void;
  onUpdate: (
    agentId: string,
    body: Parameters<typeof updateManagedAgent>[1],
  ) => Promise<unknown>;
};

function EditAgentModal({ record, categories, onClose, onUpdate }: EditAgentModalProps) {
  const copy = useAgentAdminCopy();
  const [displayName, setDisplayName] = useState(record.displayName);
  const [description, setDescription] = useState(record.description ?? '');
  const [categoryId, setCategoryId] = useState(record.managementProfile?.categoryId ?? '');
  const [visibility, setVisibility] = useState<(typeof VISIBILITY_OPTIONS)[number]>(
    (VISIBILITY_OPTIONS as readonly string[]).includes(record.visibility)
      ? record.visibility
      : 'organization',
  );
  const [tags, setTags] = useState(record.tags.join(', '));
  const [manifest, setManifest] = useState(() => JSON.stringify(record.manifest, null, 2));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const categoryOptions = categories
    .filter(
      (category) =>
        category.lifecycleStatus === 'active' || category.categoryCode === categoryId,
    )
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name));
  const currentCategory = categories.find((category) => category.categoryCode === categoryId);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const manifestResult = parseJsonRecord(manifest);
    if (!manifestResult.ok) {
      setFormError(copy.errors.manifest[manifestResult.error]);
      return;
    }
    const managementProfile = { ...(record.managementProfile ?? {}) };
    if (categoryId) {
      managementProfile.categoryId = categoryId;
    } else {
      delete managementProfile.categoryId;
    }
    setSubmitting(true);
    setFormError(null);
    void onUpdate(record.agentId, {
      displayName: trim(displayName),
      description: isBlank(description) ? null : description,
      visibility,
      tags: parseTags(tags),
      manifest: manifestResult.manifest,
      managementProfile,
      expectedVersion: String(record.version),
    })
      .catch((cause: unknown) => {
        setFormError(
          copy.errors.requestFailed(cause instanceof Error ? cause.message : String(cause)),
        );
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-zinc-900"
        onSubmit={submit}
      >
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-zinc-100">
          {copy.edit.title(record.displayName)}
        </h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-zinc-400">
          {copy.edit.meta(record.agentId, String(record.version))}
        </p>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">{copy.edit.fields.displayName}</span>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">{copy.edit.fields.description}</span>
            <textarea
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">{copy.edit.fields.visibility}</span>
            <select
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as typeof visibility)}
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {copy.visibility[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">{copy.edit.fields.category}</span>
            <select
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">{copy.edit.categoryNone}</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.categoryCode}>
                  {copy.edit.categoryOption(category.name, category.categoryCode)}
                </option>
              ))}
              {categoryId && !currentCategory ? (
                <option value={categoryId}>{copy.edit.inactiveCategory(categoryId)}</option>
              ) : null}
            </select>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              {copy.edit.categoryHint}
            </span>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">{copy.edit.fields.tags}</span>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">{copy.edit.fields.manifest}</span>
            <textarea
              className="rounded border border-slate-300 px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
              value={manifest}
              onChange={(event) => setManifest(event.target.value)}
              rows={6}
            />
          </label>
        </div>
        {formError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{formError}</p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-zinc-700"
            onClick={onClose}
          >
            {copy.edit.cancel}
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
            disabled={submitting}
          >
            {copy.edit.submit}
          </button>
        </div>
      </form>
    </div>
  );
}

export { AgentCategoriesPage } from './agentCategoriesPage.tsx';
export {
  AGENT_ADMIN_COPY,
  useAgentAdminCopy,
  useAgentAdminLocale,
  type AgentAdminCopy,
} from './agentAdminCopy.ts';
