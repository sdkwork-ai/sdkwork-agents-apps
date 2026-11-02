const runtime = require("../../runtime/agents-app");
const { createAudioPlayer, openRemoteFile } = require("../common/media");

/** Tab id of this page in the shared shell tab set. */
const TAB_ID = "assets";

/** Kind filters, in the order the chips render. */
const KIND_FILTERS = ["all", "image", "video", "audio", "other"];

const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function buildCopy() {
  const translate = runtime.translateAgentsMpShellText;
  return {
    title: translate("agents.assets.title"),
    loading: translate("agents.assets.loading"),
    empty: translate("agents.assets.empty"),
    emptyFiltered: translate("agents.assets.emptyFiltered"),
    loadFailed: translate("agents.assets.loadFailed"),
    retry: translate("agents.mobile.nav.retry"),
    close: translate("agents.mobile.nav.close"),
    profileEntry: translate("agents.mobile.nav.profileEntry"),
    detailTitle: translate("agents.assets.detail.title"),
    detailKind: translate("agents.assets.detail.kind"),
    detailCreatedAt: translate("agents.assets.detail.createdAt"),
    detailSource: translate("agents.assets.detail.source"),
    openFailed: translate("agents.assets.detail.openFailed"),
    emptyPreview: translate("agents.assets.detail.emptyPreview"),
    play: translate("agents.assets.detail.play"),
    pause: translate("agents.assets.detail.pause"),
    open: translate("agents.assets.detail.open"),
    count: translate("agents.assets.count"),
    filterAll: translate("agents.assets.filter.all"),
    filterImage: translate("agents.assets.filter.image"),
    filterVideo: translate("agents.assets.filter.video"),
    filterAudio: translate("agents.assets.filter.audio"),
    filterOther: translate("agents.assets.filter.other"),
    kindImage: translate("agents.assets.kind.image"),
    kindVideo: translate("agents.assets.kind.video"),
    kindAudio: translate("agents.assets.kind.audio"),
    kindOther: translate("agents.assets.kind.other"),
  };
}

function buildFilters(copy) {
  return KIND_FILTERS.map((kind) => ({
    kind,
    label:
      kind === "all"
        ? copy.filterAll
        : kind === "image"
          ? copy.filterImage
          : kind === "video"
            ? copy.filterVideo
            : kind === "audio"
              ? copy.filterAudio
              : copy.filterOther,
  }));
}

function formatGroupLabel(dateKey, locale) {
  if (!dateKey) {
    return "";
  }
  const parts = dateKey.split("-");
  if (parts.length !== 3) {
    return dateKey;
  }
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day) || month < 1 || month > 12) {
    return dateKey;
  }
  return locale === "en-US" ? `${EN_MONTHS[month - 1]} ${day}` : `${month}月${day}日`;
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

/**
 * Asset library surface (`app.agents.assets.list`).
 *
 * Records come from `/ai/assets` through the assets capability service and are
 * grouped by calendar day on the device; preview URLs are Drive download URLs.
 * A record without a resolvable URL still renders (tile fallback) instead of
 * disappearing.
 */
Page({
  data: {
    t: {},
    statusBarHeight: 24,
    headerHeight: 68,
    bottomInset: 52,
    status: "loading",
    groups: [],
    filters: [],
    kind: "all",
    countText: "",
    detailOpen: false,
    detail: null,
    detailPlaying: false,
    themeClass: "",
  },

  onLoad() {
    const copy = buildCopy();
    const insets = runtime.getAgentsMpWindowInsets();
    this.allItems = [];
    this.audio = createAudioPlayer();
    this.setData({
      t: copy,
      filters: buildFilters(copy),
      statusBarHeight: insets.statusBarHeight,
      headerHeight: insets.headerHeight,
      bottomInset: 52 + insets.safeAreaBottom,
    });
    this.services = runtime.getAgentsMpRuntimeServices();
    this.loadAssets();
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setActive(TAB_ID);
    }
    const copy = buildCopy();
    this.setData({
      t: copy,
      filters: buildFilters(copy),
      // Re-apply the stored theme so returning from Settings repaints this page.
      themeClass: runtime.resolveAgentsMpThemeClass(),
    });
    // Re-group so the date labels and kind labels follow a locale change made on
    // the settings page.
    if (this.services && this.allItems && this.allItems.length > 0) {
      this.applyFilter();
    }
  },

  onUnload() {
    if (this.audio) {
      this.audio.stop();
    }
  },

  onPullDownRefresh() {
    this.loadAssets(() => wx.stopPullDownRefresh());
  },

  loadAssets(done) {
    const finish = () => {
      if (typeof done === "function") done();
    };
    this.setData({ status: "loading" });
    this.services.assets
      .listAssets()
      .then((items) => {
        this.allItems = items;
        this.applyFilter();
      })
      .catch(() => {
        this.setData({ status: "error" });
      })
      .then(finish, finish);
  },

  onFilterTap(event) {
    const kind = event.currentTarget.dataset.kind;
    if (kind === this.data.kind) {
      return;
    }
    this.setData({ kind });
    this.applyFilter();
  },

  applyFilter() {
    const copy = this.data.t;
    const locale = runtime.getAgentsMpShellLocale();
    const kind = this.data.kind;
    const filtered =
      kind === "all" ? this.allItems : this.allItems.filter((item) => item.kind === kind);
    if (filtered.length === 0) {
      this.setData({
        status: this.allItems.length === 0 ? "empty" : "emptyFiltered",
        groups: [],
        countText: "",
      });
      return;
    }
    const groups = this.services.assets.groupByDate(filtered).map((group) => ({
      dateKey: group.dateKey,
      label: formatGroupLabel(group.dateKey, locale),
      items: group.items.map((item) => ({
        id: item.id,
        kind: item.kind,
        kindLabel: this.kindLabel(copy, item.kind),
        previewUrl: item.previewUrl || "",
        title: item.toolId || item.mediaKind || item.id,
        createdAtText: formatDateTime(item.createdAt, locale),
        nodeId: item.nodeId,
      })),
    }));
    this.setData({
      status: "ready",
      groups,
      countText: copy.count.replace("{{count}}", String(filtered.length)),
    });
  },

  kindLabel(copy, kind) {
    if (kind === "image") return copy.kindImage;
    if (kind === "video") return copy.kindVideo;
    if (kind === "audio") return copy.kindAudio;
    return copy.kindOther;
  },

  onAssetTap(event) {
    const id = event.currentTarget.dataset.id;
    if (!id) {
      return;
    }
    if (this.audio) {
      this.audio.stop();
    }
    // The detail is a first-class route (`app.agents.assets.detail`) so a deep
    // link and a library tap resolve the same page.
    wx.navigateTo({ url: `/pages/assets/detail?id=${encodeURIComponent(id)}` });
  },

  onCloseDetail() {
    if (this.audio) {
      this.audio.stop();
    }
    this.setData({ detailOpen: false, detail: null, detailPlaying: false });
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
    this.loadAssets();
  },

  onOpenProfile() {
    wx.navigateTo({ url: runtime.AGENTS_MP_PROFILE_PAGE_URL });
  },
});
