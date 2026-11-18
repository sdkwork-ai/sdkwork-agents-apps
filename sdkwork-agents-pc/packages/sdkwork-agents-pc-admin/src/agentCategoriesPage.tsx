import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AgentCategoryRecord } from '@sdkwork/agents-pc-core/sdk/agentsBackendSdkClient';

import {
  listAgentCategories,
  upsertAgentCategory,
} from './agentsAdminService.ts';
import {
  useAgentCategoryCopy,
  useAgentCategoryLocale,
  type AgentCategoryCopy,
} from './agentCategoryCopy.ts';
import {
  AgentCategoryDrawer,
  type AgentCategoryEditorState,
} from './agentCategoryDrawer.tsx';
import {
  AlertIcon,
  AgentCategoryAvatar,
  AgentCategoryStatusBadge,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  EditIcon,
  FolderIcon,
  LayersIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  TagIcon,
  type AgentCategoryLifecycleStatus,
} from './agentCategoryUi.tsx';

const LIST_PAGE_SIZE = 200;
const MAX_LIST_PAGES = 10;

type StatusFilter = 'all' | AgentCategoryLifecycleStatus;

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function compareCategories(left: AgentCategoryRecord, right: AgentCategoryRecord): number {
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
}

type CategoryTreeRow = {
  record: AgentCategoryRecord;
  depth: number;
};

/**
 * Admin curation surface for the managed agent category catalog
 * (`/backend/v3/api/ai/agent_categories`).
 *
 * Design intent:
 * - the catalog is a small, ordered taxonomy, so the page loads it once and
 *   filters client-side for an instant editing loop;
 * - the table renders the two-level tree in catalog order, while a filter
 *   flattens unmatched ancestors so a matching child is never hidden;
 * - every mutation is an upsert with `expectedVersion`, and a stale edit
 *   surfaces the server's 409 instead of silently overwriting another operator;
 * - categories are retired through lifecycle status, never hard-deleted.
 *
 * The host must bind `configureAgentsAdminRuntime({ getBackendSdkClient })`
 * before this page renders; the block never constructs transport itself.
 */
