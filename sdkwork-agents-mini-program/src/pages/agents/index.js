const DEFAULT_APP_API_BASE_URL = "http://127.0.0.1:8095/app/v3/api";

function resolveAppApiBaseUrl() {
  const app = getApp();
  const configured =
    typeof app?.globalData?.agentsAppApiBaseUrl === "string" &&
    app.globalData.agentsAppApiBaseUrl.trim();
  return configured || DEFAULT_APP_API_BASE_URL;
}

/**
 * Resolves the catalog service from the mini program runtime bundle.
 *
 * The SDK client is created by the runtime and injected into the capability
 * package service; this page never constructs transport or maps records.
 */
function resolveAgentCatalogService() {
  const runtime = require("../../runtime/agents-app");
  runtime.bootstrapAgentsMiniProgram({ appApiBaseUrl: resolveAppApiBaseUrl() });
  const client = runtime.getAgentsMpSdkClient();
  return runtime.createAgentCatalogService(client);
}

Page({
  data: {
    agents: [],
    loading: true,
    error: "",
    loadingMore: false,
    page: 1,
    hasMore: false,
  },
  onLoad() {
    this.loadAgents();
  },
  onPullDownRefresh() {
    this.loadAgents(() => wx.stopPullDownRefresh());
  },
  loadAgents(done) {
    this.setData({ loading: true, error: "", page: 1, hasMore: false });
    this.fetchAgentPage(1, false, done);
  },
  loadMoreAgents() {
    if (this.data.loadingMore || !this.data.hasMore) {
      return;
    }
    this.fetchAgentPage(this.data.page + 1, true);
  },
  fetchAgentPage(page, append, done) {
    if (append) {
      this.setData({ loadingMore: true, error: "" });
    } else {
      this.setData({ loading: true, error: "" });
    }
    const finish = (patch) => {
      this.setData(patch);
      if (typeof done === "function") {
        done();
      }
    };
    try {
      const catalog = resolveAgentCatalogService();
      catalog
        .loadPage(page, 20)
        .then((result) => {
          const agents = append ? this.data.agents.concat(result.items) : result.items;
          finish({
            agents,
            loading: false,
            loadingMore: false,
            error: "",
            page: result.page,
            hasMore: result.hasMore,
          });
        })
        .catch((error) => {
          const message = error?.message ? String(error.message) : String(error);
          finish({ loading: false, loadingMore: false, error: message });
        });
    } catch (error) {
      const message = error?.message ? String(error.message) : String(error);
      finish({ loading: false, loadingMore: false, error: message });
    }
  },
});
