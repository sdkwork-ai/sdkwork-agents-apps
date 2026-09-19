const runtime = require("../runtime/agents-app");

const DEFAULT_TAB = "tasks";

/**
 * Custom bottom tab bar.
 *
 * The five tabs come from the shell (`AGENTS_MP_TABS`), so the mini program,
 * H5, and Flutter roots cannot drift apart; only the rendered glyph differs per
 * platform. Each tab page calls `setActive` from `onShow` so the bar always
 * reflects the page that is actually visible.
 */
Component({
  data: {
    items: [],
    active: DEFAULT_TAB,
  },
  methods: {
    /** Called by tab pages on `onShow`. */
    setActive(tab) {
      const next = typeof tab === "string" && tab.length > 0 ? tab : DEFAULT_TAB;
      if (this.data.active === next && this.data.items.length > 0) {
        return;
      }
      this.applyActive(next);
    },

    applyActive(tab) {
      const items = runtime.resolveAgentsMpTabBarItems(tab, (key) =>
        runtime.translateAgentsMpShellText(key),
      );
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
