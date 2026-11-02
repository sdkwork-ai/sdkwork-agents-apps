/**
 * Domain-neutral design tokens for the mini program surface.
 *
 * Authority: `specs/client-theme.spec.json` (tech-blue flat, light base) and
 * `APP_MINI_PROGRAM_UI_SPEC.md`. These values mirror the CSS custom properties
 * declared on `page` in `src/app.wxss`, so TS-driven UI and WXSS share one
 * palette. Domain-neutral only; business screens belong to capability packages.
 */
export const agentsMpTokens = {
  colorPrimary: "#165DFF",
  colorPrimaryHover: "#4080FF",
  colorPrimaryPressed: "#0E42D2",
  colorPrimarySubtle: "#E8F0FF",
  colorBackground: "#F4F7FC",
  colorSurface: "#FFFFFF",
  colorSurfaceMuted: "#EAF1FB",
  colorSurfaceStrong: "#DCE8F9",
  colorText: "#0A1B3D",
  colorTextMuted: "#5B6B88",
  colorTextWeak: "#8A97AD",
  /*
   * Icon scale. Glyphs must resolve from these, never from a surface token;
   * the dark page remap in `src/app.wxss` flips them to light values.
   */
  colorIconDefault: "#5B6B88",
  colorIconStrong: "#0A1B3D",
  colorIconActive: "#165DFF",
  colorIconOnPrimary: "#FFFFFF",
  colorIconOnRail: "#C9D6EA",
  colorDanger: "#F53F3F",
  colorSuccess: "#00B42A",
  colorWarning: "#FF7D00",
  spacingSm: "16rpx",
  spacingMd: "32rpx",
  spacingLg: "48rpx",
} as const;

export type AgentsMpTokens = typeof agentsMpTokens;
