const runtime = require("../../runtime/agents-app");
const { createAudioPlayer, openRemoteFile } = require("../common/media");

/** Tab id of this page in the shared shell tab set. */
const TAB_ID = "creative";

const MODALITY_ORDER = ["image", "video", "music"];
const ASPECT_ORDER = ["square", "landscape", "portrait"];

function buildCopy() {
  const translate = runtime.translateAgentsMpShellText;
  return {
    title: translate("agents.creative.title"),
    promptLabel: translate("agents.creative.prompt.label"),
    promptPlaceholder: translate("agents.creative.prompt.placeholder"),
    modalityLabel: translate("agents.creative.modality.label"),
    aspectLabel: translate("agents.creative.aspect.label"),
    submit: translate("agents.creative.submit"),
    submitting: translate("agents.creative.submitting"),
    promptRequired: translate("agents.creative.promptRequired"),
    loading: translate("agents.creative.loading"),
    loadFailed: translate("agents.creative.loadFailed"),
    unavailable: translate("agents.creative.unavailable"),
    noTools: translate("agents.creative.noTools"),
    sessionsTitle: translate("agents.creative.sessions.title"),
    sessionsEmpty: translate("agents.creative.sessions.empty"),
    sessionsClear: translate("agents.creative.sessions.clear"),
    sessionsCleared: translate("agents.creative.sessions.cleared"),
    localNote: translate("agents.creative.sessions.localNote"),
    resultsTitle: translate("agents.creative.results.title"),
    resultsEmpty: translate("agents.creative.results.empty"),
    submitFailed: translate("agents.creative.submitFailed"),
    pending: translate("agents.creative.pending"),
    statusSucceeded: translate("agents.creative.status.succeeded"),
    statusFailed: translate("agents.creative.status.failed"),
    statusPending: translate("agents.creative.status.pending"),
    meta: translate("agents.creative.meta"),
    openFailed: translate("agents.creative.openFailed"),
    play: translate("agents.creative.play"),
    pause: translate("agents.creative.pause"),
    open: translate("agents.creative.open"),
    retry: translate("agents.mobile.nav.retry"),
    profileEntry: translate("agents.mobile.nav.profileEntry"),
    openCanvas: translate("agents.creative.canvas.open"),
    modalityImage: translate("agents.creative.modality.image"),
    modalityVideo: translate("agents.creative.modality.video"),
    modalityMusic: translate("agents.creative.modality.music"),
    aspectSquare: translate("agents.creative.aspect.square"),
    aspectLandscape: translate("agents.creative.aspect.landscape"),
    aspectPortrait: translate("agents.creative.aspect.portrait"),
  };
}

function modalityLabel(copy, modality) {
  if (modality === "image") return copy.modalityImage;
  if (modality === "video") return copy.modalityVideo;
  return copy.modalityMusic;
}

