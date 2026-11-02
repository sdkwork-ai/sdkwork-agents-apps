/**
 * Public integration surface of the Agents H5 canvas capability.
 */

export { CanvasScreen } from "./screens/CanvasScreen";
export type { CanvasScreenProps } from "./screens/CanvasScreen";

export { CanvasService } from "./services/CanvasService";
export type { CanvasBoard } from "./services/CanvasService";

export {
  configureCanvasPort,
  getCanvasPort,
  isCanvasPortConfigured,
  resetCanvasPort,
} from "./services/canvasPort";
export type { CanvasPort } from "./services/canvasPort";

export { canvasRouteContributions } from "./routes/canvasRouteContributions";

export {
  AGENTS_CANVAS_MESSAGES,
  DEFAULT_AGENTS_CANVAS_LOCALE,
  configureAgentsCanvasLocale,
  getAgentsCanvasLocale,
  normalizeAgentsCanvasLocale,
  translateAgentsCanvasText,
} from "./i18n";
export type { AgentsCanvasLocale, AgentsCanvasMessageKey } from "./i18n";

export type {
  CanvasConnection,
  CanvasGroup,
  CanvasNode,
  CanvasNodeStatus,
  CanvasNodeType,
  CanvasWorkflow,
} from "./types";
