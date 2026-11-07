import type { ReactNode, SVGProps } from 'react';
import { useEffect, useState } from 'react';

import type { AgentCategoryRecord } from '@sdkwork/agents-pc-core/sdk/agentsBackendSdkClient';

import { useAgentCategoryCopy } from './agentCategoryCopy.ts';

export type AgentCategoryLifecycleStatus = AgentCategoryRecord['lifecycleStatus'];
export type AgentCategoryEditableStatus = Exclude<AgentCategoryLifecycleStatus, 'deleted'>;

export const EDITABLE_STATUS_VALUES: readonly AgentCategoryEditableStatus[] = [
  'active',
  'draft',
  'disabled',
  'archived',
];

const STATUS_TONES: Record<AgentCategoryLifecycleStatus, string> = {
  active:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30',
  draft:
    'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30',
  disabled:
    'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30',
  archived:
    'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-white/5 dark:text-zinc-400 dark:ring-white/10',
  deleted:
    'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30',
};

export function AgentCategoryStatusBadge({ status }: { status: AgentCategoryLifecycleStatus }) {
  const copy = useAgentCategoryCopy();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_TONES[status]}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {copy.status[status]}
    </span>
  );
}

const AVATAR_PALETTE = [
  'bg-rose-500/10 text-rose-600 dark:text-rose-300',
  'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  'bg-sky-500/10 text-sky-600 dark:text-sky-300',
  'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
  'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300',
  'bg-teal-500/10 text-teal-600 dark:text-teal-300',
  'bg-orange-500/10 text-orange-600 dark:text-orange-300',
];

function avatarTone(code: string): string {
  let hash = 0;
  for (const character of code) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]!;
}

function isInlineImageReference(iconRef: string): boolean {
  if (iconRef.startsWith('//')) {
    return false;
  }
  return iconRef.startsWith('http://') || iconRef.startsWith('https://') || iconRef.startsWith('/');
}

/**
 * Visual identity tile for a category.
 *
 * An inline image reference (http/https/root-relative) renders as an image; a
 * drive URI or any other opaque reference falls back to the category initial so
 * the table never shows a broken-image frame.
 */
export function AgentCategoryAvatar({
  record,
  depth = 0,
}: {
  record: Pick<AgentCategoryRecord, 'categoryCode' | 'name' | 'iconRef'>;
  depth?: number;
}) {
  const initial = record.name.trim().charAt(0).toUpperCase() || '?';
  const showImage = Boolean(record.iconRef && isInlineImageReference(record.iconRef));
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [record.iconRef]);

  return (
    <span
      className={`relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-semibold ${avatarTone(record.categoryCode)}`}
      data-avatar-depth={depth}
    >
      {showImage && record.iconRef && !imageFailed ? (
        <img
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
          referrerPolicy="no-referrer"
          src={record.iconRef}
        />
      ) : (
        initial
      )}
    </span>
  );
}

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      {...props}
    >
      {children}
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </IconBase>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </IconBase>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </IconBase>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 13 11 4H4v7l9 9a2 2 0 0 0 2.8 0l4.2-4.2a2 2 0 0 0 0-2.8Z" />
      <circle cx="7.5" cy="7.5" r="1" />
    </IconBase>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </IconBase>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </IconBase>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 17h.01" />
    </IconBase>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m5 12 4.5 4.5L19 7" />
    </IconBase>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </IconBase>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 20h16" />
    </IconBase>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect height="13" rx="2" width="13" x="8" y="8" />
      <path d="M5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1" />
    </IconBase>
  );
}
