const runtime = require("../../../runtime/agents-app");

function formatTime(epochMs) {
  if (!Number.isFinite(epochMs) || epochMs <= 0) {
    return "";
  }
  const date = new Date(epochMs);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildCopy() {
  const translate = (key) => runtime.translateAgentsMpConversationText(key);
  return {
    title: translate("agents.conversation.sessions.title"),
    empty: translate("agents.conversation.sessions.empty"),
    untitled: translate("agents.conversation.sessions.untitled"),
    rename: translate("agents.conversation.sessions.rename"),
    delete: translate("agents.conversation.sessions.delete"),
    cancel: translate("agents.conversation.sessions.cancel"),
    confirm: translate("agents.conversation.sessions.confirm"),
    loading: translate("agents.conversation.status.loading"),
    loadFailed: translate("agents.conversation.error.loadSessions"),
  };
}

/**
 * Session history (`app.agents.conversation.list`), projected into the
 * `agents-sessions` subpackage.
 *
 * The page returns the chosen session to the conversation surface through the
 * navigation event channel so the two screens share one session store.
 */
Page({
  data: {
    t: {},
    sessions: [],
    loading: true,
    errorMessage: "",
  },

  onLoad() {
    this.setData({ t: buildCopy() });
    this.services = runtime.getAgentsMpRuntimeServices();
    this.loadSessions();
  },

  loadSessions() {
    this.setData({ loading: true, errorMessage: "" });
    this.services.conversation
      .listSessions()
      .then((sessions) => {
        this.setData({
          loading: false,
          sessions: sessions.map((session) => ({
            id: session.id,
            title: session.title || this.data.t.untitled,
            updatedAtText: formatTime(session.updatedAt),
          })),
        });
      })
      .catch(() => {
        this.setData({ loading: false, errorMessage: this.data.t.loadFailed });
      });
  },

  onSelect(event) {
    const { id, title } = event.currentTarget.dataset;
    const channel = this.getOpenerEventChannel && this.getOpenerEventChannel();
    if (channel && typeof channel.emit === "function") {
      channel.emit("selectSession", { sessionId: id, title });
    }
    wx.navigateBack({ delta: 1 });
  },

  onRename(event) {
    const { id, title } = event.currentTarget.dataset;
    wx.showModal({
      title: this.data.t.rename,
      editable: true,
      placeholderText: title || this.data.t.untitled,
      success: (result) => {
        const nextTitle = (result.content || "").trim();
        if (!result.confirm || nextTitle.length === 0) {
          return;
        }
        this.services.conversation
          .renameSession(id, nextTitle)
          .then(() => this.loadSessions())
          .catch(() => wx.showToast({ title: this.data.t.loadFailed, icon: "none" }));
      },
    });
  },

  onDelete(event) {
    const { id } = event.currentTarget.dataset;
    wx.showModal({
      title: this.data.t.delete,
      content: this.data.t.confirm,
      success: (result) => {
        if (!result.confirm) {
          return;
        }
        this.services.conversation
          .deleteSession(id)
          .then(() => this.loadSessions())
          .catch(() => wx.showToast({ title: this.data.t.loadFailed, icon: "none" }));
      },
    });
  },
});
