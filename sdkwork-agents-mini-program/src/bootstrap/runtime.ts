import {
  configureAgentsMpAutomationLocale,
  type AgentsMpAutomationLocale,
} from "@sdkwork/agents-mp-automation";
import {
  configureAgentsMpConversationLocale,
  type AgentsMpConversationLocale,
} from "@sdkwork/agents-mp-conversation";
import { initDriveAppSdkClient } from "@sdkwork/agents-mp-core/sdk";
import {
  configureAgentsMpLibraryLocale,
  type AgentsMpLibraryLocale,
} from "@sdkwork/agents-mp-library";
import {
  configureAgentsMpProjectsLocale,
  type AgentsMpProjectsLocale,
} from "@sdkwork/agents-mp-projects";
import {
  configureAgentsMpShellLocale,
  normalizeAgentsMpShellLocale,
  type AgentsMpShellLocale,
} from "@sdkwork/agents-mp-shell";

import { registerHostAdapters } from "./hostAdapters";
import { bootstrapSdkClients } from "./sdkClients";

export interface AgentsMiniProgramBootstrapOptions {
  appApiBaseUrl?: string;
  accessToken?: string;
  /** Overrides the host language tag; used by tests and preview tooling. */
  locale?: string;
}

/**
 * Resolves the active locale.
 *
 * This is the one place the mini program root reads the host locale; capability
 * packages receive it through `configureAgentsMp*Locale`
 * (`I18N_SPEC.md` section 7 — locale resolution belongs to the host).
 */
function resolveAgentsMiniProgramLocale(
  override: string | undefined,
  hostLocaleTag: string | undefined,
): AgentsMpShellLocale {
  return normalizeAgentsMpShellLocale(override ?? hostLocaleTag);
}

/**
 * Composes the mini program runtime: platform adapters, SDK clients, and locale
 * injection. Capability services are constructed per page from the injected
 * clients so nothing reaches the network during launch.
 */
export function bootstrap(options: AgentsMiniProgramBootstrapOptions = {}) {
  const adapters = registerHostAdapters();
  const sdk = bootstrapSdkClients(options);
  const driveAppSdk = initDriveAppSdkClient();
  const locale = resolveAgentsMiniProgramLocale(options.locale, adapters.localeTag);

  configureAgentsMpShellLocale(locale);
  configureAgentsMpConversationLocale(locale as AgentsMpConversationLocale);
  configureAgentsMpLibraryLocale(locale as AgentsMpLibraryLocale);
  configureAgentsMpProjectsLocale(locale as AgentsMpProjectsLocale);
  configureAgentsMpAutomationLocale(locale as AgentsMpAutomationLocale);

  return { ready: true, locale, insets: adapters.insets, driveAppSdk, ...sdk };
}
