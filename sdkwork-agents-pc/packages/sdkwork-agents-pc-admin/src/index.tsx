import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { isBlank, trim } from '@sdkwork/utils';
import type {
  AgentRecord,
} from '@sdkwork/agents-pc-core/sdk/agentsBackendSdkClient';

import {
  createManagedAgent,
  listManagedAgents,
  restoreManagedAgent,
  updateManagedAgent,
  updateManagedAgentStatus,
} from './agentsAdminService.ts';

const STATUS_OPTIONS = ['draft', 'active', 'disabled', 'archived'] as const;
const VISIBILITY_OPTIONS = ['private', 'organization', 'tenant', 'public'] as const;

type AgentStatusOption = (typeof STATUS_OPTIONS)[number];

type StatusTransition = {
  label: string;
  /** Restores a soft-deleted agent instead of transitioning a live one. */
  restore?: boolean;
  targetStatus: AgentStatusOption;
};

const STATUS_TRANSITIONS: Record<string, readonly StatusTransition[]> = {
  draft: [
    { label: 'Activate', targetStatus: 'active' },
    { label: 'Archive', targetStatus: 'archived' },
  ],
  active: [
    { label: 'Disable', targetStatus: 'disabled' },
    { label: 'Archive', targetStatus: 'archived' },
  ],
  disabled: [
    { label: 'Activate', targetStatus: 'active' },
    { label: 'Archive', targetStatus: 'archived' },
  ],
  archived: [{ label: 'Activate', targetStatus: 'active' }],
  deleted: [{ label: 'Restore record', restore: true, targetStatus: 'active' }],
};

/**
 * Cloud Router admin-console surface for managed agents, owned by
 * sdkwork-agents and consumed cross-repo through the backend-api surface
 * (`/backend/v3/api/ai/agents`).
 *
 * The host must bind `configureAgentsAdminRuntime({ getBackendSdkClient })`
 * before this page renders; the block never constructs transport itself.
 */
export function AgentsAdminPage() {
  const [records, setRecords] = useState<AgentRecord[]>([]);
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
          <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Agent Management</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Managed agents served through the backend administration API.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          onClick={() => setCreateOpen(true)}
        >
          New agent
        </button>
      </header>

      {error ? (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
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
            <p className="text-sm text-slate-500 dark:text-zinc-400">Loading agents…</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-zinc-400">No managed agents yet</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Agent</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Implementation</th>
                  <th className="px-3 py-2">Visibility</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Version</th>
                  <th className="px-3 py-2">Updated</th>
                  <th className="px-3 py-2">Actions</th>
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
                    <td className="px-3 py-2 text-slate-700 dark:text-zinc-300">{record.visibility}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-zinc-300">{record.status}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-zinc-300">{String(record.version)}</td>
                    <td className="px-3 py-2 text-xs text-slate-500 dark:text-zinc-400">{record.updatedAt}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                          onClick={() => setEditTarget(record)}
                        >
                          Edit
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
                                    `Agent ${record.displayName} restored`,
                                  )
                                : runAction(
                                    () =>
                                      updateManagedAgentStatus(
                                        record.agentId,
                                        transition.targetStatus,
                                        String(record.version),
                                      ),
                                    `Agent ${record.displayName} is now ${transition.targetStatus}`,
                                  ))
                            }
                          >
                            {transition.label}
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
            const succeeded = await runAction(() => createManagedAgent(body), 'Agent created');
            if (succeeded) {
              setCreateOpen(false);
            }
          }}
        />
      ) : null}
      {editTarget ? (
        <EditAgentModal
          record={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdate={async (agentId, body) => {
            const succeeded = await runAction(
              () => updateManagedAgent(agentId, body),
              `Agent ${editTarget.displayName} updated`,
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

function parseJsonRecord(value: string): Record<string, unknown> | string {
  if (isBlank(value)) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return 'Manifest must be a JSON object';
    }
    return parsed as Record<string, unknown>;
  } catch {
    return 'Manifest is not valid JSON';
  }
}

type CreateAgentModalProps = {
  onClose: () => void;
  onCreate: (body: Parameters<typeof createManagedAgent>[0]) => Promise<unknown>;
};

function CreateAgentModal({ onClose, onCreate }: CreateAgentModalProps) {
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
    const parsedManifest = parseJsonRecord(manifest);
    if (typeof parsedManifest === 'string') {
      setFormError(parsedManifest);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    void onCreate({
      agentId: trim(agentId),
      code: trim(code),
      displayName: trim(displayName),
      description: isBlank(description) ? null : description,
      manifest: parsedManifest,
      implementationType: implementationType as Parameters<typeof createManagedAgent>[0]['implementationType'],
      visibility,
      tags: parseTags(''),
      allowedRoleCodes: [],
    })
      .catch((cause: unknown) => {
        setFormError(cause instanceof Error ? cause.message : String(cause));
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
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-zinc-100">Create agent</h2>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">Agent ID</span>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={agentId}
              onChange={(event) => setAgentId(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">Code</span>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">Display name</span>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">Description</span>
            <textarea
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600 dark:text-zinc-300">Visibility</span>
              <select
                className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as typeof visibility)}
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600 dark:text-zinc-300">Implementation</span>
              <input
                className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                value={implementationType}
                onChange={(event) => setImplementationType(event.target.value)}
              />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">Manifest (JSON object)</span>
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
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
            disabled={submitting}
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

type EditAgentModalProps = {
  record: AgentRecord;
  onClose: () => void;
  onUpdate: (
    agentId: string,
    body: Parameters<typeof updateManagedAgent>[1],
  ) => Promise<unknown>;
};

function EditAgentModal({ record, onClose, onUpdate }: EditAgentModalProps) {
  const [displayName, setDisplayName] = useState(record.displayName);
  const [description, setDescription] = useState(record.description ?? '');
  const [visibility, setVisibility] = useState<(typeof VISIBILITY_OPTIONS)[number]>(
    (VISIBILITY_OPTIONS as readonly string[]).includes(record.visibility)
      ? record.visibility
      : 'organization',
  );
  const [tags, setTags] = useState(record.tags.join(', '));
  const [manifest, setManifest] = useState(() => JSON.stringify(record.manifest, null, 2));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedManifest = parseJsonRecord(manifest);
    if (typeof parsedManifest === 'string') {
      setFormError(parsedManifest);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    void onUpdate(record.agentId, {
      displayName: trim(displayName),
      description: isBlank(description) ? null : description,
      visibility,
      tags: parseTags(tags),
      manifest: parsedManifest,
      expectedVersion: String(record.version),
    })
      .catch((cause: unknown) => {
        setFormError(cause instanceof Error ? cause.message : String(cause));
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
          Edit agent {record.displayName}
        </h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-zinc-400">
          {record.agentId} · version {String(record.version)}
        </p>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">Display name</span>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">Description</span>
            <textarea
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">Visibility</span>
            <select
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as typeof visibility)}
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">Tags (comma separated)</span>
            <input
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600 dark:text-zinc-300">Manifest (JSON object)</span>
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
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
            disabled={submitting}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
