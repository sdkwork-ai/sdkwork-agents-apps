const runtime = require("../../runtime/agents-app");

/** Subpackage route id `app.agents.conversation.list`. */
const CONVERSATION_HISTORY_URL = "/agents-sessions/pages/conversation/history";

/** Bottom tab bar height in px, matching `custom-tab-bar/index.wxss` (104rpx). */
const TAB_BAR_HEIGHT = 52;
/** Composer height in px (input row plus its vertical padding). */
const COMPOSER_HEIGHT = 72;

function toAnchor(messageId) {
  return `msg-${String(messageId).replace(/[^a-zA-Z0-9]/gu, "")}`;
}

function toSessionTitle(content) {
  const normalized = content.trim().replace(/\s+/gu, " ");
  return normalized.length > 20 ? `${normalized.slice(0, 20)}…` : normalized;
}

function buildCopy() {
  const translate = (key) => runtime.translateAgentsMpConversationText(key);
  return {
    title: translate("agents.conversation.title"),
    greeting: translate("agents.conversation.empty.greeting"),
    hint: translate("agents.conversation.empty.hint"),
    placeholder: translate("agents.conversation.composer.placeholder"),
    send: translate("agents.conversation.composer.send"),
    voiceUnavailable: translate("agents.conversation.composer.voiceUnavailable"),
    newSession: translate("agents.conversation.actions.newSession"),
    historyTitle: translate("agents.conversation.actions.history"),
    untitled: translate("agents.conversation.sessions.untitled"),
    reasoningTitle: translate("agents.conversation.reasoning.title"),
    toolRunning: translate("agents.conversation.tool.running"),
    toolCompleted: translate("agents.conversation.tool.completed"),
    toolFailed: translate("agents.conversation.tool.failed"),
    loading: translate("agents.conversation.status.loading"),
    sendFailed: translate("agents.conversation.error.send"),
    loadSessionsFailed: translate("agents.conversation.error.loadSessions"),
    loadMessagesFailed: translate("agents.conversation.error.loadMessages"),
  };
}

function toToolStatusText(status, copy) {
  if (status === "running") return copy.toolRunning;
  if (status === "completed") return copy.toolCompleted;
  return copy.toolFailed;
}

/**
 * Conversation surface (`app.agents.conversation.chat`).
 *
 * The page owns `this.data`, renders transcript rows, and forwards stream events
 * to the conversation package reducers. `this.rawMessages` keeps the
 * `AgentsMpConversationMessage[]` the reducers operate on, while
 * `data.messages` carries the view rows WXML renders.
 */
