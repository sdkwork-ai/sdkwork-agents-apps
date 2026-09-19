const runtime = require("../../runtime/agents-app");

function buildCopy() {
  const translate = (key) => runtime.translateAgentsMpProjectsText(key);
  return {
    title: translate("agents.projects.title"),
    searchPlaceholder: translate("agents.projects.search.placeholder"),
    empty: translate("agents.projects.empty"),
    loading: translate("agents.projects.loading"),
    loadFailed: translate("agents.projects.loadFailed"),
    truncated: translate("agents.projects.truncated"),
  };
}

/**
 * Projects tab (`app.agents.projects.list`).
 *
 * A project is the Agents-owned container that groups sessions; the page is a
 * read-only listing until project detail surfaces land.
 */
Page({
  data: {
    t: {},
    statusBarHeight: 24,
    headerHeight: 68,
    bottomInset: 52,
    projects: [],
    viewProjects: [],
    query: "",
    loading: true,
    errorMessage: "",
    truncatedText: "",
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
    this.loadProjects();
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setActive("projects");
    }
  },

  onPullDownRefresh() {
    this.loadProjects(() => wx.stopPullDownRefresh());
  },

  loadProjects(done) {
    const finish = () => {
      if (typeof done === "function") done();
    };
    this.setData({ loading: true, errorMessage: "" });
    this.services.projects
      .loadProjects()
      .then((result) => {
        this.setData({
          loading: false,
          projects: result.items,
          viewProjects: this.toViewProjects(result.items, this.data.query),
          truncatedText: result.truncated ? this.data.t.truncated : "",
        });
      })
      .catch(() => {
        this.setData({ loading: false, errorMessage: this.data.t.loadFailed });
      })
      .then(finish, finish);
  },

  toViewProjects(projects, query) {
    return runtime.filterAgentsMpProjects(projects, query).map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description || "",
      status: project.status || "",
    }));
  },

  onSearchInput(event) {
    const query = event.detail.value;
    this.setData({ query, viewProjects: this.toViewProjects(this.data.projects, query) });
  },
});
