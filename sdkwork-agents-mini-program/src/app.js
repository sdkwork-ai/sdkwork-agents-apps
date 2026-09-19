const { bootstrapAgentsMiniProgram } = require("./runtime/agents-app");
const runtimeEnv = require("./runtime/runtime-env");

const ACCESS_TOKEN_STORAGE_KEY = "sdkwork.accessToken";
const LOGIN_PAGE = "/pages/home/index";
const TASKS_TAB_PAGE = "/pages/conversation/index";

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

App({
  globalData: {
    sdkworkProfileId: runtimeEnv.SDKWORK_PROFILE_ID,
    agentsAppApiBaseUrl: runtimeEnv.SDKWORK_AGENTS_APP_API_BASE_URL,
    sdkworkAccessToken: readStoredAccessToken(),
  },
  onLaunch() {
    try {
      bootstrapAgentsMiniProgram({
        appApiBaseUrl: this.globalData.agentsAppApiBaseUrl,
        accessToken: this.globalData.sdkworkAccessToken,
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
    wx.switchTab({ url: TASKS_TAB_PAGE });
  },
});
