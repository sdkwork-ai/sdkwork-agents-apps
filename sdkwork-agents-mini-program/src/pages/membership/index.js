const runtime = require("../../runtime/agents-app");

function buildCopy() {
  const translate = runtime.translateAgentsMpShellText;
  return {
    title: translate("agents.membership.title"),
    currentTitle: translate("agents.membership.current.title"),
    currentNone: translate("agents.membership.current.none"),
    currentExpiresAt: translate("agents.membership.current.expiresAt"),
    plansTitle: translate("agents.membership.plans.title"),
    plansEmpty: translate("agents.membership.plans.empty"),
    loading: translate("agents.membership.loading"),
    loadFailed: translate("agents.membership.loadFailed"),
    unavailable: translate("agents.membership.unavailable"),
    checkoutUnavailable: translate("agents.membership.checkout.unavailable"),
    checkoutAction: translate("agents.membership.checkout.action"),
    benefitsTitle: translate("agents.membership.benefits.title"),
    pointsTitle: translate("agents.membership.points.title"),
    pointsBalance: translate("agents.membership.points.balance"),
    retry: translate("agents.mobile.nav.retry"),
    back: translate("agents.mobile.nav.back"),
    profileEntry: translate("agents.mobile.nav.profileEntry"),
  };
}

function formatDate(iso) {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Membership surface (`app.agents.membership.catalog`).
 *
 * The catalog, the current membership, and checkout are owned by the membership
 * service. This root composes no membership transport, so the page renders the
 * localized unavailable state per action — it never shows an invented plan or
 * price, and it never opens a payment flow that cannot complete.
 */
Page({
  data: {
    t: {},
    statusBarHeight: 24,
    headerHeight: 68,
    bottomInset: 0,
    status: "loading",
    summary: null,
    pointsBalanceText: "",
    plans: [],
    checkoutAvailable: false,
    errorMessage: "",
    themeClass: "",
  },

  onLoad() {
    const insets = runtime.getAgentsMpWindowInsets();
    this.setData({
      t: buildCopy(),
      statusBarHeight: insets.statusBarHeight,
      headerHeight: insets.headerHeight,
      bottomInset: insets.safeAreaBottom,
    });
    this.services = runtime.getAgentsMpRuntimeServices();
    this.loadCatalog();
  },

  onShow() {
    this.setData({
      t: buildCopy(),
      // Re-apply the stored theme so returning from Settings repaints this page.
      themeClass: runtime.resolveAgentsMpThemeClass(),
    });
    if (this.services) {
      this.loadCatalog();
    }
  },

  loadCatalog() {
    const copy = this.data.t;
    this.setData({ status: "loading", errorMessage: "" });
    this.services.membership
      .loadCatalog()
      .then((catalog) => {
        if (catalog.availability === "unavailable") {
          this.setData({
            status: "unavailable",
            summary: null,
            pointsBalanceText: "",
            plans: [],
            checkoutAvailable: false,
          });
          return;
        }
        this.setData({
          status: "ready",
          checkoutAvailable: this.services.membership.checkoutAvailability === "available",
          summary: {
            active: catalog.summary.active,
            levelName: catalog.summary.levelName || "",
            expiresAtText: catalog.summary.expiresAt
              ? copy.currentExpiresAt.replace("{{date}}", formatDate(catalog.summary.expiresAt))
              : "",
          },
          pointsBalanceText:
            catalog.pointsBalance !== undefined
              ? copy.pointsBalance.replace(
                  "{{count}}",
                  Number(catalog.pointsBalance).toLocaleString(),
                )
              : "",
          plans: catalog.plans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            priceText: [plan.priceLabel, plan.periodLabel].filter(Boolean).join(" / "),
            benefits: plan.benefits,
          })),
        });
      })
      .catch(() => {
        this.setData({ status: "error" });
      });
  },

  onCheckout(event) {
    const planId = event.currentTarget.dataset.id;
    if (!planId) {
      return;
    }
    this.services.membership
      .startCheckout(planId)
      .then((result) => {
        if (!result.started || !result.cashierUrl) {
          wx.showToast({ title: this.data.t.checkoutUnavailable, icon: "none" });
          return;
        }
        wx.navigateTo({
          url: `/pages/membership/cashier?url=${encodeURIComponent(result.cashierUrl)}`,
        });
      })
      .catch(() => {
        wx.showToast({ title: this.data.t.checkoutUnavailable, icon: "none" });
      });
  },

  onRetry() {
    this.loadCatalog();
  },

  onBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: "/pages/conversation/index" });
  },

  onOpenProfile() {
    wx.navigateTo({ url: runtime.AGENTS_MP_PROFILE_PAGE_URL });
  },
});
