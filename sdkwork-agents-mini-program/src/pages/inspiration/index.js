const runtime = require("../../runtime/agents-app");

/** Tab id of this page in the shared shell tab set. */
const TAB_ID = "inspiration";

function buildCopy() {
  const translate = runtime.translateAgentsMpShellText;
  return {
    title: translate("agents.inspiration.title"),
    discover: translate("agents.inspiration.segment.discover"),
    featured: translate("agents.inspiration.segment.featured"),
    loading: translate("agents.inspiration.loading"),
    empty: translate("agents.inspiration.empty"),
    loadFailed: translate("agents.inspiration.loadFailed"),
    unavailable: translate("agents.inspiration.unavailable"),
    retry: translate("agents.mobile.nav.retry"),
    profileEntry: translate("agents.mobile.nav.profileEntry"),
    promptLabel: translate("agents.inspiration.promptLabel"),
    pullHint: translate("agents.inspiration.pullHint"),
    likes: translate("agents.inspiration.likes"),
    count: translate("agents.inspiration.count"),
  };
}

/**
 * Inspiration surface (`app.agents.inspiration.discover`).
 *
 * The feed is read through the inspiration capability service; this page never
 * invents entries. When the runtime has no feed transport the service reports it
 * and the page renders the localized unavailable state with retry — never a
 * placeholder feed.
 */
Page({
  data: {
    t: {},
    statusBarHeight: 24,
    headerHeight: 68,
    bottomInset: 52,
    segment: "discover",
    status: "loading",
    items: [],
    countText: "",
    themeClass: "",
  },

  onLoad() {
    const insets = runtime.getAgentsMpWindowInsets();
    this.setData({
      t: buildCopy(),
      statusBarHeight: insets.statusBarHeight,
      headerHeight: insets.headerHeight,
      bottomInset: 52 + insets.safeAreaBottom,
    });
    this.services = runtime.getAgentsMpRuntimeServices();
    this.loadFeed();
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setActive(TAB_ID);
    }
    this.setData({
      t: buildCopy(),
      // Re-apply the stored theme so returning from Settings repaints this page.
      themeClass: runtime.resolveAgentsMpThemeClass(),
    });
  },

  onPullDownRefresh() {
    this.loadFeed(() => wx.stopPullDownRefresh());
  },

  onSegmentTap(event) {
    const segment = event.currentTarget.dataset.segment;
    if (segment === this.data.segment) {
      return;
    }
    this.setData({ segment, items: [], countText: "" });
    this.loadFeed();
  },

  loadFeed(done) {
    const finish = () => {
      if (typeof done === "function") done();
    };
    const copy = this.data.t;
    if (this.services.inspiration.availability === "unavailable") {
      this.setData({ status: "unavailable" });
      finish();
      return;
    }
    this.setData({ status: "loading" });
    this.services.inspiration
      .loadFeed(this.data.segment)
      .then((feed) => {
        if (feed.availability === "unavailable") {
          this.setData({ status: "unavailable" });
          return;
        }
        const items = feed.items.map((item) => ({
          id: item.id,
          title: item.title,
          prompt: item.prompt || "",
          coverUrl: item.coverUrl || "",
          author: item.author || "",
          likesText:
            typeof item.likes === "number" ? this.formatLikes(copy.likes, item.likes) : "",
          mediaKind: item.mediaKind,
        }));
        this.setData({
          status: items.length === 0 ? "empty" : "ready",
          items,
          countText: this.formatCount(copy.count, items.length),
        });
      })
      .catch(() => {
        this.setData({ status: "error" });
      })
      .then(finish, finish);
  },

  formatLikes(template, likes) {
    return template.replace("{{count}}", String(likes));
  },

  formatCount(template, count) {
    return template.replace("{{count}}", String(count));
  },

  onRetry() {
    this.loadFeed();
  },

  onOpenProfile() {
    wx.navigateTo({ url: runtime.AGENTS_MP_PROFILE_PAGE_URL });
  },
});
