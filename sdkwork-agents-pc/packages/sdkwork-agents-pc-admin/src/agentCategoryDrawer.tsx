import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';

import type {
  AgentCategoryRecord,
  AgentCategoryUpsertRequest,
} from '@sdkwork/agents-pc-core/sdk/agentsBackendSdkClient';

import {
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  EDITABLE_STATUS_VALUES,
  FolderIcon,
  type AgentCategoryEditableStatus,
} from './agentCategoryUi.tsx';
import { useAgentCategoryCopy, type AgentCategoryCopy } from './agentCategoryCopy.ts';

const CATEGORY_CODE_PATTERN = /^[a-z0-9][a-z0-9_-]{1,127}$/;
const MAX_NAME_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_ICON_REF_LENGTH = 512;
const MAX_SORT_ORDER = 9999;

export type AgentCategoryEditorState =
  | { mode: 'create' }
  | { mode: 'edit'; record: AgentCategoryRecord };

type FormValues = {
  categoryCode: string;
  name: string;
  description: string;
  parentId: string;
  sortOrder: string;
  iconRef: string;
  status: AgentCategoryEditableStatus;
};

type FormErrors = Partial<
  Record<'categoryCode' | 'name' | 'description' | 'parentId' | 'sortOrder' | 'iconRef', string>
>;

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

function initialValues(state: AgentCategoryEditorState): FormValues {
  if (state.mode === 'edit') {
    return {
      categoryCode: state.record.categoryCode,
      name: state.record.name,
      description: state.record.description ?? '',
      parentId: state.record.parentId ?? '',
      sortOrder: String(state.record.sortOrder),
      iconRef: state.record.iconRef ?? '',
      status: state.record.lifecycleStatus === 'deleted' ? 'archived' : state.record.lifecycleStatus,
    };
  }
  return {
    categoryCode: '',
    name: '',
    description: '',
    parentId: '',
    sortOrder: '0',
    iconRef: '',
    status: 'active',
  };
}

function validate(
  values: FormValues,
  categories: readonly AgentCategoryRecord[],
  state: AgentCategoryEditorState,
  copy: AgentCategoryCopy,
): FormErrors {
  const errors: FormErrors = {};

  if (state.mode === 'create') {
    const code = values.categoryCode.trim();
    if (!code) {
      errors.categoryCode = copy.drawer.errors.codeRequired;
    } else if (!CATEGORY_CODE_PATTERN.test(code)) {
      errors.categoryCode = copy.drawer.errors.codeInvalid;
    }
  }

  const name = values.name.trim();
  if (!name) {
    errors.name = copy.drawer.errors.nameRequired;
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = copy.drawer.errors.nameTooLong;
  }

  if (values.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = copy.drawer.errors.descriptionTooLong;
  }

  if (values.iconRef.trim().length > MAX_ICON_REF_LENGTH) {
    errors.iconRef = copy.drawer.errors.iconTooLong;
  }

  const sortOrder = Number.parseInt(values.sortOrder, 10);
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > MAX_SORT_ORDER) {
    errors.sortOrder = copy.drawer.errors.sortInvalid;
  }

  if (values.parentId) {
    const parent = categories.find((category) => category.id === values.parentId);
    const currentRecord =
      state.mode === 'edit'
        ? state.record
        : categories.find((category) => category.categoryCode === values.categoryCode.trim());
    if (!parent) {
      errors.parentId = copy.drawer.errors.parentMissing;
    } else if (parent.lifecycleStatus !== 'active' && parent.id !== currentRecord?.parentId) {
      errors.parentId = copy.drawer.errors.parentInactive;
    } else if (parent.parentId !== null) {
      errors.parentId = copy.drawer.errors.parentNested;
    } else if (currentRecord && parent.id === currentRecord.id) {
      errors.parentId = copy.drawer.errors.parentSelf;
    }
  }

  return errors;
}

