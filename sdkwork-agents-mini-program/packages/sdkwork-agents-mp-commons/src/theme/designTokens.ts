/**
 * Domain-neutral design tokens for the mini program surface.
 *
 * Authority: `APP_MINI_PROGRAM_UI_SPEC.md`. Domain-neutral only; business
 * screens belong to capability packages.
 */
export const agentsMpTokens = {
  colorPrimary: "#0f766e",
  colorBackground: "#f8fafc",
  colorSurface: "#ffffff",
  colorText: "#0f172a",
  colorTextMuted: "#64748b",
  colorDanger: "#dc2626",
  spacingSm: "16rpx",
  spacingMd: "32rpx",
  spacingLg: "48rpx",
} as const;

export type AgentsMpTokens = typeof agentsMpTokens;
