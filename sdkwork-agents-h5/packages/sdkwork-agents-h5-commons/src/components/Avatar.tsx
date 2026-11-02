import React from "react";

import { cn } from "../utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
  shape?: "circle" | "square";
}

/**
 * Flat avatar tile: the fallback sits on the tonal `surface-strong` fill, never
 * on a dark card and never with a decorative border line.
 */
export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = "md", shape = "square", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
    };

    const shapeClasses = {
      circle: "rounded-full",
      square: "rounded-[var(--radius-md,12px)]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden bg-[var(--color-surface-strong,#DCE8F9)] items-center justify-center text-[var(--color-text-secondary,#5B6B88)]",
          sizeClasses[size],
          shapeClasses[shape],
          className,
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="aspect-square h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span>{fallback || alt?.charAt(0) || "?"}</span>
        )}
      </div>
    );
  },
);
Avatar.displayName = "Avatar";
