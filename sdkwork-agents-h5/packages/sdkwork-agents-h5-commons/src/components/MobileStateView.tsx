import type { ReactNode } from "react";

import { cn } from "../utils";

export type MobileStateKind = "loading" | "empty" | "error" | "unavailable";

export interface MobileStateViewProps {
  kind: MobileStateKind;
  message: string;
  /** Retry label; omitted when the state is not recoverable. */
  retryLabel?: string;
  onRetry?: () => void;
  /** Optional extra action rendered under the retry button. */
  action?: ReactNode;
  className?: string;
}

/**
 * Domain-neutral full-surface state for mobile capability screens.
 *
 * Every screen needs the same four honest states: loading, empty, error, and
 * unavailable. Keeping them in `commons` means each capability renders the same
 * chrome and never invents placeholder content for a missing transport.
 *
 * Flat light surfaces: the spinner ring is a functional loading indicator (it
 * is not a decorative border) and the retry action is a filled blue button.
 */
export function MobileStateView({
  kind,
  message,
  retryLabel,
  onRetry,
  action,
  className,
}: MobileStateViewProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-8 py-10 text-center",
        className,
      )}
      role={kind === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {kind === "loading" ? <span aria-hidden="true" className="ag-spinner" /> : null}
      <p className="text-[13px] leading-5 text-[var(--color-text-sub,#5B6B88)]">{message}</p>
      {onRetry && retryLabel ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-[var(--color-primary,#165DFF)] px-4 py-1.5 text-[13px] font-medium text-[var(--color-primary-on,#FFFFFF)] transition-colors hover:bg-[var(--color-primary-hover,#4080FF)] active:bg-[var(--color-primary-pressed,#0E42D2)]"
        >
          {retryLabel}
        </button>
      ) : null}
      {action}
    </div>
  );
}
