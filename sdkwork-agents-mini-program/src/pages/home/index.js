const runtime = require("../../runtime/agents-app");

const TASKS_TAB_PAGE = "/pages/conversation/index";

/**
 * First-run / login landing page.
 *
 * It is the redirect target of the shell auth gate
 * (`evaluateAgentsMpAuthGate`), so it stays in the root package but is not part
 * of the tab set (`MINI_PROGRAM_APP_ARCHITECTURE_SPEC.md` section 5).
 */
Page({
  data: {
    title: "SDKWork Agents",
    hasSession: false,
    themeClass: "",
  },

  onShow() {
    const app = getApp();
    this.setData({
      hasSession: Boolean(app?.globalData?.sdkworkAccessToken),
      // Re-apply the stored theme so the landing page follows the preference.
      themeClass: runtime.resolveAgentsMpThemeClass(),
    });
  },

  onEnter() {
    wx.switchTab({ url: TASKS_TAB_PAGE });
  },
});
