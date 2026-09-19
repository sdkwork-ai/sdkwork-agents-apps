const runtime = require("../../runtime/agents-app");

/** Bounded drain for the file listing; the library is a browse surface only. */
const LIBRARY_PAGE_SIZE = 100;
const LIBRARY_MAX_PAGES = 5;

function buildCopy() {
  const translate = (key) => runtime.translateAgentsMpLibraryText(key);
  return {
    title: translate("agents.library.title"),
    searchPlaceholder: translate("agents.library.search.placeholder"),
    empty: translate("agents.library.empty"),
    loading: translate("agents.library.loading"),
    loadFailed: translate("agents.library.loadFailed"),
    truncated: translate("agents.library.truncated"),
    openFailed: translate("agents.library.openFailed"),
  };
}

function formatSize(sizeBytes) {
  const value = Number(sizeBytes);
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Library tab (`app.agents.library.list`).
 *
 * The library is Drive-owned; this page only reads nodes carrying the shared
 * library property and opens a short-lived download URL.
 */
Page({
  data: {
    t: {},
    statusBarHeight: 24,
    headerHeight: 68,
    bottomInset: 52,
    files: [],
    viewFiles: [],
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
    this.loadFiles();
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setActive("library");
    }
  },

  onPullDownRefresh() {
    this.loadFiles(() => wx.stopPullDownRefresh());
  },

  loadFiles(done) {
    const finish = () => {
      if (typeof done === "function") done();
    };
    this.setData({ loading: true, errorMessage: "" });

    const collected = [];
    const readPage = (pageIndex, cursor) =>
      this.services.library
        .listFiles(LIBRARY_PAGE_SIZE, cursor)
        .then((page) => {
          collected.push(...page.items);
          const nextCursor = page.nextCursor || undefined;
          if (nextCursor && pageIndex + 1 < LIBRARY_MAX_PAGES) {
            return readPage(pageIndex + 1, nextCursor);
          }
          return { truncated: Boolean(nextCursor) };
        });

    readPage(0)
      .then((result) => {
        this.setData({
          loading: false,
          files: collected,
          viewFiles: this.toViewFiles(collected, this.data.query),
          truncatedText: result.truncated
            ? runtime.translateAgentsMpLibraryText("agents.library.truncated", {
                count: String(collected.length),
              })
            : "",
        });
      })
      .catch(() => {
        this.setData({ loading: false, errorMessage: this.data.t.loadFailed });
      })
      .then(finish, finish);
  },

  toViewFiles(files, query) {
    return runtime.filterAgentsMpLibraryFiles(files, query).map((file) => ({
      id: file.id,
      name: file.name,
      meta: [file.mimeType, formatSize(file.sizeBytes)].filter(Boolean).join(" · "),
    }));
  },

  onSearchInput(event) {
    const query = event.detail.value;
    this.setData({ query, viewFiles: this.toViewFiles(this.data.files, query) });
  },

  onOpen(event) {
    const { id } = event.currentTarget.dataset;
    this.services.library
      .resolvePreviewUrl(id)
      .then(
        (url) =>
          new Promise((resolve, reject) => {
            wx.downloadFile({
              url,
              success: (result) => {
                wx.openDocument({
                  filePath: result.tempFilePath,
                  showMenu: true,
                  success: resolve,
                  fail: reject,
                });
              },
              fail: reject,
            });
          }),
      )
      .catch(() => wx.showToast({ title: this.data.t.openFailed, icon: "none" }));
  },
});
