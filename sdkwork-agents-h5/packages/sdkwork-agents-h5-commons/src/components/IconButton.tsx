import type { ButtonHTMLAttributes } from "react";

import { cn } from "../utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/**
 * Square icon affordance on a flat light surface.
 *
 * Rest state is tertiary text on transparent; hover and active use tonal fills
 * (`surface-muted` / `primary-subtle`) so the state reads without a border or a
 * shadow, and the active state uses the blue primary.
 */
export function IconButton({ className, active, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "flex items-center justify-center w-[44px] h-[44px] rounded-lg text-[var(--color-text-tertiary,#8A97AD)] transition-colors duration-[var(--ag-motion-fast,120ms)] hover:bg-[var(--color-surface-muted,#EAF1FB)] hover:text-[var(--color-text-primary,#0A1B3D)] active:bg-[var(--color-surface-strong,#DCE8F9)]",
        active &&
          "bg-[var(--color-primary-subtle,#E8F0FF)] text-[var(--color-primary,#165DFF)] hover:bg-[var(--color-primary-subtle,#E8F0FF)] hover:text-[var(--color-primary,#165DFF)]",
        className,
      )}
      {...props}
    />
  );
}
