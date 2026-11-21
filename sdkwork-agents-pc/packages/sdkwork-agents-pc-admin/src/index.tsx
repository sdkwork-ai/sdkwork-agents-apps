import { useCallback, useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from 'react';

import { isBlank, trim } from '@sdkwork/utils';
import {
  DEFAULT_LOCAL_AGENT_ENGINE_ID,
  buildConversationRuntime,
  buildLocalArchiveDistribution,
  buildLocalExecutionRuntime,
  isAgentArchiveDistribution,
  isAgentKind,
  type AgentArchiveDistribution,
  type AgentKind,
} from '@sdkwork/agents-pc-core/domain/agentRuntimeCatalog';
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
  type AgentListFilters,
} from './agentsAdminService.ts';
import { useAgentAdminCopy, type AgentAdminCopy } from './agentAdminCopy.ts';
import { AgentCategorySelect } from './components/AgentCategorySelect.tsx';
import { AgentPackageField } from './components/AgentPackageField.tsx';
import { RoleMultiSelect } from './components/RoleMultiSelect.tsx';
import { SurfaceDrawer } from './components/SurfaceOverlay.tsx';

const STATUS_OPTIONS = ['draft', 'active', 'disabled', 'archived'] as const;
const VISIBILITY_OPTIONS = ['private', 'organization', 'tenant', 'public'] as const;

const INPUT_CLASS =
  'w-full rounded-md border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60';
const LABEL_TEXT_CLASS = 'text-xs font-medium text-zinc-400';
const SECONDARY_BUTTON_CLASS =
  'rounded-md border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700/60 disabled:opacity-60';
const PRIMARY_BUTTON_CLASS =
  'rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className={LABEL_TEXT_CLASS}>{label}</span>
      {children}
    </label>
  );
}

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

/** Data-scope selector of the catalog list; `mine` = the operator's roles. */
type RoleScope = 'all' | 'mine';

/**
 * Active category options for the filter select.
 *
 * A category can be archived after it was selected; retaining the selected
 * value as an option keeps the select from rendering blank while the agent
 * list stays filtered by that code.
 */
function activeCategoryOptions(
  categories: readonly AgentCategoryRecord[],
  selected: string,
): { value: string; label: string }[] {
  const options = categories
    .filter((category) => category.lifecycleStatus === 'active')
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((category) => ({ value: category.categoryCode, label: category.name }));
  if (selected.length > 0 && !options.some((option) => option.value === selected)) {
    const retained = categories.find((category) => category.categoryCode === selected);
    options.push({ value: selected, label: retained?.name ?? selected });
  }
  return options;
}

export interface AgentsAdminPageProps {
  /**
   * IAM role codes of the signed-in operator, supplied by the composing host.
   *
   * The page offers the catalog's role-scope switch with them: `All data`
   * lists the whole tenant catalog, `My roles` keeps the agents this operator
   * can reach. Without role codes the switch stays on `All data`, because a
   * scope the host cannot name would silently empty the table.
   */
  roleCodes?: readonly string[];
}

/**
 * Cloud Router admin-console surface for managed agents, owned by
 * sdkwork-agents and consumed cross-repo through the backend-api surface
 * (`/backend/v3/api/ai/agents`).
 *
 * The host must bind `configureAgentsAdminRuntime({ getBackendSdkClient })`
 * before this page renders; the block never constructs transport itself.
 */
