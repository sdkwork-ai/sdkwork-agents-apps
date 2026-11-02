import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

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
  /** Renders a back affordance in the title row for stack-pushed surfaces. */
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

/**
 * Domain-neutral mobile resource list: title bar, search field, and the
 * loading / error / empty / list state machine every list surface needs.
 *
 * Keeping it here means the conversation, library, projects, and automation
 * surfaces render identical chrome without copying it per capability package.
 * The chrome is flat: page background, tonal filled search field, no border or
 * shadow anywhere.
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
  onBack,
  backLabel,
  className,
}: MobileResourceListProps<T>) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden",
        "bg-[var(--color-bg-color,#F4F7FC)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel ?? title}
            className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-main,#0A1B3D)] transition-colors hover:bg-[var(--color-surface-muted,#EAF1FB)] active:bg-[var(--color-surface-strong,#DCE8F9)]"
          >
            <ChevronLeft size={22} aria-hidden />
          </button>
        ) : null}
        <h1 className="min-w-0 flex-1 truncate text-[20px] font-semibold text-[var(--color-text-main,#0A1B3D)]">
          {title}
        </h1>
      </div>

      <div className="px-4 pb-2">
        <div
          className={cn(
            "flex items-center gap-2 rounded-[var(--radius-md,12px)] px-3 py-2",
            "bg-[var(--color-search-bg,#EAF1FB)]",
          )}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-4 w-4 shrink-0 text-[var(--color-text-sub,#5B6B88)]"
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
              "text-[var(--color-text-main,#0A1B3D)]",
              "placeholder:text-[var(--color-text-tertiary,#8A97AD)]",
            )}
          />
        </div>
      </div>

      {notice ? (
        <p className="px-4 pb-2 text-[11px] text-[var(--color-text-sub,#5B6B88)]">{notice}</p>
      ) : null}

      {errorText ? (
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={onRetry}
            className="w-full rounded-[var(--radius-md,12px)] bg-[var(--color-danger-bg,#FFF1F0)] px-3 py-2 text-left text-[12px] text-[var(--color-danger,#F53F3F)] transition-colors hover:bg-[var(--color-danger-bg,#FFF1F0)]"
          >
            {errorText}
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {loading ? (
          <p className="px-4 py-8 text-center text-[13px] text-[var(--color-text-sub,#5B6B88)]">
            {loadingText}
          </p>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[var(--color-text-sub,#5B6B88)]">
            {emptyText}
          </p>
        ) : (
          <ul className="space-y-2 px-4">
            {items.map((item) => (
              <li key={keyOf(item)}>{renderRow(item)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
