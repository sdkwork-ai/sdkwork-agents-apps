const runtime = require("../runtime/agents-app");

const DEFAULT_TAB = "chat";

/**
 * Outline / filled PNG pair for each shared tab glyph. The mini program cannot
 * inline the SVG components the H5 and Flutter roots use, so it ships the same
 * outline/filled pair as monochrome assets
 * (`ICON_SPEC.md` section 3.2).
 */
const TAB_ICONS = {
  "message-square": {
    icon: "/assets/tabbar/chat-outline.png",
    activeIcon: "/assets/tabbar/chat-filled.png",
  },
  sparkles: {
    icon: "/assets/tabbar/inspiration-outline.png",
    activeIcon: "/assets/tabbar/inspiration-filled.png",
  },
  palette: {
    icon: "/assets/tabbar/creative-outline.png",
    activeIcon: "/assets/tabbar/creative-filled.png",
  },
  image: {
    icon: "/assets/tabbar/assets-outline.png",
    activeIcon: "/assets/tabbar/assets-filled.png",
  },
  infinity: {
    icon: "/assets/tabbar/agents-outline.png",
    activeIcon: "/assets/tabbar/agents-filled.png",
  },
};

/**
 * Custom bottom tab bar.
 *
 * The five tabs come from the shell (`AGENTS_MP_TABS`): the PC workbench's
 * primary surfaces — chat, inspiration, creative, assets, agent catalog — so the
 * mini program, H5, and Flutter roots cannot drift apart; only the rendered glyph
 * differs per platform. Each tab page calls `setActive` from `onShow` so the bar
 * always reflects the page that is actually visible.
 */
Component({
  data: {
    items: [],
    active: DEFAULT_TAB,
    themeClass: "",
  },
  attached() {
    this.syncThemeClass();
  },
  methods: {
    /**
     * Mirrors the page theme preference so the bar's fill matches its host.
     *
     * The tab bar is a separate component tree and does not inherit the page's
     * `theme-dark` class, so it resolves the stored preference itself through the
     * shared runtime helper. The palette values live in this component's wxss.
     */
    syncThemeClass() {
      let themeClass = "";
      try {
        themeClass = runtime.resolveAgentsMpThemeClass();
      } catch {
        themeClass = "";
      }
      if (themeClass !== this.data.themeClass) {
        this.setData({ themeClass });
      }
    },

    /** Called by tab pages on `onShow`. */
    setActive(tab) {
      // Re-resolve the palette on every show: the preference can change on the
      // settings page while this tab page instance (and its bar) stays alive,
      // so `attached` alone would leave the bar on the previous theme.
      this.syncThemeClass();
      const next = typeof tab === "string" && tab.length > 0 ? tab : DEFAULT_TAB;
      if (this.data.active === next && this.data.items.length > 0) {
        return;
      }
      this.applyActive(next);
    },

    applyActive(tab) {
      const items = runtime
        .resolveAgentsMpTabBarItems(tab, (key) =>
          runtime.translateAgentsMpShellText(key),
        )
        .map((item) => ({
          ...item,
          ...(TAB_ICONS[item.glyph] ?? {}),
        }));
      this.setData({ active: tab, items });
    },

    onTap(event) {
      const { tab, url } = event.currentTarget.dataset;
      if (typeof url !== "string" || url.length === 0) {
        return;
      }
      if (tab !== this.data.active) {
        this.applyActive(tab);
      }
      wx.switchTab({
        url,
        fail: () => {
          // The bar is only mounted on tab pages; a failed switch leaves the
          // user where they are rather than showing a broken tab state.
          this.applyActive(this.data.active);
        },
      });
    },
  },
});
