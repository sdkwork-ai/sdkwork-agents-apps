const runtime = require("../../runtime/agents-app");

/** Page path of the H5 full-version bridge (`app.agents.catalog.editor`). */
const AGENTS_H5_PAGE_URL = "/pages/agents-h5/index";
const PAGE_SIZE = 20;

function resolveCatalogCopy() {
  const fragments = runtime.agentsMpCatalogFragments;
  const active = fragments[runtime.getAgentsMpShellLocale()];
  const fallback = fragments["zh-CN"] || {};
  const translate = (key) => active?.[key] ?? fallback[key] ?? key;
  return {
    title: translate("agents.catalog.title"),
    loading: translate("agents.catalog.loading"),
    empty: translate("agents.catalog.empty"),
    loadFailed: translate("agents.catalog.loadFailed"),
    loadMore: translate("agents.catalog.loadMore"),
    myAgents: runtime.translateAgentsMpShellText("agents.mobile.tab.myAgents"),
    market: runtime.translateAgentsMpShellText("agents.mobile.tab.market"),
  };
}

/**
 * Experts tab (`app.agents.catalog.list`).
 *
 * The listing is the Agents catalog in either `mine` or `market` scope; the
 * page renders view rows only and maps records through the capability service.
 */
Page({
  data: {
    t: {},
    statusBarHeight: 24,
    headerHeight: 68,
    bottomInset: 52,
    scope: "mine",
    agents: [],
    loading: true,
    loadingMore: false,
    errorMessage: "",
    page: 1,
    hasMore: false,
  },

  onLoad() {
    const insets = runtime.getAgentsMpWindowInsets();
    this.setData({
      t: resolveCatalogCopy(),
      statusBarHeight: insets.statusBarHeight,
      headerHeight: insets.headerHeight,
      bottomInset: 52 + insets.safeAreaBottom,
    });
    this.services = runtime.getAgentsMpRuntimeServices();
    this.loadAgents();
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setActive("experts");
    }
  },

  onPullDownRefresh() {
    this.loadAgents(() => wx.stopPullDownRefresh());
  },

  onScopeChange(event) {
    const { scope } = event.currentTarget.dataset;
    if (scope === this.data.scope) {
      return;
    }
    this.setData({ scope, agents: [], page: 1, hasMore: false });
    this.loadAgents();
  },

  loadAgents(done) {
    this.setData({ loading: true, errorMessage: "", page: 1, hasMore: false });
    this.fetchPage(1, false, done);
  },

  loadMoreAgents() {
    if (this.data.loadingMore || !this.data.hasMore) {
      return;
    }
    this.fetchPage(this.data.page + 1, true);
  },

  fetchPage(page, append, done) {
    const finish = (patch) => {
      this.setData(patch);
      if (typeof done === "function") done();
    };
    this.setData(append ? { loadingMore: true } : { loading: true });

    this.services.catalog
      .loadPage(page, PAGE_SIZE, this.data.scope)
      .then((result) => {
        const items = result.items.map((agent) => ({
          id: agent.id,
          name: agent.name,
          description: agent.description,
        }));
        finish({
          agents: append ? this.data.agents.concat(items) : items,
          loading: false,
          loadingMore: false,
          errorMessage: "",
          page: result.page,
          hasMore: result.hasMore,
        });
      })
      .catch(() => {
        finish({
          loading: false,
          loadingMore: false,
          errorMessage: this.data.t.loadFailed,
        });
      });
  },

  onOpenFullVersion() {
    wx.navigateTo({ url: AGENTS_H5_PAGE_URL });
  },
});
