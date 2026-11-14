import React from 'react';

export interface AdaptiveDropdownPosition {
  /** Side the menu should open on after measuring the anchor. */
  placement: 'top' | 'bottom';
  /** Pixel cap for the menu height, or `null` before the first measurement. */
  maxHeight: number | null;
}

/**
 * Clamp an absolutely positioned composer dropdown to the space actually
 * available on screen.
 *
 * The composer's placement heuristic only knows a fixed estimated height, so a
 * tall menu opened near a viewport edge gets clipped and its bottom can never
 * be scrolled into view. This hook measures the anchor (the menu's positioned
 * parent) and the menu's full content height after mount, picks the side with
 * room, and caps the menu to the available space.
 *
 * @param dropdownRef - ref of the absolutely positioned menu.
 * @param initialPlacement - placement guessed by the composer before measuring.
 * @param preferredHeight - content height considered comfortable without scrolling.
 * @returns the resolved placement and max height.
 */
export function useAdaptiveDropdown(
  dropdownRef: React.RefObject<HTMLDivElement | null>,
  initialPlacement: 'top' | 'bottom',
  preferredHeight = 320,
): AdaptiveDropdownPosition {
  const [position, setPosition] = React.useState<AdaptiveDropdownPosition>({
    placement: initialPlacement,
    maxHeight: null,
  });

  React.useLayoutEffect(() => {
    const menu = dropdownRef.current;
    const anchor = menu?.parentElement;
    if (!menu || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    // The menu is clamped by its max height, but `scrollHeight` still reports
    // the full content height, so it can decide whether the menu fits.
    const contentHeight = menu.scrollHeight;
    const fitsBelow = spaceBelow >= Math.min(contentHeight, preferredHeight);
    const placement: 'top' | 'bottom' = fitsBelow || spaceBelow >= spaceAbove ? 'bottom' : 'top';
    const available = placement === 'bottom' ? spaceBelow : spaceAbove;
    setPosition({
      placement,
      maxHeight: Math.max(140, Math.min(available, 640)),
    });
  }, [dropdownRef, preferredHeight]);

  return position;
}
