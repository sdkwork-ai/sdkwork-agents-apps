/**
 * Public integration surface of the Agents H5 automation capability.
 */

export { AutomationScreen } from "./screens/AutomationScreen";
export type { AutomationScreenProps } from "./screens/AutomationScreen";

export {
  AUTOMATION_MAX_PAGES,
  AUTOMATION_PAGE_SIZE,
  AutomationService,
} from "./services/AutomationService";
export type { AutomationListing } from "./services/AutomationService";

export {
  configureAutomationPort,
  getAutomationPort,
  isAutomationPortConfigured,
  resetAutomationPort,
} from "./services/automationPort";
export type { AutomationPort } from "./services/automationPort";

export { automationRouteContributions } from "./routes/automationRouteContributions";

export {
  AGENTS_AUTOMATION_MESSAGES,
  DEFAULT_AGENTS_AUTOMATION_LOCALE,
  configureAgentsAutomationLocale,
  getAgentsAutomationLocale,
  normalizeAgentsAutomationLocale,
  translateAgentsAutomationText,
} from "./i18n";
export type { AgentsAutomationLocale, AgentsAutomationMessageKey } from "./i18n";

export type { AutomationTaskPage, AutomationTaskSummary } from "./types";