Page({
  data: {
    t: {},
    statusBarHeight: 24,
    headerHeight: 68,
    listHeight: 480,
    composerBottom: 52,
    sessionId: "",
    sessionTitle: "",
    messages: [],
    input: "",
    sending: false,
    loadingMessages: false,
    errorMessage: "",
    scrollTop: 0,
    hasMessages: false,
  },

  onLoad() {
    const copy = buildCopy();
    const insets = runtime.getAgentsMpWindowInsets();
    const composerBottom = TAB_BAR_HEIGHT + insets.safeAreaBottom;
    this.scrollTick = 0;
    this.rawMessages = [];
    this.setData({
      t: copy,
      statusBarHeight: insets.statusBarHeight,
      headerHeight: insets.headerHeight,
      composerBottom,
      listHeight: Math.max(
        240,
        insets.windowHeight - insets.headerHeight - COMPOSER_HEIGHT - composerBottom,
      ),
    });
    this.services = runtime.getAgentsMpRuntimeServices();
    this.loadSessions();
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setActive("tasks");
    }
  },

  onPullDownRefresh() {
    const done = () => wx.stopPullDownRefresh();
    if (this.data.sessionId) {
      this.loadMessages(this.data.sessionId, done);
      return;
    }
    this.loadSessions(done);
  },

  scrollToBottom() {
    this.scrollTick += 1;
    this.setData({ scrollTop: 1_000_000 + this.scrollTick });
  },

  /** Replaces the transcript and re-renders its view rows. */
  applyMessages(messages) {
    this.rawMessages = messages;
    const copy = this.data.t;
    this.setData({
      messages: messages.map((message) => {
        const toolCalls = (message.toolCalls || []).map((call) => ({
          id: call.id,
          name: call.name || "",
          status: call.status,
          statusText: toToolStatusText(call.status, copy),
        }));
        return {
          id: message.id,
          anchor: toAnchor(message.id),
          isUser: message.role === "user",
          isAssistant: message.role === "assistant",
          text: message.text,
          reasoning: message.reasoning || "",
          hasReasoning: Boolean(message.reasoning),
          toolCalls,
          hasTools: toolCalls.length > 0,
          streaming: Boolean(message.streaming),
          error: message.error || "",
        };
      }),
      hasMessages: messages.length > 0,
    });
    this.scrollToBottom();
  },

  loadSessions(done) {
    const finish = () => {
      if (typeof done === "function") done();
    };
    this.services.conversation
      .listSessions()
      .then((sessions) => {
        if (!this.data.sessionId && sessions.length > 0) {
          const latest = sessions[0];
          this.setData({
            sessionId: latest.id,
            sessionTitle: latest.title,
            errorMessage: "",
          });
          this.loadMessages(latest.id);
          return;
        }
        this.setData({ errorMessage: "" });
        if (this.data.sessionId) {
          this.loadMessages(this.data.sessionId);
        }
      })
      .catch(() => {
        this.setData({ errorMessage: this.data.t.loadSessionsFailed });
      })
      .then(finish, finish);
  },

  loadMessages(sessionId, done) {
    const finish = () => {
      if (typeof done === "function") done();
    };
    if (!sessionId) {
      this.applyMessages([]);
      finish();
      return;
    }
    this.setData({ loadingMessages: true });
    this.services.conversation
      .listMessages(sessionId)
      .then((page) => {
        this.applyMessages(page.items);
        this.setData({ loadingMessages: false, errorMessage: "" });
      })
      .catch(() => {
        this.setData({
          loadingMessages: false,
          errorMessage: this.data.t.loadMessagesFailed,
        });
      })
      .then(finish, finish);
  },

  onInput(event) {
    this.setData({ input: event.detail.value });
  },

  onMicTap() {
    wx.showToast({ title: this.data.t.voiceUnavailable, icon: "none" });
  },

  onNewSession() {
    if (this.data.sending) {
      return;
    }
    this.setData({ sessionId: "", sessionTitle: "", input: "", errorMessage: "" });
    this.applyMessages([]);
  },

  onOpenHistory() {
    wx.navigateTo({
      url: CONVERSATION_HISTORY_URL,
      events: {
        selectSession: (payload) => {
          if (!payload || typeof payload.sessionId !== "string") {
            return;
          }
          this.openSession(payload.sessionId, payload.title);
        },
      },
    });
  },

  openSession(sessionId, title) {
    this.setData({
      sessionId,
      sessionTitle: title || this.data.t.untitled,
      errorMessage: "",
    });
    this.applyMessages([]);
    this.loadMessages(sessionId);
  },

  onSend() {
    const content = this.data.input.trim();
    if (content.length === 0 || this.data.sending) {
      return;
    }
    this.setData({ input: "" });
    this.sendTurn(content);
  },

  sendTurn(content) {
    const services = this.services;
    const copy = this.data.t;
    const assistantId = runtime.nextAgentsMpLocalMessageId("assistant");
    const userMessage = {
      id: runtime.nextAgentsMpLocalMessageId("user"),
      role: "user",
      text: content,
    };
    const assistantMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      streaming: true,
    };

    const ensureSession = this.data.sessionId
      ? Promise.resolve({ id: this.data.sessionId, title: this.data.sessionTitle })
      : services.conversation.createSession(toSessionTitle(content));

    this.setData({ sending: true, errorMessage: "" });
    this.applyMessages([...this.rawMessages, userMessage, assistantMessage]);

    ensureSession
      .then((session) => {
        if (session.id !== this.data.sessionId) {
          this.setData({ sessionId: session.id, sessionTitle: session.title });
        }
        return services.conversation.streamTurn(
          { sessionId: session.id, content },
          {
            onDelta: (delta) =>
              this.applyMessages(
                runtime.appendAgentsMpMessageText(this.rawMessages, assistantId, delta),
              ),
            onReasoning: (delta) =>
              this.applyMessages(
                runtime.appendAgentsMpMessageReasoning(this.rawMessages, assistantId, delta),
              ),
            onToolEvent: (event) =>
              this.applyMessages(
                runtime.applyAgentsMpToolEventToMessage(this.rawMessages, assistantId, event),
              ),
          },
        );
      })
      .then(() => {
        this.applyMessages(runtime.finishAgentsMpMessage(this.rawMessages, assistantId));
        this.setData({ sending: false });
        this.loadSessions();
      })
      .catch(() => {
        this.applyMessages(
          runtime.finishAgentsMpMessage(this.rawMessages, assistantId, copy.sendFailed),
        );
        this.setData({ sending: false });
      });
  },
});
