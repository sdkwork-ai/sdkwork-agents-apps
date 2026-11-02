const {
  AGENTS_MP_LOCALE_STORAGE_KEY,
  AGENTS_MP_THEME_STORAGE_KEY,
  applyAgentsMpTheme,
  bootstrapAgentsMiniProgram,
  readAgentsMpStoredString,
} = require("./runtime/agents-app");
const runtimeEnv = require("./runtime/runtime-env");

const ACCESS_TOKEN_STORAGE_KEY = "sdkwork.accessToken";
const LOGIN_PAGE = "/pages/home/index";
const CHAT_TAB_PAGE = "/pages/conversation/index";

/**
 * Reads the session access token the IAM bridge stored after login.
 *
 * The token is a runtime session value, never build-time configuration, so it
 * lives in platform storage rather than in the runtime env profile.
 */
function readStoredAccessToken() {
  try {
    const token = wx.getStorageSync(ACCESS_TOKEN_STORAGE_KEY);
    return typeof token === "string" && token.length > 0 ? token : undefined;
  } catch {
    return undefined;
  }
}

function readStoredLocale() {
  const locale = readAgentsMpStoredString(AGENTS_MP_LOCALE_STORAGE_KEY);
  return typeof locale === "string" && locale.length > 0 ? locale : undefined;
}

function readStoredTheme() {
  const theme = readAgentsMpStoredString(AGENTS_MP_THEME_STORAGE_KEY);
  return theme === "light" || theme === "dark" || theme === "system" ? theme : "system";
}

App({
  globalData: {
    sdkworkProfileId: runtimeEnv.SDKWORK_PROFILE_ID,
    agentsAppApiBaseUrl: runtimeEnv.SDKWORK_AGENTS_APP_API_BASE_URL,
    sdkworkAccessToken: readStoredAccessToken(),
  },
  onLaunch() {
    try {
      applyAgentsMpTheme(readStoredTheme());
    } catch {
      // Window chrome is best-effort; launch must not depend on it.
    }
    try {
      bootstrapAgentsMiniProgram({
        appApiBaseUrl: this.globalData.agentsAppApiBaseUrl,
        accessToken: this.globalData.sdkworkAccessToken,
        locale: readStoredLocale(),
      });
    } catch {
      // Runtime bundle is produced by pnpm run build.
    }
    if (!this.globalData.sdkworkAccessToken) {
      // The shell auth gate redirects unauthenticated callers to the login page.
      wx.reLaunch({ url: LOGIN_PAGE });
    }
  },
  /** Called by the login page once the IAM bridge stored a session token. */
  completeLogin(accessToken) {
    this.globalData.sdkworkAccessToken = accessToken;
    wx.switchTab({ url: CHAT_TAB_PAGE });
  },
});
