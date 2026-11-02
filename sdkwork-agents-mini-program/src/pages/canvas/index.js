const runtime = require("../../runtime/agents-app");

/**
 * The PC canvas persists its browser-local workflow under this key
 * (`sdkwork-agents-pc-canvas`). The mini program storage namespace is separate,
 * so this page renders the workflow only when a mini program surface has written
 * it; otherwise it shows the empty state instead of inventing nodes.
 */
const CANVAS_STORAGE_KEY = "sdkwork_agents_canvas_workflow_v1";

const NODE_LABEL_KEYS = {
  text: "agents.canvas.node.text",
  "image-gen": "agents.canvas.node.imageGen",
  "video-gen": "agents.canvas.node.videoGen",
  "flow-step": "agents.canvas.node.flowStep",
  sticky: "agents.canvas.node.sticky",
};

function buildCopy() {
  const translate = runtime.translateAgentsMpShellText;
  return {
    title: translate("agents.canvas.title"),
    loading: translate("agents.canvas.loading"),
    empty: translate("agents.canvas.empty"),
    unavailable: translate("agents.canvas.unavailable"),
    loadFailed: translate("agents.canvas.retry"),
    retry: translate("agents.canvas.retry"),
    readOnly: translate("agents.canvas.readOnly"),
    back: translate("agents.mobile.nav.back"),
    connections: translate("agents.canvas.connections"),
    statusIdle: translate("agents.canvas.status.idle"),
    statusGenerating: translate("agents.canvas.status.generating"),
    statusCompleted: translate("agents.canvas.status.completed"),
    statusFailed: translate("agents.canvas.status.failed"),
  };
}

function nodeLabel(copy, type) {
  const key = NODE_LABEL_KEYS[type] || NODE_LABEL_KEYS.text;
  return runtime.translateAgentsMpShellText(key);
}

function normalizeNode(node, copy) {
  if (!node || typeof node !== "object") {
    return null;
  }
  const id = typeof node.id === "string" ? node.id : "";
  const type = typeof node.type === "string" ? node.type : "text";
  if (!id) {
    return null;
  }
  const status =
    node.status === "generating"
      ? copy.statusGenerating
      : node.status === "completed"
        ? copy.statusCompleted
        : node.status === "failed"
          ? copy.statusFailed
          : copy.statusIdle;
  return {
    id,
    type,
    typeLabel: nodeLabel(copy, type),
    title: typeof node.title === "string" && node.title ? node.title : nodeLabel(copy, type),
    body:
      (typeof node.content === "string" && node.content) ||
      (typeof node.prompt === "string" && node.prompt) ||
      "",
    status,
    mediaUrl: typeof node.mediaUrl === "string" ? node.mediaUrl : "",
  };
}

Page({
  data: {
    t: {},
    statusBarHeight: 24,
    headerHeight: 68,
    bottomInset: 0,
    status: "loading",
    nodes: [],
    connectionsText: "",
    themeClass: "",
  },

  onLoad() {
    const insets = runtime.getAgentsMpWindowInsets();
    this.setData({
      t: buildCopy(),
      statusBarHeight: insets.statusBarHeight,
      headerHeight: insets.headerHeight,
      bottomInset: insets.safeAreaBottom,
    });
    this.load();
  },

  onShow() {
    this.setData({
      t: buildCopy(),
      // Re-apply the stored theme so returning from Settings repaints this page.
      themeClass: runtime.resolveAgentsMpThemeClass(),
    });
  },

  load() {
    const copy = this.data.t;
    this.setData({ status: "loading" });
    try {
      const workflow = wx.getStorageSync(CANVAS_STORAGE_KEY);
      if (!workflow || !Array.isArray(workflow.nodes)) {
        this.setData({ status: "empty", nodes: [], connectionsText: "" });
        return;
      }
      const nodes = workflow.nodes
        .slice()
        .sort((left, right) => (left.y || 0) - (right.y || 0) || (left.x || 0) - (right.x || 0))
        .map((node) => normalizeNode(node, copy))
        .filter(Boolean);
      if (nodes.length === 0) {
        this.setData({ status: "empty", nodes: [], connectionsText: "" });
        return;
      }
      const connectionCount = Array.isArray(workflow.connections) ? workflow.connections.length : 0;
      this.setData({
        status: "ready",
        nodes,
        connectionsText:
          connectionCount > 0
            ? copy.connections.replace("{{count}}", String(connectionCount))
            : "",
      });
    } catch {
      this.setData({ status: "error" });
    }
  },

  onRetry() {
    this.load();
  },

  onPreviewImage(event) {
    const url = event.currentTarget.dataset.url;
    if (url) {
      wx.previewImage({ current: url, urls: [url] });
    }
  },

  onBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: "/pages/creative/index" });
  },
});
