/**
 * Typed adapters over the mini program platform runtime.
 *
 * Authority: `APP_MINI_PROGRAM_UI_SPEC.md` section 1 and
 * `MINI_PROGRAM_APP_ARCHITECTURE_SPEC.md` section 6 — platform APIs such as
 * `wx.*` must go through typed host adapters, and platform API implementations
 * live in `mp-host`, not in feature pages.
 *
 * Every adapter degrades to a documented default instead of throwing, because a
 * page that cannot read an inset should still render.
 */

/** Navigation bar content height used by the mini program when no value is read. */
const DEFAULT_NAVIGATION_BAR_HEIGHT = 44;

export interface AgentsMpWindowInsets {
  /** Status bar height in pixels (px, not rpx). */
  readonly statusBarHeight: number;
  /** Navigation bar content height in pixels, excluding the status bar. */
  readonly navigationBarHeight: number;
  /** Height of the header a custom navigation bar must reserve, in pixels. */
  readonly headerHeight: number;
  /** Bottom safe-area inset in pixels (home indicator on gesture devices). */
  readonly safeAreaBottom: number;
  /** Viewport width in pixels. */
  readonly windowWidth: number;
  /** Viewport height in pixels. */
  readonly windowHeight: number;
}

interface WxWindowInfo {
  statusBarHeight?: number;
  windowWidth?: number;
  windowHeight?: number;
  screenHeight?: number;
  language?: string;
  safeArea?: { bottom?: number; height?: number };
}

interface WxWindowHost {
  getWindowInfo?: () => WxWindowInfo;
  getSystemInfoSync?: () => WxWindowInfo;
  getAppBaseInfo?: () => { language?: string };
}

function readHost(): WxWindowHost | undefined {
  return (globalThis as { wx?: WxWindowHost }).wx;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** Reads the current window geometry. */
export function readAgentsMpWindowInsets(): AgentsMpWindowInsets {
  const host = readHost();
  let info: WxWindowInfo | undefined;
  try {
    info = host?.getWindowInfo?.() ?? host?.getSystemInfoSync?.();
  } catch {
    info = undefined;
  }

  const statusBarHeight = toFiniteNumber(info?.statusBarHeight, 0);
  const windowWidth = toFiniteNumber(info?.windowWidth, 375);
  const windowHeight = toFiniteNumber(info?.windowHeight, 667);

  let safeAreaBottom = 0;
  const screenHeight = toFiniteNumber(info?.screenHeight, 0);
  const safeAreaHeight = toFiniteNumber(info?.safeArea?.height, 0);
  if (screenHeight > 0 && safeAreaHeight > 0 && screenHeight > safeAreaHeight) {
    safeAreaBottom = screenHeight - safeAreaHeight;
  }

  return {
    statusBarHeight,
    navigationBarHeight: DEFAULT_NAVIGATION_BAR_HEIGHT,
    headerHeight: statusBarHeight + DEFAULT_NAVIGATION_BAR_HEIGHT,
    safeAreaBottom,
    windowWidth,
    windowHeight,
  };
}

/**
 * Reads the platform language tag (for example `zh_CN`, `en`).
 *
 * Locale resolution belongs to the host (`I18N_SPEC.md` section 7); capability
 * packages only receive the resolved locale.
 */
export function readAgentsMpLocaleTag(): string | undefined {
  const host = readHost();
  try {
    const base = host?.getAppBaseInfo?.();
    if (base?.language) {
      return base.language;
    }
    return host?.getSystemInfoSync?.().language;
  } catch {
    return undefined;
  }
}
