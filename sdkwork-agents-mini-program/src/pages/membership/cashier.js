const runtime = require("../../runtime/agents-app");

/**
 * Cashier bridge page.
 *
 * The membership order service returns a `mobile_cashier_h5` URL. The mini
 * program cannot render a third-party H5 page directly, so this platform-only
 * web-view page hosts the cashier. The URL is validated to HTTP(S) before it is
 * passed to the web-view.
 */
Page({
  data: {
    url: "",
    invalid: false,
    themeClass: "",
  },

  onLoad(options) {
    const translate = runtime.translateAgentsMpShellText;
    wx.setNavigationBarTitle({ title: translate("agents.membership.cashier.title") });
    const raw = options && typeof options.url === "string" ? options.url : "";
    let decoded = "";
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      decoded = "";
    }
    if (!/^https?:\/\//iu.test(decoded)) {
      this.setData({ invalid: true });
      wx.showToast({
        title: translate("agents.membership.cashier.invalid"),
        icon: "none",
      });
      return;
    }
    this.setData({ url: decoded });
  },

  onShow() {
    // The payment itself stays a full-screen web-view; only the platform chrome
    // and the fallback state follow the in-app theme.
    this.setData({ themeClass: runtime.resolveAgentsMpThemeClass() });
  },

  onShareAppMessage() {
    return {
      title: "SDKWork Agents",
      path: "/pages/membership/index",
    };
  },
});
