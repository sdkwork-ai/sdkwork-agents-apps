const runtime = require("../../runtime/agents-app");
const { createAudioPlayer, openRemoteFile } = require("../common/media");

function buildCopy() {
  const translate = runtime.translateAgentsMpShellText;
  return {
    title: translate("agents.assets.detail.title"),
    loading: translate("agents.assets.loading"),
    empty: translate("agents.assets.empty"),
    loadFailed: translate("agents.assets.loadFailed"),
    retry: translate("agents.mobile.nav.retry"),
    back: translate("agents.mobile.nav.back"),
    detailKind: translate("agents.assets.detail.kind"),
    detailCreatedAt: translate("agents.assets.detail.createdAt"),
    detailSource: translate("agents.assets.detail.source"),
    open: translate("agents.assets.detail.open"),
    openFailed: translate("agents.assets.detail.openFailed"),
    emptyPreview: translate("agents.assets.detail.emptyPreview"),
    play: translate("agents.assets.detail.play"),
    pause: translate("agents.assets.detail.pause"),
    kindImage: translate("agents.assets.kind.image"),
    kindVideo: translate("agents.assets.kind.video"),
    kindAudio: translate("agents.assets.kind.audio"),
    kindOther: translate("agents.assets.kind.other"),
  };
}

function formatDateTime(iso, locale) {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const pad = (value) => String(value).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function kindLabel(copy, kind) {
  if (kind === "image") return copy.kindImage;
  if (kind === "video") return copy.kindVideo;
  if (kind === "audio") return copy.kindAudio;
  return copy.kindOther;
}

/**
 * Asset detail behind `app.agents.assets.detail`.
 *
 * The record is resolved from the same asset service the library uses, so a
 * deep link shows the persisted asset (and its Drive preview URL) instead of a
 * guessed media URL.
 */
Page({
  data: {
    t: {},
    statusBarHeight: 24,
    headerHeight: 68,
    bottomInset: 0,
    status: "loading",
    detail: null,
    detailPlaying: false,
    themeClass: "",
  },

  onLoad(options) {
    const insets = runtime.getAgentsMpWindowInsets();
    this.assetId = options && typeof options.id === "string" ? options.id : "";
    this.audio = createAudioPlayer();
    this.setData({
      t: buildCopy(),
      statusBarHeight: insets.statusBarHeight,
      headerHeight: insets.headerHeight,
      bottomInset: insets.safeAreaBottom,
    });
    this.services = runtime.getAgentsMpRuntimeServices();
    this.load();
  },

  onShow() {
    this.setData({
      t: buildCopy(),
      // Re-apply the stored theme so returning from Settings repaints this page.
      themeClass: runtime.resolveAgentsMpThemeClass(),
    });
  },

  onUnload() {
    if (this.audio) {
      this.audio.stop();
    }
  },

  load() {
    if (!this.assetId) {
      this.setData({ status: "empty" });
      return;
    }
    this.setData({ status: "loading" });
    const copy = this.data.t;
    this.services.assets
      .listAssets()
      .then((items) => {
        const item = items.find((entry) => entry.id === this.assetId);
        if (!item) {
          this.setData({ status: "empty", detail: null });
          return;
        }
        this.setData({
          status: "ready",
          detail: {
            id: item.id,
            kind: item.kind,
            kindLabel: kindLabel(copy, item.kind),
            previewUrl: item.previewUrl || "",
            title: item.toolId || item.mediaKind || item.id,
            createdAtText: formatDateTime(item.createdAt, runtime.getAgentsMpShellLocale()),
          },
        });
      })
      .catch(() => {
        this.setData({ status: "error" });
      });
  },

  onPreviewImage() {
    const detail = this.data.detail;
    if (detail && detail.previewUrl) {
      wx.previewImage({ current: detail.previewUrl, urls: [detail.previewUrl] });
    }
  },

  onToggleAudio() {
    const detail = this.data.detail;
    if (!detail || !detail.previewUrl) {
      wx.showToast({ title: this.data.t.openFailed, icon: "none" });
      return;
    }
    const playing = this.audio.toggle(detail.previewUrl, () => {
      this.setData({ detailPlaying: false });
    });
    this.setData({ detailPlaying: playing });
  },

  onOpenDocument() {
    const detail = this.data.detail;
    if (!detail || !detail.previewUrl) {
      wx.showToast({ title: this.data.t.openFailed, icon: "none" });
      return;
    }
    openRemoteFile(detail.previewUrl).catch(() => {
      wx.showToast({ title: this.data.t.openFailed, icon: "none" });
    });
  },

  onRetry() {
    this.load();
  },

  onBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: "/pages/assets/index" });
  },
});