export function AgentCategoriesPage() {
  const copy = useAgentCategoryCopy();
  const locale = useAgentCategoryLocale();
  const [categories, setCategories] = useState<AgentCategoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editor, setEditor] = useState<AgentCategoryEditorState | null>(null);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      // The taxonomy is small, so load every page once and filter locally.
      // The cap prevents an unbounded loop if a tenant ever accumulates an
      // unexpectedly large catalog; the footer reports a truncated view.
      const collected: AgentCategoryRecord[] = [];
      let pageNumber = 1;
      let reportedTotal = 0;
      for (;;) {
        const page = await listAgentCategories({ page: pageNumber, pageSize: LIST_PAGE_SIZE });
        collected.push(...page.items);
        reportedTotal = Number(page.pageInfo.totalItems ?? collected.length);
        if (
          page.items.length === 0 ||
          collected.length >= reportedTotal ||
          pageNumber >= MAX_LIST_PAGES
        ) {
          break;
        }
        pageNumber += 1;
      }
      setCategories(collected);
      setTotal(reportedTotal);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byId = useMemo(() => {
    const map = new Map<string, AgentCategoryRecord>();
    for (const category of categories) {
      map.set(category.id, category);
    }
    return map;
  }, [categories]);

  const activeCount = useMemo(
    () => categories.filter((category) => category.lifecycleStatus === 'active').length,
    [categories],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<AgentCategoryLifecycleStatus, number> = {
      active: 0,
      draft: 0,
      disabled: 0,
      archived: 0,
      deleted: 0,
    };
    for (const category of categories) {
      counts[category.lifecycleStatus] += 1;
    }
    return counts;
  }, [categories]);

  const statusTabs = useMemo(
    () => [
      { value: 'all' as const, count: categories.length },
      { value: 'active' as const, count: statusCounts.active },
      { value: 'draft' as const, count: statusCounts.draft },
      { value: 'disabled' as const, count: statusCounts.disabled },
      { value: 'archived' as const, count: statusCounts.archived },
    ],
    [categories.length, statusCounts],
  );

  const copyCode = useCallback(async (categoryCode: string) => {
    try {
      await navigator.clipboard.writeText(categoryCode);
      setCopiedCode(categoryCode);
      window.setTimeout(() => {
        setCopiedCode((current) => (current === categoryCode ? null : current));
      }, 1500);
    } catch {
      // Clipboard access can be denied by the browser; the code remains
      // selectable in the table, so this is a non-fatal enhancement.
    }
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return categories.filter((category) => {
      if (statusFilter !== 'all' && category.lifecycleStatus !== statusFilter) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      const parentName = category.parentId ? byId.get(category.parentId)?.name ?? '' : '';
      return [category.name, category.categoryCode, category.description ?? '', parentName].some(
        (value) => value.toLowerCase().includes(keyword),
      );
    });
  }, [byId, categories, query, statusFilter]);

  /**
   * Flattens the visible categories as a two-level tree. A child whose parent
   * is filtered out becomes a root so filtering never hides a match; the
   * depth is still capped at one by the backend contract.
   */
  const rows = useMemo<CategoryTreeRow[]>(() => {
    const visibleIds = new Set(filtered.map((category) => category.id));
    const childrenByParent = new Map<string, AgentCategoryRecord[]>();
    const roots: AgentCategoryRecord[] = [];

    for (const category of filtered) {
      if (category.parentId && visibleIds.has(category.parentId)) {
        const siblings = childrenByParent.get(category.parentId) ?? [];
        siblings.push(category);
        childrenByParent.set(category.parentId, siblings);
      } else {
        roots.push(category);
      }
    }

    roots.sort(compareCategories);
    for (const siblings of childrenByParent.values()) {
      siblings.sort(compareCategories);
    }

    const treeRows: CategoryTreeRow[] = [];
    const visit = (record: AgentCategoryRecord, depth: number) => {
      treeRows.push({ record, depth });
      for (const child of childrenByParent.get(record.id) ?? []) {
        visit(child, depth + 1);
      }
    };
    for (const root of roots) {
      visit(root, 0);
    }
    return treeRows;
  }, [filtered]);

  const filtersActive = query.trim().length > 0 || statusFilter !== 'all';

  const exportCsv = useCallback(() => {
    if (rows.length === 0) return;
    const header = [
      'category_code',
      'name',
      'description',
      'parent_code',
      'sort_order',
      'status',
      'icon_ref',
      'updated_at',
      'version',
    ];
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const lines = [header.join(',')];
    for (const { record } of rows) {
      const parentCode = record.parentId
        ? byId.get(record.parentId)?.categoryCode ?? ''
        : '';
      lines.push(
        [
          record.categoryCode,
          record.name,
          record.description ?? '',
          parentCode,
          String(record.sortOrder),
          record.lifecycleStatus,
          record.iconRef ?? '',
          record.updatedAt,
          record.version,
        ]
          .map((value) => escape(String(value)))
          .join(','),
      );
    }
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agent-categories-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [byId, rows]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setStatusFilter('all');
  }, []);

  const saveCategory = useCallback(
    async (categoryCode: string, body: Parameters<typeof upsertAgentCategory>[1]) => {
      setError(null);
      await upsertAgentCategory(categoryCode, body);
      setEditor(null);
      setNotice(copy.notices.saved(body.name));
      void load(true);
    },
    [copy, load],
  );

  const toggleStatus = useCallback(
    async (record: AgentCategoryRecord) => {
      const nextStatus: AgentCategoryLifecycleStatus =
        record.lifecycleStatus === 'active' ? 'disabled' : 'active';
      setBusyCode(record.categoryCode);
      setError(null);
      setNotice(null);
      try {
        await upsertAgentCategory(record.categoryCode, {
          name: record.name,
          description: record.description ?? undefined,
          parentId: record.parentId,
          sortOrder: record.sortOrder,
          iconRef: record.iconRef ?? undefined,
          status: nextStatus,
          expectedVersion: record.version,
        });
        setNotice(
          nextStatus === 'active'
            ? copy.notices.activated(record.name)
            : copy.notices.disabled(record.name),
        );
        void load(true);
      } catch (cause) {
        const message = errorMessage(cause);
        setError(
          /version|conflict|409/i.test(message) ? copy.errors.conflict : message,
        );
        void load(true);
      } finally {
        setBusyCode(null);
      }
    },
    [copy, load],
  );

  return (
    <section className="embedded-fill-page">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-zinc-500">
            {copy.eyebrow}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
            {copy.title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
            {copy.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-white/5"
            disabled={rows.length === 0}
            onClick={exportCsv}
            title={copy.actions.exportTitle}
            type="button"
          >
            <DownloadIcon className="h-4 w-4" />
            {copy.actions.export}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            onClick={() => setEditor({ mode: 'create' })}
            type="button"
          >
            <PlusIcon className="h-4 w-4" />
            {copy.actions.newCategory}
          </button>
        </div>
      </header>

      <div className="mb-3 flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 dark:bg-white/[0.04]">
        {statusTabs.map((tab) => {
          const selected = statusFilter === tab.value;
          return (
            <button
              aria-pressed={selected}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 ${
                selected
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              type="button"
            >
              {copy.tabs[tab.value]}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                  selected
                    ? 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-zinc-300'
                    : 'bg-slate-200/70 text-slate-500 dark:bg-white/5 dark:text-zinc-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[14rem] flex-1 sm:max-w-sm">
          <span className="sr-only">{copy.search.label}</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.search.placeholder}
            value={query}
          />
        </label>

        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <LayersIcon className="h-3.5 w-3.5" />
            {filtersActive
              ? copy.summary.ofTotal(filtered.length, total)
              : copy.summary.total(total)}
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">·</span>
          <span>{copy.summary.active(activeCount)}</span>
          {filtersActive ? (
            <button
              className="rounded px-1.5 py-0.5 font-medium text-slate-600 underline-offset-2 hover:underline dark:text-zinc-300"
              onClick={clearFilters}
              type="button"
            >
              {copy.summary.clearFilters}
            </button>
          ) : null}
        </div>
      </div>

      {notice ? (
        <div
          className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
          role="status"
        >
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">{notice}</span>
          <button
            aria-label={copy.actions.dismissNotification}
            className="rounded p-0.5 text-emerald-700/70 hover:text-emerald-900 dark:text-emerald-300/70 dark:hover:text-emerald-100"
            onClick={() => setNotice(null)}
            type="button"
          >
            ×
          </button>
        </div>
      ) : null}

      {error ? (
        <div
          className="mb-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
          role="alert"
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">{error}</span>
          <button
            className="inline-flex items-center gap-1 rounded border border-red-300 px-2 py-0.5 text-xs font-medium hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/40"
            onClick={() => void load()}
            type="button"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            {copy.errors.retry}
          </button>
        </div>
      ) : null}

      <div className="data-surface">
        <div className="table-frame overflow-x-auto">
          {loading ? (
            <CategoryTableSkeleton label={copy.table.loadingLabel} />
          ) : categories.length === 0 && error ? (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                <AlertIcon className="h-6 w-6" />
              </span>
              <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                {copy.errors.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                {copy.errors.description}
              </p>
            </div>
          ) : categories.length === 0 ? (
            <CategoryEmptyState
              copy={copy}
              onCreate={() => setEditor({ mode: 'create' })}
              variant="empty"
            />
          ) : filtered.length === 0 ? (
            <CategoryEmptyState
              copy={copy}
              onClear={clearFilters}
              variant="noResults"
            />
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-zinc-800">
              <caption className="sr-only">{copy.table.caption}</caption>
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-zinc-800/60 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">{copy.table.category}</th>
                  <th className="px-4 py-3 font-semibold">{copy.table.code}</th>
                  <th className="px-4 py-3 font-semibold">{copy.table.placement}</th>
                  <th className="px-4 py-3 font-semibold">{copy.table.order}</th>
                  <th className="px-4 py-3 font-semibold">{copy.table.status}</th>
                  <th className="px-4 py-3 font-semibold">{copy.table.updated}</th>
                  <th className="px-4 py-3 text-right font-semibold">{copy.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {rows.map(({ record, depth }) => {
                  const parent = record.parentId ? byId.get(record.parentId) : undefined;
                  const isBusy = busyCode === record.categoryCode;
                  return (
                    <tr
                      className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
                      key={record.id}
                    >
                      <td className="px-4 py-3 align-top">
                        <div
                          className="flex items-start gap-3"
                          style={{ paddingLeft: depth > 0 ? '1.25rem' : undefined }}
                        >
                          <span
                            aria-hidden="true"
                            className={`mt-1 h-8 w-px shrink-0 rounded-full ${
                              depth > 0 ? 'bg-slate-200 dark:bg-white/10' : 'bg-transparent'
                            }`}
                          />
                          <AgentCategoryAvatar record={record} depth={depth} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-slate-900 dark:text-zinc-100">
                                {record.name}
                              </span>
                              {depth > 0 ? (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-zinc-400">
                                  {copy.table.child}
                                </span>
                              ) : null}
                            </div>
                            {record.description ? (
                              <p className="mt-0.5 line-clamp-2 max-w-md text-xs leading-5 text-slate-500 dark:text-zinc-400">
                                {record.description}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-xs italic text-slate-400 dark:text-zinc-600">
                                {copy.table.noDescription}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="inline-flex items-center gap-1">
                          <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600 dark:bg-white/5 dark:text-zinc-400">
                            <TagIcon className="h-3 w-3" />
                            {record.categoryCode}
                          </span>
                          <button
                            aria-label={
                              copiedCode === record.categoryCode
                                ? copy.table.copiedCode(record.categoryCode)
                                : copy.table.copyCode(record.categoryCode)
                            }
                            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
                            onClick={() => void copyCode(record.categoryCode)}
                            title={
                              copiedCode === record.categoryCode
                                ? copy.table.copied
                                : copy.table.copyTitle
                            }
                            type="button"
                          >
                            {copiedCode === record.categoryCode ? (
                              <CheckIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <CopyIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-slate-600 dark:text-zinc-300">
                        {parent ? (
                          <span className="inline-flex items-center gap-1.5">
                            <FolderIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span className="max-w-[10rem] truncate">{parent.name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500">
                            {copy.table.topLevel}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top tabular-nums text-slate-600 dark:text-zinc-300">
                        {record.sortOrder}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <AgentCategoryStatusBadge status={record.lifecycleStatus} />
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-slate-500 dark:text-zinc-400">
                        <div>{formatDate(record.updatedAt, locale)}</div>
                        <div className="mt-0.5 font-mono text-[10px] text-slate-400 dark:text-zinc-600">
                          v{record.version}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex justify-end gap-2">
                          <button
                            className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
                            onClick={() => setEditor({ mode: 'edit', record })}
                            type="button"
                          >
                            <EditIcon className="h-3.5 w-3.5" />
                            {copy.table.edit}
                          </button>
                          <button
                            className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
                            disabled={isBusy}
                            onClick={() => void toggleStatus(record)}
                            title={
                              record.lifecycleStatus === 'active'
                                ? copy.table.disableTitle
                                : copy.table.activateTitle
                            }
                            type="button"
                          >
                            {record.lifecycleStatus === 'active'
                              ? copy.table.disable
                              : copy.table.activate}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {!loading && categories.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500 dark:border-white/10 dark:text-zinc-400">
            <span>{copy.footer.showing(rows.length, total, categories.length)}</span>
            <span>{copy.footer.sorted}</span>
          </div>
        ) : null}
      </div>

      {editor ? (
        <AgentCategoryDrawer
          categories={categories}
          key={editor.mode === 'edit' ? `edit:${editor.record.id}` : 'create'}
          onClose={() => setEditor(null)}
          onSave={saveCategory}
          state={editor}
        />
      ) : null}
    </section>
  );
}

function CategoryTableSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="divide-y divide-slate-100 dark:divide-zinc-800">
      {Array.from({ length: 5 }, (_, index) => (
        <div className="flex items-center gap-4 px-4 py-4" key={index}>
          <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-white/5" />
          </div>
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100 dark:bg-white/5" />
          <div className="h-7 w-24 animate-pulse rounded bg-slate-100 dark:bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function CategoryEmptyState({
  copy,
  variant,
  onCreate,
  onClear,
}: {
  copy: AgentCategoryCopy;
  variant: 'empty' | 'noResults';
  onCreate?: () => void;
  onClear?: () => void;
}) {
  const content = variant === 'empty' ? copy.empty : copy.noResults;
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-zinc-400">
        <LayersIcon className="h-6 w-6" />
      </span>
      <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
        {content.title}
      </h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-zinc-400">
        {content.description}
      </p>
      {onCreate ? (
        <button
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
          onClick={onCreate}
          type="button"
        >
          <PlusIcon className="h-4 w-4" />
          {copy.empty.create}
        </button>
      ) : null}
      {onClear ? (
        <button
          className="mt-5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
          onClick={onClear}
          type="button"
        >
          {copy.noResults.clear}
        </button>
      ) : null}
    </div>
  );
}