function formatRunTime(iso) {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Creative studio surface (`app.agents.creative.studio`).
 *
 * Generation runs through the media tool transport the Agents app SDK exposes:
 * the directory decides which modalities and models this tenant can use, and the
 * page reads each tool's declared schema through the capability service before
 * submitting. No prompt, model, or result is synthesized here.
 */
Page({
  data: {
    t: {},
    statusBarHeight: 24,
    headerHeight: 68,
    bottomInset: 52,
    catalogStatus: "loading",
    prompt: "",
    modalities: [],
    activeModality: "",
    modalityTools: [],
    activeToolId: "",
    aspects: [],
    activeAspect: "square",
    submitting: false,
    errorMessage: "",
    notice: "",
    runs: [],
    activeRunId: "",
    results: [],
    activeAudioUrl: "",
    activeAudioPlaying: false,
    themeClass: "",
  },

  onLoad() {
    const insets = runtime.getAgentsMpWindowInsets();
    this.tools = [];
    this.audio = createAudioPlayer();
    this.setData({
      t: buildCopy(),
      statusBarHeight: insets.statusBarHeight,
      headerHeight: insets.headerHeight,
      bottomInset: 52 + insets.safeAreaBottom,
    });
    this.services = runtime.getAgentsMpRuntimeServices();
    this.loadCatalog();
    this.loadRuns();
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setActive(TAB_ID);
    }
    const copy = buildCopy();
    this.setData({
      t: copy,
      // Re-apply the stored theme so returning from Settings repaints this page.
      themeClass: runtime.resolveAgentsMpThemeClass(),
    });
    // Re-render the local run log so its status/meta labels follow a locale
    // change made on the settings page.
    if (this.services && this.data.runs.length > 0) {
      this.setData({
        runs: this.services.creative.listRuns().map((run) => this.toViewRun(run, copy)),
      });
    }
  },

  onUnload() {
    if (this.audio) {
      this.audio.stop();
    }
  },

  loadCatalog() {
    this.setData({ catalogStatus: "loading", errorMessage: "" });
    this.services.creative
      .loadCatalog()
      .then((catalog) => {
        if (catalog.availability === "unavailable") {
          this.tools = [];
          this.setData({ catalogStatus: "unavailable" });
          return;
        }
        this.tools = catalog.tools;
        const modalities = MODALITY_ORDER.filter((modality) =>
          catalog.tools.some((tool) => tool.modality === modality),
        ).map((modality) => ({ id: modality, label: modalityLabel(this.data.t, modality) }));
        const activeModality = modalities.length > 0 ? modalities[0].id : "";
        this.setData({
          catalogStatus: "ready",
          modalities,
          activeModality,
          aspects: ASPECT_ORDER.map((aspect) => ({
            id: aspect,
            label:
              aspect === "square"
                ? this.data.t.aspectSquare
                : aspect === "landscape"
                  ? this.data.t.aspectLandscape
                  : this.data.t.aspectPortrait,
          })),
          activeAspect: "square",
        });
        this.applyModality(activeModality);
      })
      .catch(() => {
        this.setData({ catalogStatus: "error" });
      });
  },

  applyModality(modality) {
    const tools = this.tools
      .filter((tool) => tool.modality === modality)
      .map((tool) => ({ id: tool.id, label: tool.label, supportsSize: tool.supportsSize }));
    this.setData({
      activeModality: modality,
      modalityTools: tools,
      activeToolId: tools.length > 0 ? tools[0].id : "",
    });
  },

  loadRuns() {
    const copy = this.data.t;
    const runs = this.services.creative.listRuns().map((run) => this.toViewRun(run, copy));
    this.setData({ runs });
    if (runs.length > 0) {
      this.selectRun(runs[0].id);
    }
  },

  toViewRun(run, copy) {
    return {
      id: run.id,
      prompt: run.prompt,
      status: run.status,
      statusText:
        run.status === "succeeded"
          ? copy.statusSucceeded
          : run.status === "pending"
            ? copy.statusPending
            : copy.statusFailed,
      meta: copy.meta
        .replace("{{time}}", formatRunTime(run.createdAt))
        .replace("{{modality}}", modalityLabel(copy, run.modality)),
      media: run.media.map((entry) => ({
        kind: entry.kind,
        url: entry.url,
      })),
      error: run.error || "",
    };
  },

  selectRun(runId) {
    const run = this.services.creative.listRuns().find((entry) => entry.id === runId);
    if (!run) {
      this.setData({ activeRunId: "", results: [] });
      return;
    }
    if (this.audio) {
      this.audio.stop();
    }
    this.setData({
      activeRunId: run.id,
      results: run.media.map((entry) => ({ kind: entry.kind, url: entry.url })),
      activeAudioUrl: "",
      activeAudioPlaying: false,
      notice: run.status === "pending" ? this.data.t.pending : "",
      errorMessage: run.status === "failed" ? this.data.t.submitFailed : "",
    });
  },

  onRunTap(event) {
    this.selectRun(event.currentTarget.dataset.id);
  },

  onClearRuns() {
    this.services.creative.clearRuns();
    this.setData({ runs: [], activeRunId: "", results: [], notice: "", errorMessage: "" });
    wx.showToast({ title: this.data.t.sessionsCleared, icon: "none" });
  },

  onPromptInput(event) {
    this.setData({ prompt: event.detail.value });
  },

  onModalityTap(event) {
    const modality = event.currentTarget.dataset.modality;
    if (modality === this.data.activeModality) {
      return;
    }
    this.applyModality(modality);
  },

  onToolTap(event) {
    const toolId = event.currentTarget.dataset.id;
    if (toolId !== this.data.activeToolId) {
      this.setData({ activeToolId: toolId });
    }
  },

  onAspectTap(event) {
    const aspect = event.currentTarget.dataset.aspect;
    if (aspect !== this.data.activeAspect) {
      this.setData({ activeAspect: aspect });
    }
  },

  onSubmit() {
    const copy = this.data.t;
    const prompt = this.data.prompt.trim();
    if (prompt.length === 0) {
      wx.showToast({ title: copy.promptRequired, icon: "none" });
      return;
    }
    if (this.data.submitting) {
      return;
    }
    const tool = this.tools.find((entry) => entry.id === this.data.activeToolId);
    if (!tool) {
      this.setData({ errorMessage: copy.noTools });
      return;
    }
    this.setData({ submitting: true, errorMessage: "", notice: "" });
    this.services.creative
      .generate({ tool, prompt, aspect: this.data.activeAspect })
      .then((run) => {
        const runs = this.services.creative.listRuns().map((entry) => this.toViewRun(entry, copy));
        this.setData({ submitting: false, runs });
        this.selectRun(run.id);
      })
      .catch(() => {
        this.setData({ submitting: false, errorMessage: copy.submitFailed });
      });
  },

  onToggleAudio(event) {
    const url = event.currentTarget.dataset.url;
    if (!url) {
      return;
    }
    if (this.data.activeAudioUrl === url && this.data.activeAudioPlaying) {
      this.audio.pause();
      this.setData({ activeAudioPlaying: false });
      return;
    }
    const playing = this.audio.toggle(url, () => {
      this.setData({ activeAudioPlaying: false });
    });
    this.setData({ activeAudioUrl: playing ? url : "", activeAudioPlaying: playing });
  },

  onPreviewImage(event) {
    const url = event.currentTarget.dataset.url;
    if (!url) {
      return;
    }
    wx.previewImage({ current: url, urls: [url] });
  },

  onOpenMedia(event) {
    const url = event.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({ title: this.data.t.openFailed, icon: "none" });
      return;
    }
    openRemoteFile(url).catch(() => {
      wx.showToast({ title: this.data.t.openFailed, icon: "none" });
    });
  },

  onRetry() {
    this.loadCatalog();
  },

  onOpenProfile() {
    wx.navigateTo({ url: runtime.AGENTS_MP_PROFILE_PAGE_URL });
  },

  onOpenCanvas() {
    wx.navigateTo({ url: "/pages/canvas/index" });
  },
});
