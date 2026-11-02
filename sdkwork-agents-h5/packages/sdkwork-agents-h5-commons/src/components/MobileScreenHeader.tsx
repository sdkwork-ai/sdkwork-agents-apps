import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

import { cn } from "../utils";

export interface MobileScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Renders a back affordance when provided. */
  onBack?: () => void;
  backLabel?: string;
  /** Trailing action (for example a profile avatar). */
  action?: ReactNode;
  className?: string;
}

/**
 * Shared mobile title bar with an optional back button and trailing action.
 *
 * The surface screens own their content, not their chrome; keeping the title
 * bar here gives every tab and stack page the same safe-area behaviour. The bar
 * is a flat white surface: no border line, no shadow, blue primary affordances.
 */
export function MobileScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel,
  action,
  className,
}: MobileScreenHeaderProps) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-2 bg-[var(--color-surface-color,#FFFFFF)] px-4 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))]",
        className,
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel ?? title}
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-main,#0A1B3D)] transition-colors hover:bg-[var(--color-surface-muted,#EAF1FB)] active:bg-[var(--color-surface-strong,#DCE8F9)]"
        >
          <ChevronLeft size={22} aria-hidden />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[20px] font-semibold text-[var(--color-text-main,#0A1B3D)]">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate text-[12px] text-[var(--color-text-sub,#5B6B88)]">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