export function AgentCategoryDrawer({
  state,
  categories,
  onClose,
  onSave,
}: {
  state: AgentCategoryEditorState;
  categories: readonly AgentCategoryRecord[];
  onClose: () => void;
  onSave: (categoryCode: string, body: AgentCategoryUpsertRequest) => Promise<void>;
}) {
  const editing = state.mode === 'edit' ? state.record : null;
  const copy = useAgentCategoryCopy();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(
    typeof document === 'undefined' ? null : document.activeElement,
  );
  const [values, setValues] = useState<FormValues>(() => initialValues(state));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hasChildren = useMemo(
    () => (editing ? categories.some((category) => category.parentId === editing.id) : false),
    [categories, editing],
  );

  const existingWithCode = useMemo(() => {
    if (editing) return null;
    const code = values.categoryCode.trim();
    if (!code) return null;
    return categories.find((category) => category.categoryCode === code) ?? null;
  }, [categories, editing, values.categoryCode]);

  const parentOptions = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.id !== editing?.id &&
          category.parentId === null &&
          category.lifecycleStatus === 'active',
      ),
    [categories, editing],
  );

  /**
   * A category may keep an existing parent that has since been disabled; the
   * parent is still shown (marked inactive) so editing unrelated fields does
   * not silently re-point the category. Choosing an inactive parent for a new
   * placement remains rejected by the backend.
   */
  const retainedInactiveParent = useMemo(() => {
    if (!editing?.parentId) return null;
    if (parentOptions.some((category) => category.id === editing.parentId)) return null;
    return categories.find((category) => category.id === editing.parentId) ?? null;
  }, [categories, editing, parentOptions]);

  useEffect(() => {
    return () => {
      const previous = previousFocusRef.current;
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus();
      }
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) {
        onClose();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const panel = panelRef.current;
      if (!panel) {
        return;
      }
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, saving]);

  const update = <Key extends keyof FormValues>(key: Key, value: FormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key as keyof FormErrors];
      return next;
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;

    const nextErrors = validate(values, categories, state, copy);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const sortOrder = Number.parseInt(values.sortOrder, 10);
    const description = values.description.trim();
    const iconRef = values.iconRef.trim();
    const parentId = values.parentId.trim();
    const body: AgentCategoryUpsertRequest = {
      name: values.name.trim(),
      ...(description ? { description } : {}),
      parentId: parentId ? parentId : null,
      sortOrder,
      ...(iconRef ? { iconRef } : {}),
      status: values.status,
      ...(editing
        ? { expectedVersion: editing.version }
        : existingWithCode
          ? { expectedVersion: existingWithCode.version }
          : {}),
    };

    setSaving(true);
    setSubmitError(null);
    try {
      await onSave(editing?.categoryCode ?? values.categoryCode.trim(), body);
    } catch (cause) {
      const message = errorMessage(cause);
      setSubmitError(
        /version|conflict|409/i.test(message) ? copy.drawer.errors.conflict : message,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50" data-agent-category-drawer>
      <button
        aria-label={copy.drawer.closeLabel}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/40 backdrop-blur-[1px]"
        onClick={() => {
          if (!saving) onClose();
        }}
        tabIndex={-1}
        type="button"
      />
      <div
        aria-labelledby="agent-category-drawer-title"
        aria-modal="true"
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#17191f]"
        ref={panelRef}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-zinc-500">
              {editing ? copy.drawer.editEyebrow : copy.drawer.createEyebrow}
            </p>
            <h2
              className="truncate text-lg font-semibold text-slate-900 dark:text-zinc-100"
              id="agent-category-drawer-title"
            >
              {editing ? copy.drawer.editTitle(editing.name) : copy.drawer.createTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              {editing
                ? copy.drawer.editSubtitle(editing.categoryCode)
                : copy.drawer.createSubtitle}
            </p>
          </div>
          <button
            aria-label={copy.drawer.closeLabel}
            className="-mr-1 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-wait disabled:opacity-50 dark:hover:bg-white/5 dark:hover:text-zinc-200"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={submit}>
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-5">
            {submitError ? (
              <div
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
                role="alert"
              >
                {submitError}
              </div>
            ) : null}

            <FormSection
              description={copy.drawer.sections.identityDescription}
              title={copy.drawer.sections.identityTitle}
            >
              <Field
                error={errors.categoryCode}
                hint={
                  editing
                    ? copy.drawer.hints.codeImmutable
                    : existingWithCode
                      ? copy.drawer.hints.codeExists(existingWithCode.categoryCode)
                      : copy.drawer.hints.codePattern
                }
                id="agent-category-code"
                label={copy.drawer.fields.code}
                required={!editing}
              >
                <input
                  aria-describedby="agent-category-code-hint"
                  aria-invalid={errors.categoryCode ? true : undefined}
                  autoFocus={!editing}
                  className={inputClassName(Boolean(errors.categoryCode), 'font-mono')}
                  disabled={Boolean(editing)}
                  id="agent-category-code"
                  onChange={(event) => update('categoryCode', event.target.value)}
                  placeholder={copy.drawer.placeholders.code}
                  value={values.categoryCode}
                />
              </Field>

              <Field
                error={errors.name}
                hint={copy.drawer.hints.name}
                id="agent-category-name"
                label={copy.drawer.fields.name}
                required
              >
                <input
                  aria-describedby="agent-category-name-hint"
                  aria-invalid={errors.name ? true : undefined}
                  autoFocus={Boolean(editing)}
                  className={inputClassName(Boolean(errors.name))}
                  id="agent-category-name"
                  maxLength={MAX_NAME_LENGTH}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder={copy.drawer.placeholders.name}
                  value={values.name}
                />
              </Field>
            </FormSection>

            <FormSection
              description={copy.drawer.sections.placementDescription}
              title={copy.drawer.sections.placementTitle}
            >
              <Field
                error={errors.parentId}
                hint={
                  hasChildren
                    ? copy.drawer.hints.parentHasChildren
                    : copy.drawer.hints.parent
                }
                id="agent-category-parent"
                label={copy.drawer.fields.parent}
              >
                <div className="relative">
                  <select
                    aria-describedby="agent-category-parent-hint"
                    aria-invalid={errors.parentId ? true : undefined}
                    className={`${inputClassName(Boolean(errors.parentId))} appearance-none pr-9`}
                    disabled={hasChildren}
                    id="agent-category-parent"
                    onChange={(event) => update('parentId', event.target.value)}
                    value={values.parentId}
                  >
                    <option value="">{copy.drawer.parentNone}</option>
                    {retainedInactiveParent ? (
                      <option value={retainedInactiveParent.id}>
                        {copy.drawer.parentInactive(retainedInactiveParent.name)}
                      </option>
                    ) : null}
                    {parentOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.categoryCode})
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </Field>

              <Field
                error={errors.sortOrder}
                hint={copy.drawer.hints.sortOrder}
                id="agent-category-sort-order"
                label={copy.drawer.fields.sortOrder}
              >
                <input
                  aria-describedby="agent-category-sort-order-hint"
                  aria-invalid={errors.sortOrder ? true : undefined}
                  className={inputClassName(Boolean(errors.sortOrder))}
                  id="agent-category-sort-order"
                  inputMode="numeric"
                  max={MAX_SORT_ORDER}
                  min={0}
                  onChange={(event) => update('sortOrder', event.target.value)}
                  type="number"
                  value={values.sortOrder}
                />
              </Field>
            </FormSection>

            <FormSection
              description={copy.drawer.sections.presentationDescription}
              title={copy.drawer.sections.presentationTitle}
            >
              <Field
                error={errors.description}
                hint={copy.drawer.hints.description}
                id="agent-category-description"
                label={copy.drawer.fields.description}
              >
                <textarea
                  aria-describedby="agent-category-description-hint"
                  aria-invalid={errors.description ? true : undefined}
                  className={`${inputClassName(Boolean(errors.description))} min-h-[88px] resize-y`}
                  id="agent-category-description"
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  onChange={(event) => update('description', event.target.value)}
                  placeholder={copy.drawer.placeholders.description}
                  rows={3}
                  value={values.description}
                />
                <p className="mt-1 text-right text-xs text-slate-400 dark:text-zinc-500">
                  {values.description.length}/{MAX_DESCRIPTION_LENGTH}
                </p>
              </Field>

              <Field
                error={errors.iconRef}
                hint={copy.drawer.hints.iconRef}
                id="agent-category-icon-ref"
                label={copy.drawer.fields.iconRef}
              >
                <input
                  aria-describedby="agent-category-icon-ref-hint"
                  aria-invalid={errors.iconRef ? true : undefined}
                  className={inputClassName(Boolean(errors.iconRef), 'font-mono')}
                  id="agent-category-icon-ref"
                  maxLength={MAX_ICON_REF_LENGTH}
                  onChange={(event) => update('iconRef', event.target.value)}
                  placeholder={copy.drawer.placeholders.icon}
                  value={values.iconRef}
                />
              </Field>
            </FormSection>

            <FormSection
              description={copy.drawer.sections.lifecycleDescription}
              title={copy.drawer.sections.lifecycleTitle}
            >
              <div className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                  {copy.drawer.fields.status}
                </span>
                <div
                  aria-label={copy.drawer.fields.status}
                  className="grid gap-2 sm:grid-cols-2"
                  role="radiogroup"
                >
                  {EDITABLE_STATUS_VALUES.map((value) => {
                    const option = copy.drawer.statusOptions[value];
                    const selected = values.status === value;
                    return (
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                          selected
                            ? 'border-blue-500/60 bg-blue-50/70 dark:border-blue-400/40 dark:bg-blue-500/10'
                            : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20'
                        }`}
                        key={value}
                      >
                        <input
                          checked={selected}
                          className="mt-0.5 h-4 w-4 accent-blue-600"
                          name="agent-category-status"
                          onChange={() => update('status', value)}
                          type="radio"
                          value={value}
                        />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-zinc-200">
                            {option.label}
                            {selected ? (
                              <CheckIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-zinc-400">
                            {option.hint}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </FormSection>

            {editing ? (
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-white/[0.03] dark:text-zinc-400">
                <FolderIcon className="h-4 w-4 shrink-0" />
                <span>{copy.drawer.versionNote(editing.version)}</span>
              </div>
            ) : null}
          </div>

          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-5 py-3 dark:border-white/10">
            <button
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
              disabled={saving}
              onClick={onClose}
              type="button"
            >
              {copy.drawer.cancel}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-wait disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              disabled={saving}
              type="submit"
            >
              {saving ? (
                <span
                  aria-hidden="true"
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
              ) : null}
              {saving ? copy.drawer.saving : editing ? copy.drawer.save : copy.drawer.create}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{title}</h3>
        <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-zinc-400">{description}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  required = false,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium text-slate-700 dark:text-zinc-300" htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-red-500">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p className="text-xs leading-5 text-slate-500 dark:text-zinc-400" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function inputClassName(hasError: boolean, extra = ''): string {
  return [
    'w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors',
    'placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
    'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
    'dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:disabled:bg-zinc-800/60 dark:disabled:text-zinc-500',
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/60'
      : 'border-slate-300 dark:border-white/10',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}
