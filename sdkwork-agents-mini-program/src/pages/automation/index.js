const runtime = require("../../runtime/agents-app");

function buildCopy() {
  const translate = (key) => runtime.translateAgentsMpAutomationText(key);
  return {
    title: translate("agents.automation.title"),
    searchPlaceholder: translate("agents.automation.search.placeholder"),
    empty: translate("agents.automation.empty"),
    loading: translate("agents.automation.loading"),
    loadFailed: translate("agents.automation.loadFailed"),
    truncated: translate("agents.automation.truncated"),
    statusActive: translate("agents.automation.status.active"),
    statusPaused: translate("agents.automation.status.paused"),
    statusCompleted: translate("agents.automation.status.completed"),
    statusCancelled: translate("agents.automation.status.cancelled"),
  };
}

function toStatusText(status, copy) {
  switch (status) {
    case "active":
      return copy.statusActive;
    case "paused":
      return copy.statusPaused;
    case "completed":
      return copy.statusCompleted;
    case "cancelled":
      return copy.statusCancelled;
    default:
      return status || "";
  }
}

/**
 * Automation tab (`app.agents.automation.index`).
 *
 * The Agents API scopes scheduled tasks to one managed agent, so the package
 * service aggregates the caller's own agents behind a memoized fan-out.
 */
Page({
  data: {
    t: {},
    statusBarHeight: 24,
    headerHeight: 68,
    bottomInset: 52,
    tasks: [],
    viewTasks: [],
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
    this.loadTasks();
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setActive("automation");
    }
  },

  onPullDownRefresh() {
    this.services.automation.resetCache();
    this.loadTasks(() => wx.stopPullDownRefresh());
  },

  loadTasks(done) {
    const finish = () => {
      if (typeof done === "function") done();
    };
    this.setData({ loading: true, errorMessage: "" });
    this.services.automation
      .loadTasks()
      .then((result) => {
        this.setData({
          loading: false,
          tasks: result.items,
          viewTasks: this.toViewTasks(result.items, this.data.query),
          truncatedText: result.truncated ? this.data.t.truncated : "",
        });
      })
      .catch(() => {
        this.setData({ loading: false, errorMessage: this.data.t.loadFailed });
      })
      .then(finish, finish);
  },

  toViewTasks(tasks, query) {
    const copy = this.data.t;
    return runtime.filterAgentsMpTasks(tasks, query).map((task) => ({
      id: task.id,
      name: task.name,
      schedule: task.schedule || "",
      statusText: toStatusText(task.status, copy),
    }));
  },

  onSearchInput(event) {
    const query = event.detail.value;
    this.setData({ query, viewTasks: this.toViewTasks(this.data.tasks, query) });
  },
});
