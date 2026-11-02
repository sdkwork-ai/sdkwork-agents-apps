import { bootstrapAgentsOrderService, initAgentsAppSdkClient } from "@sdkwork/agents-h5-core/sdk";

import { registerHostAdapters } from "./hostAdapters";
import { configureAgentsH5Locale } from "./i18n";
import { applyAgentsH5ThemePreference } from "./theme";
import { bootstrapKnowledgeSelection } from "./knowledgeSelection";
import { configureAgentsH5Ports } from "./ports";
import { bootstrapSdkClients } from "./sdkClients";

export function bootstrap() {
  // Locale is host-owned; inject it before any surface renders.
  configureAgentsH5Locale();
  applyAgentsH5ThemePreference();
  registerHostAdapters();
  bootstrapSdkClients();
  bootstrapKnowledgeSelection();
  initAgentsAppSdkClient();
  // Order/membership checkout shares the Agents session token manager.
  bootstrapAgentsOrderService();
  // Client capability ports are injected after the SDK clients exist so the
  // conversation / library / projects / automation surfaces never fall back to
  // constructing generated clients themselves.
  configureAgentsH5Ports();
}
