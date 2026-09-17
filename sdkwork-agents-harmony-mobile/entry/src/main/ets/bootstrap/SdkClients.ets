import {
  configureAgentsAppSdkBaseUrl,
  getAgentsAppSdkClient,
  resetAgentsAppSdkClient,
  type AgentsAppSdkClient,
  type AgentsAppSdkClientConfig,
} from '@sdkwork/sdkwork-agents-harmony-mobile-core';

/**
 * SDK client construction for the HarmonyOS root.
 *
 * Authority: `APP_SDK_INTEGRATION_SPEC.md` and
 * `HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md` section 6. Concrete clients are
 * constructed here (bootstrap only) and injected into feature packages.
 */
export class AgentsHarmonySdkClients {
  private agentsClient: AgentsAppSdkClient | null = null;

  initialize(appApiBaseUrl: string, accessToken?: string): void {
    configureAgentsAppSdkBaseUrl(appApiBaseUrl);
    const config: AgentsAppSdkClientConfig = {
      baseUrl: appApiBaseUrl,
      accessToken: accessToken,
    };
    this.agentsClient = getAgentsAppSdkClient(config);
  }

  get agents(): AgentsAppSdkClient {
    if (this.agentsClient === null) {
      throw new Error('Agents app SDK client must be initialized by bootstrap before use');
    }
    return this.agentsClient;
  }

  reset(): void {
    resetAgentsAppSdkClient();
    this.agentsClient = null;
  }
}

let sdkClients: AgentsHarmonySdkClients | null = null;

export function createAgentsHarmonySdkClients(): AgentsHarmonySdkClients {
  sdkClients = new AgentsHarmonySdkClients();
  return sdkClients;
}

export function getAgentsHarmonySdkClients(): AgentsHarmonySdkClients {
  if (sdkClients === null) {
    return createAgentsHarmonySdkClients();
  }
  return sdkClients;
}