export function AgentsAdminPage({ roleCodes = [] }: AgentsAdminPageProps = {}) {
  const copy = useAgentAdminCopy();
  const [records, setRecords] = useState<AgentRecord[]>([]);
  const [categories, setCategories] = useState<AgentCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AgentRecord | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [roleScope, setRoleScope] = useState<RoleScope>('all');

  const usableRoleCodes = useMemo(
    () => roleCodes.map((code) => trim(code)).filter((code) => !isBlank(code)),
    [roleCodes],
  );
  const roleScopeCodes = roleScope === 'mine' ? [...usableRoleCodes].sort().join(',') : '';
  const listFilters = useMemo<AgentListFilters>(
    () => ({
      // The table renders the whole filtered list, so the request asks for the
      // maximum page the backend serves (`MAX_LIST_PAGE_SIZE`); without it the
      // default window would silently hide everything past the first 20 rows.
      pageSize: 200,
      ...(isBlank(trim(keyword)) ? {} : { q: trim(keyword) }),
      ...(isBlank(trim(categoryCode)) ? {} : { categoryCode: trim(categoryCode) }),
      ...(isBlank(roleScopeCodes) ? {} : { roleCodes: roleScopeCodes }),
    }),
    [keyword, categoryCode, roleScopeCodes],
  );

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listManagedAgents(listFilters)
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
  }, [reloadToken, listFilters]);

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
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">{copy.title}</h1>
          <p className="admin-page-header__description">{copy.description}</p>
        </div>
        <div className="admin-page-header__actions">
          <button
            type="button"
            className="admin-button admin-button--primary"
            onClick={() => setCreateOpen(true)}
          >
            {copy.actions.newAgent}
          </button>
        </div>
      </header>

      {error ? (
        <div role="alert" className="admin-alert admin-alert--error">
          {copy.errors.requestFailed(error)}
        </div>
      ) : null}
      {notice ? (
        <div role="status" className="admin-alert admin-alert--success">
          {notice}
        </div>
      ) : null}

      <div className="data-surface">
        {/* Catalog filters: keyword, category, and the operator's role scope.
            They narrow the list endpoint itself, so the totals and the visible
            rows agree, and the four AI-foundation catalogs read consistently.
            They live in the table card's header band, not above the card. */}
        <div className="admin-list-toolbar">
          <div className="admin-list-toolbar__filters">
            <label className="admin-field admin-field--search">
              <span className="admin-field__label">{copy.filters.keywordLabel}</span>
              <input
                className="admin-control"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder={copy.filters.keywordPlaceholder}
              />
            </label>
            <label className="admin-field admin-field--compact">
              <span className="admin-field__label">{copy.filters.categoryLabel}</span>
              <select
                className="admin-control"
                value={categoryCode}
                onChange={(event) => setCategoryCode(event.target.value)}
              >
                <option value="">{copy.filters.allCategories}</option>
                {activeCategoryOptions(categories, categoryCode).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-field">
              <span className="admin-field__label">{copy.filters.roleScopeLabel}</span>
              <div
                className="admin-segmented"
                role="group"
                aria-label={copy.filters.roleScopeLabel}
              >
                {(['all', 'mine'] as const).map((scope) => {
                  const disabled = scope === 'mine' && usableRoleCodes.length === 0;
                  return (
                    <button
                      key={scope}
                      type="button"
                      className="admin-segmented__item"
                      aria-pressed={roleScope === scope}
                      disabled={disabled}
                      title={disabled ? copy.filters.roleScopeUnavailable : undefined}
                      onClick={() => setRoleScope(scope)}
                    >
                      {scope === 'all'
                        ? copy.filters.roleScopeAll
                        : copy.filters.roleScopeMine}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="table-frame">
          {loading ? (
            <p className="admin-list-state">{copy.table.loading}</p>
          ) : records.length === 0 ? (
            <p className="admin-list-state">{copy.table.empty}</p>
          ) : (
            <table className="admin-list-table">
              <thead>
                <tr>
                  <th>{copy.table.agent}</th>
                  <th>{copy.table.code}</th>
                  <th>{copy.table.implementation}</th>
                  <th>{copy.table.category}</th>
                  <th>{copy.table.visibility}</th>
                  <th>{copy.table.status}</th>
                  <th>{copy.table.version}</th>
                  <th>{copy.table.updated}</th>
                  <th>{copy.table.actions}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="font-medium text-slate-900 dark:text-zinc-100">{record.displayName}</div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400">{record.agentId}</div>
                    </td>
                    <td className="text-slate-700 dark:text-zinc-300">{record.code}</td>
                    <td className="text-slate-700 dark:text-zinc-300">{record.implementationType}</td>
                    <td className="text-slate-700 dark:text-zinc-300">
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
                    <td className="text-slate-700 dark:text-zinc-300">
                      {agentVisibilityLabel(copy, record.visibility)}
                    </td>
                    <td className="text-slate-700 dark:text-zinc-300">
                      {agentStatusLabel(copy, record.status)}
                    </td>
                    <td className="text-slate-700 dark:text-zinc-300">{String(record.version)}</td>
                    <td className="text-xs text-slate-500 dark:text-zinc-400">{record.updatedAt}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="admin-button admin-button--secondary"
                          onClick={() => setEditTarget(record)}
                        >
                          {copy.table.edit}
                        </button>
                        {(STATUS_TRANSITIONS[record.status] ?? []).map((transition) => (
                          <button
                            key={transition.label}
                            type="button"
                            className="admin-button admin-button--secondary"
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
        <AgentEditorDrawer
          mode="create"
          categories={categories}
          onClose={() => setCreateOpen(false)}
          onSubmit={async (body) => {
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
        <AgentEditorDrawer
          mode="edit"
          categories={categories}
          record={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={async (body) => {
            const succeeded = await runAction(
              () => updateManagedAgent(editTarget.agentId, body),
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

type AgentEditorDrawerProps =
  | {
      mode: 'create';
      categories: AgentCategoryRecord[];
      onClose: () => void;
      onSubmit: (body: Parameters<typeof createManagedAgent>[0]) => Promise<unknown>;
    }
  | {
      mode: 'edit';
      categories: AgentCategoryRecord[];
      record: AgentRecord;
      onClose: () => void;
      onSubmit: (body: Parameters<typeof updateManagedAgent>[1]) => Promise<unknown>;
    };

/**
 * Create/edit drawer for managed agents.
 *
 * Category and role editing use the same single-row modal pickers as the
 * Skills/Plugins admin surfaces. The package section follows the existing
 * Agents distribution model: hosted conversation agents have no package, while
 * local-execution agents carry a zip archive in `manifest.distribution`.
 */
function AgentEditorDrawer(props: AgentEditorDrawerProps) {
  const copy = useAgentAdminCopy();
  const isEdit = props.mode === 'edit';
  const record = isEdit ? props.record : null;
  const formId = useId();
  const initialManifest = (record?.manifest ?? {}) as Record<string, unknown>;
  const initialKind: AgentKind = isAgentKind(initialManifest.agent_kind)
    ? initialManifest.agent_kind
    : 'conversation';
  const initialRuntime = initialManifest.runtime;
  const initialEngineId =
    initialRuntime && typeof initialRuntime === 'object'
      && typeof (initialRuntime as { engine?: unknown }).engine === 'string'
      ? (initialRuntime as { engine: string }).engine
      : DEFAULT_LOCAL_AGENT_ENGINE_ID;
  const initialDistribution = isAgentArchiveDistribution(initialManifest.distribution)
    ? (initialManifest.distribution as AgentArchiveDistribution)
    : initialKind === 'local-execution'
      ? buildLocalArchiveDistribution(initialEngineId)
      : null;
  const initialCategory =
    record?.managementProfile?.categoryId
    ?? (typeof initialManifest.category_code === 'string' ? initialManifest.category_code : '');

  const [agentId, setAgentId] = useState(record?.agentId ?? '');
  const [code, setCode] = useState(record?.code ?? '');
  const [displayName, setDisplayName] = useState(record?.displayName ?? '');
  const [description, setDescription] = useState(record?.description ?? '');
  const [visibility, setVisibility] = useState<(typeof VISIBILITY_OPTIONS)[number]>(
    (VISIBILITY_OPTIONS as readonly string[]).includes(record?.visibility ?? '')
      ? (record?.visibility as (typeof VISIBILITY_OPTIONS)[number])
      : 'organization',
  );
  const [implementationType, setImplementationType] = useState('sdkwork-native');
  const [manifestText, setManifestText] = useState(
    JSON.stringify(record?.manifest ?? {}, null, 2),
  );
  const [tags, setTags] = useState(record?.tags.join(', ') ?? '');
  const [categoryCode, setCategoryCode] = useState(initialCategory);
  const [allowedRoleCodes, setAllowedRoleCodes] = useState<string[]>(
    record?.allowedRoleCodes ?? [],
  );
  const [agentKind, setAgentKind] = useState<AgentKind>(initialKind);
  const [engineId, setEngineId] = useState(initialEngineId);
  const [distribution, setDistribution] = useState<AgentArchiveDistribution | null>(
    initialDistribution,
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const manifestResult = parseJsonRecord(manifestText);
    if (!manifestResult.ok) {
      setFormError(copy.errors.manifest[manifestResult.error]);
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const runtime =
      agentKind === 'local-execution'
        ? buildLocalExecutionRuntime(engineId)
        : buildConversationRuntime();
    const mergedManifest: Record<string, unknown> = {
      ...manifestResult.manifest,
      agent_kind: agentKind,
      runtime,
    };
    if (categoryCode) {
      mergedManifest.category_code = categoryCode;
    } else {
      delete mergedManifest.category_code;
    }
    if (agentKind === 'local-execution' && distribution) {
      mergedManifest.distribution = distribution;
    } else {
      delete mergedManifest.distribution;
    }

    // Sending a profile object without `categoryId` is what tells the backend
    // "the operator cleared the category". Keeping the stored profile (or
    // omitting the profile entirely) would read as "leave the category alone",
    // so a cleared selector would silently snap back to the previous value.
    const baseProfile = record?.managementProfile;
    const managementProfile = categoryCode
      ? { ...(baseProfile ?? {}), categoryId: categoryCode }
      : (() => {
          const { categoryId: _cleared, ...rest } = baseProfile ?? {};
          return rest;
        })();
    const implementationKind = runtime.implementation_kind as
      | Parameters<typeof createManagedAgent>[0]['implementationKind']
      | undefined;
    const createImplementationType = agentKind === 'local-execution'
      ? 'custom'
      : implementationType;
    const delivery = agentKind === 'local-execution'
      ? {
          implementationKind,
          implementationProviderId: runtime.provider_id,
        }
      : {};

    const action = props.mode === 'create'
      ? props.onSubmit({
          agentId: trim(agentId),
          code: trim(code),
          displayName: trim(displayName),
          description: isBlank(description) ? null : description,
          manifest: mergedManifest,
          ...(managementProfile ? { managementProfile } : {}),
          implementationType: createImplementationType as Parameters<typeof createManagedAgent>[0]['implementationType'],
          visibility,
          tags: parseTags(tags),
          allowedRoleCodes,
          ...delivery,
        })
      : props.onSubmit({
          displayName: trim(displayName),
          description: isBlank(description) ? null : description,
          manifest: mergedManifest,
          ...(managementProfile ? { managementProfile } : {}),
          visibility,
          tags: parseTags(tags),
          allowedRoleCodes,
          ...delivery,
        });

    void action
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
    <SurfaceDrawer
      open
      title={
        isEdit && record ? copy.edit.title(record.displayName) : copy.create.title
      }
      description={
        isEdit && record
          ? copy.edit.meta(record.agentId, String(record.version))
          : copy.description
      }
      onClose={() => {
        if (!submitting) props.onClose();
      }}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className={SECONDARY_BUTTON_CLASS}
            onClick={props.onClose}
            disabled={submitting}
          >
            {isEdit ? copy.edit.cancel : copy.create.cancel}
          </button>
          <button
            type="submit"
            form={formId}
            className={PRIMARY_BUTTON_CLASS}
            disabled={submitting}
          >
            {isEdit ? copy.edit.submit : copy.create.submit}
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="grid gap-4">
        {formError ? (
          <p role="alert" className="text-sm text-red-400">
            {formError}
          </p>
        ) : null}
        {!isEdit ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={copy.create.fields.agentId}>
              <input
                className={INPUT_CLASS}
                value={agentId}
                onChange={(event) => setAgentId(event.target.value)}
                placeholder="agent.example.assistant"
                required
              />
            </Field>
            <Field label={copy.create.fields.code}>
              <input
                className={INPUT_CLASS}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
            </Field>
          </div>
        ) : null}
        <Field label={copy.create.fields.displayName}>
          <input
            className={INPUT_CLASS}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
          />
        </Field>
        <Field label={copy.create.fields.description}>
          <textarea
            className={`${INPUT_CLASS} min-h-20`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </Field>
        <AgentCategorySelect
          categories={props.categories}
          value={categoryCode}
          onChange={setCategoryCode}
          disabled={submitting}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={copy.create.fields.visibility}>
            <select
              className={INPUT_CLASS}
              value={visibility}
              onChange={(event) => {
                const next = event.target.value;
                if ((VISIBILITY_OPTIONS as readonly string[]).includes(next)) {
                  setVisibility(next as (typeof VISIBILITY_OPTIONS)[number]);
                }
              }}
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {copy.visibility[option]}
                </option>
              ))}
            </select>
          </Field>
          {!isEdit ? (
            <Field label={copy.create.fields.implementation}>
              <select
                className={INPUT_CLASS}
                value={implementationType}
                onChange={(event) => setImplementationType(event.target.value)}
              >
                <option value="sdkwork-native">sdkwork-native</option>
                <option value="rig-rust">rig-rust</option>
                <option value="openai-agents">openai-agents</option>
                <option value="custom">custom</option>
              </select>
            </Field>
          ) : null}
        </div>
        <Field label={copy.edit.fields.tags}>
          <input
            className={INPUT_CLASS}
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </Field>
        <RoleMultiSelect
          value={allowedRoleCodes}
          onChange={setAllowedRoleCodes}
          disabled={submitting}
        />
        <AgentPackageField
          agentKind={agentKind}
          engineId={engineId}
          distribution={distribution}
          agentId={agentId}
          disabled={submitting}
          onAgentKindChange={setAgentKind}
          onEngineChange={setEngineId}
          onDistributionChange={setDistribution}
        />
        <Field label={copy.create.fields.manifest}>
          <textarea
            className={`${INPUT_CLASS} min-h-40 font-mono text-xs`}
            value={manifestText}
            onChange={(event) => setManifestText(event.target.value)}
            rows={8}
          />
        </Field>
      </form>
    </SurfaceDrawer>
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

export { AgentCategoriesPage } from './agentCategoriesPage.tsx';
export {
  AGENT_ADMIN_COPY,
  useAgentAdminCopy,
  useAgentAdminLocale,
  type AgentAdminCopy,
} from './agentAdminCopy.ts';
