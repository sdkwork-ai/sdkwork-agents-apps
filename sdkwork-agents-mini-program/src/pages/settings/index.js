const runtime = require("../../runtime/agents-app");

const LANGUAGES = ["zh-CN", "en-US"];
const THEMES = ["system", "light", "dark"];

function buildCopy() {
  const translate = runtime.translateAgentsMpShellText;
  return {
    title: translate("agents.settings.title"),
    back: translate("agents.mobile.nav.back"),
    languageTitle: translate("agents.settings.language.title"),
    themeTitle: translate("agents.settings.theme.title"),
    saved: translate("agents.settings.saved"),
    localNote: translate("agents.settings.localNote"),
    languageZh: translate("agents.settings.language.zh"),
    languageEn: translate("agents.settings.language.en"),
    themeSystem: translate("agents.settings.theme.system"),
    themeLight: translate("agents.settings.theme.light"),
    themeDark: translate("agents.settings.theme.dark"),
  };
}

function buildLanguages() {
  return LANGUAGES.map((id) => ({
    id,
    label: runtime.translateAgentsMpShellText(
      id === "zh-CN" ? "agents.settings.language.zh" : "agents.settings.language.en",
    ),
  }));
}

function buildThemes() {
  return THEMES.map((id) => ({
    id,
    label: runtime.translateAgentsMpShellText(
      id === "system"
        ? "agents.settings.theme.system"
        : id === "light"
          ? "agents.settings.theme.light"
          : "agents.settings.theme.dark",
    ),
  }));
}

/**
 * Settings surface (`app.agents.settings.index`).
 *
 * Both preferences are device-level: they are written with `wx.setStorageSync`
 * through the shell's storage adapter and re-applied on launch, so the choice
 * survives a restart. Nothing is sent to a server.
 */
Page({
  data: {
    t: {},
    statusBarHeight: 24,
    headerHeight: 68,
    bottomInset: 0,
    locale: "zh-CN",
    theme: "system",
    themeClass: "",
    languages: [],
    themes: [],
  },

  onLoad() {
    const insets = runtime.getAgentsMpWindowInsets();
    const storedLocale = runtime.readAgentsMpStoredString(runtime.AGENTS_MP_LOCALE_STORAGE_KEY);
    const storedTheme = runtime.readAgentsMpStoredString(runtime.AGENTS_MP_THEME_STORAGE_KEY);
    const locale = storedLocale === "en-US" || storedLocale === "zh-CN" ? storedLocale : "zh-CN";
    const theme =
      storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
        ? storedTheme
        : "system";
    const resolved = runtime.applyAgentsMpTheme(theme);
    this.setData({
      t: buildCopy(),
      statusBarHeight: insets.statusBarHeight,
      headerHeight: insets.headerHeight,
      bottomInset: insets.safeAreaBottom,
      locale,
      theme,
      themeClass: resolved === "dark" ? "theme-dark" : "",
      languages: buildLanguages(),
      themes: buildThemes(),
    });
  },

  onShow() {
    this.setData({
      t: buildCopy(),
      languages: buildLanguages(),
      themes: buildThemes(),
      // Re-sync in case the stored preference changed while this page was hidden.
      themeClass: runtime.resolveAgentsMpThemeClass(),
    });
  },

  onLanguageTap(event) {
    const locale = event.currentTarget.dataset.locale;
    if (locale !== "zh-CN" && locale !== "en-US") {
      return;
    }
    if (locale === this.data.locale) {
      return;
    }
    runtime.writeAgentsMpStoredString(runtime.AGENTS_MP_LOCALE_STORAGE_KEY, locale);
    runtime.applyAgentsMpLocale(locale);
    this.setData({
      locale,
      t: buildCopy(),
      languages: buildLanguages(),
      themes: buildThemes(),
    });
    wx.showToast({ title: buildCopy().saved, icon: "none" });
  },

  onThemeTap(event) {
    const theme = event.currentTarget.dataset.theme;
    if (theme !== "light" && theme !== "dark" && theme !== "system") {
      return;
    }
    if (theme === this.data.theme) {
      return;
    }
    runtime.writeAgentsMpStoredString(runtime.AGENTS_MP_THEME_STORAGE_KEY, theme);
    const resolved = runtime.applyAgentsMpTheme(theme);
    this.setData({ theme, themeClass: resolved === "dark" ? "theme-dark" : "" });
    wx.showToast({ title: this.data.t.saved, icon: "none" });
  },

  onBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: "/pages/conversation/index" });
  },
});
