import { useEffect, useState } from "react";

/**
 * Tracks the visual viewport height so mobile keyboards resize the transcript
 * instead of overlaying the composer. Falls back to the layout viewport on
 * platforms without `window.visualViewport` (mini program web-view, desktop).
 */
export function useVisualViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }
    const update = () => setHeight(viewport.height);
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return height;
}
