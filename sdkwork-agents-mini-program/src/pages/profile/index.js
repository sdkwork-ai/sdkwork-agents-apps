const runtime = require("../../runtime/agents-app");

function addDecimalStrings(left, right) {
  const a = typeof left === "string" && /^[0-9]+$/u.test(left) ? left : "0";
  const b = typeof right === "string" && /^[0-9]+$/u.test(right) ? right : "0";
  const width = Math.max(a.length, b.length);
  const paddedA = a.padStart(width, "0");
  const paddedB = b.padStart(width, "0");
  let carry = 0;
  let result = "";
  for (let index = width - 1; index >= 0; index -= 1) {
    const sum = Number(paddedA[index]) + Number(paddedB[index]) + carry;
    result = String(sum % 10) + result;
    carry = sum >= 10 ? 1 : 0;
  }
  return carry > 0 ? `1${result}` : result;
}

function buildCopy() {
  const translate = runtime.translateAgentsMpShellText;
  return {
    title: translate("agents.profile.title"),
    back: translate("agents.mobile.nav.back"),
    accountTitle: translate("agents.profile.account.title"),
    signedIn: translate("agents.profile.account.signedIn"),
    signedOut: translate("agents.profile.account.signedOut"),
    environment: translate("agents.profile.account.environment"),
    identityTitle: translate("agents.profile.identity.title"),
    identityEmpty: translate("agents.profile.identity.empty"),
    identityEdit: translate("agents.profile.identity.edit"),
    identityPrivacy: translate("agents.profile.identity.privacy"),
    identitySaved: translate("agents.profile.identity.saved"),
    avatarLabel: translate("agents.profile.identity.avatarLabel"),
    membershipTitle: translate("agents.profile.membership.title"),
    membershipUnavailable: translate("agents.profile.membership.unavailable"),
    membershipLoading: translate("agents.membership.loading"),
    currentNone: translate("agents.membership.current.none"),
    usageTitle: translate("agents.profile.usage.title"),
    usageTurns: translate("agents.profile.usage.turns"),
    usageTokens: translate("agents.profile.usage.tokens"),
    usageLoading: translate("agents.profile.usage.loading"),
    usageUnavailable: translate("agents.profile.usage.unavailable"),
    linksTitle: translate("agents.profile.links.title"),
    retry: translate("agents.mobile.nav.retry"),
  };
}

/**
 * Profile surface (`app.agents.profile.index`).
 *
 * Every tab page's avatar entry opens this page, and this page is the only route
 * to the secondary PC surfaces (membership, projects, library, automation,
 * conversation history, settings).
 *
 * The avatar and nickname come from the WeChat pickers and are stored on the
 * device by the profile capability service; nothing about the identity is
 * uploaded, and the privacy statement is rendered next to the picker.
 */
Page({
  data: {
    t: {},
    statusBarHeight: 24,
    headerHeight: 68,
    bottomInset: 0,
    account: { signedIn: false, environment: "" },
    identity: { nickname: "", avatarUrl: "" },
    membership: { status: "loading", text: "" },
    usage: { status: "loading", turns: "", tokens: "" },
    links: [],
    themeClass: "",
  },

  onLoad() {
    const insets = runtime.getAgentsMpWindowInsets();
    const copy = buildCopy();
    this.setData({
      t: copy,
      statusBarHeight: insets.statusBarHeight,
      headerHeight: insets.headerHeight,
      bottomInset: insets.safeAreaBottom,
      membership: { status: "loading", text: copy.membershipLoading },
      links: runtime.resolveAgentsMpProfileLinks((key) => runtime.translateAgentsMpShellText(key)),
    });
    this.services = runtime.getAgentsMpRuntimeServices();
    this.applySnapshot(this.services.profile.loadProfile());
    this.loadMembership();
    this.loadUsage();
  },

  onShow() {
    const copy = buildCopy();
    this.setData({
      t: copy,
      links: runtime.resolveAgentsMpProfileLinks((key) => runtime.translateAgentsMpShellText(key)),
      // Re-apply the stored theme so returning from Settings repaints this page.
      themeClass: runtime.resolveAgentsMpThemeClass(),
    });
    this.loadMembership(copy);
    this.loadUsage(copy);
  },

  applySnapshot(snapshot) {
    this.setData({
      account: snapshot.account,
      identity: snapshot.identity,
    });
  },

  loadMembership(copy = this.data.t) {
    this.setData({ membership: { status: "loading", text: copy.membershipLoading } });
    this.services.membership
      .loadCatalog()
      .then((catalog) => {
        if (catalog.availability === "unavailable") {
          this.setData({
            membership: { status: "unavailable", text: copy.membershipUnavailable },
          });
          return;
        }
        this.setData({
          membership: {
            status: "ready",
            text: catalog.summary.active
              ? catalog.summary.levelName || copy.membershipTitle
              : copy.currentNone,
          },
        });
      })
      .catch(() => {
        this.setData({
          membership: { status: "unavailable", text: copy.membershipUnavailable },
        });
      });
  },

  loadUsage(copy = this.data.t) {
    this.setData({ usage: { status: "loading", turns: "", tokens: "" } });
    this.services.usage
      .loadSummary()
      .then((summary) => {
        if (!summary) {
          this.setData({
            usage: { status: "unavailable", turns: "", tokens: copy.usageUnavailable },
          });
          return;
        }
        this.setData({
          usage: {
            status: "ready",
            turns: copy.usageTurns.replace("{{count}}", summary.turnCount),
            tokens: copy.usageTokens.replace(
              "{{count}}",
              addDecimalStrings(summary.inputTokens, summary.outputTokens),
            ),
          },
        });
      })
      .catch(() => {
        this.setData({
          usage: { status: "unavailable", turns: "", tokens: copy.usageUnavailable },
        });
      });
  },

  onChooseAvatar(event) {
    const tempPath = event.detail && event.detail.avatarUrl;
    if (!tempPath) {
      return;
    }
    // The picker returns a temporary path; persist it so the avatar survives a
    // relaunch. A refused save keeps the temporary path for this session.
    try {
      wx.getFileSystemManager().saveFile({
        tempFilePath: tempPath,
        success: (result) => this.saveIdentity({ avatarUrl: result.savedFilePath }),
        fail: () => this.saveIdentity({ avatarUrl: tempPath }),
      });
    } catch {
      this.saveIdentity({ avatarUrl: tempPath });
    }
  },

  onNicknameSave(event) {
    const value = event.detail && typeof event.detail.value === "string" ? event.detail.value : "";
    this.saveIdentity({ nickname: value });
  },

  saveIdentity(patch) {
    const snapshot = this.services.profile.saveIdentity(patch);
    this.applySnapshot(snapshot);
    wx.showToast({ title: this.data.t.identitySaved, icon: "none" });
  },

  onLinkTap(event) {
    const { url, mode } = event.currentTarget.dataset;
    if (typeof url !== "string" || url.length === 0) {
      return;
    }
    if (mode === "switchTab") {
      wx.switchTab({ url });
      return;
    }
    wx.navigateTo({ url });
  },

  onRetryMembership() {
    this.loadMembership();
  },

  onBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: "/pages/conversation/index" });
  },
});
