import type { ReactNode } from "react";

import { cn } from "../utils";

export interface MobileResourceListProps<T> {
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  items: readonly T[];
  keyOf: (item: T) => string;
  renderRow: (item: T) => ReactNode;
  loading?: boolean;
  loadingText: string;
  errorText?: string | null;
  onRetry?: () => void;
  emptyText: string;
  /** Optional notice rendered under the search field (e.g. truncation). */
  notice?: string | null;
  className?: string;
}

/**
 * Domain-neutral mobile resource list: title bar, search field, and the
 * loading / error / empty / list state machine every list surface needs.
 *
 * Keeping it here means the conversation, library, projects, and automation
 * surfaces render identical chrome without copying it per capability package.
 */
export function MobileResourceList<T>({
  title,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  items,
  keyOf,
  renderRow,
  loading = false,
  loadingText,
  errorText = null,
  onRetry,
  emptyText,
  notice = null,
  className,
}: MobileResourceListProps<T>) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden",
        "bg-[var(--color-bg-color,#f5f5f7)]",
        className,
      )}
    >
      <div className="px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <h1 className="text-[20px] font-semibold text-[var(--color-text-main,#1f1f1f)]">{title}</h1>
      </div>

      <div className="px-4 pb-2">
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2",
            "bg-[var(--color-search-bg,rgba(0,0,0,0.05))]",
          )}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-4 w-4 shrink-0 text-[var(--color-text-sub,#8c8c8c)]"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              "min-w-0 flex-1 bg-transparent text-[14px] outline-none",
              "text-[var(--color-text-main,#1f1f1f)]",
              "placeholder:text-[var(--color-text-sub,#9ca3af)]",
            )}
          />
        </div>
      </div>

      {notice ? (
        <p className="px-4 pb-2 text-[11px] text-[var(--color-text-sub,#8c8c8c)]">{notice}</p>
      ) : null}

      {errorText ? (
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={onRetry}
            className="w-full rounded-xl bg-[var(--color-danger-bg,rgba(220,38,38,0.08))] px-3 py-2 text-left text-[12px] text-[var(--color-danger,#dc2626)]"
          >
            {errorText}
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {loading ? (
          <p className="px-4 py-8 text-center text-[13px] text-[var(--color-text-sub,#8c8c8c)]">
            {loadingText}
          </p>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[var(--color-text-sub,#8c8c8c)]">
            {emptyText}
          </p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={keyOf(item)}>{renderRow(item)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
