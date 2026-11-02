import { AbilityContext } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';

import { createAgentsHarmonyEnvironment, type AgentsHarmonyEnvironment } from './Environment';
import { registerAgentsHarmonyHostAdapters } from './HostAdapters';
import { createAgentsHarmonyIamRuntime } from './IamRuntime';
import { createAgentsHarmonySdkClients } from './SdkClients';
import { initializeAgentsHarmonyShell, type AgentsHarmonyShellRuntime } from './ShellComposition';

const DOMAIN: number = 0x0000;
const TAG: string = 'SdkworkAgentsBootstrap';

/**
 * Root composition entry.
 *
 * This module assembles the environment, SDK clients, IAM runtime, host
 * adapters, shell navigation, and route registry only. It must not own product
 * business logic.
 *
 * Shell composition is installed before runtime-config resolution: the tab
 * shell, profile hub, and settings form depend on host adapters rather than on
 * remote transports, so they must render even while the ArkTS SDK adaptation or
 * the runtime-config projection is still pending. A page then reports the
 * explicit `unavailable` state for anything it cannot load.
 */
export interface AgentsHarmonyRuntime {
  readonly environment: AgentsHarmonyEnvironment;
  readonly routeCount: number;
}

export function bootstrapAgentsHarmonyApp(context: AbilityContext): AgentsHarmonyRuntime | null {
  registerAgentsHarmonyHostAdapters();
  const shell: AgentsHarmonyShellRuntime = initializeAgentsHarmonyShell(context);

  try {
    const environment: AgentsHarmonyEnvironment = createAgentsHarmonyEnvironment(
      createAgentsHarmonyRuntimeConfig(),
    );
    createAgentsHarmonySdkClients().initialize(environment.agentsApiBaseUrl);
    createAgentsHarmonyIamRuntime();
    hilog.info(DOMAIN, TAG, 'bootstrap completed for profile %{public}s', environment.profileId);
    return { environment, routeCount: shell.routeCount };
  } catch (error) {
    hilog.error(DOMAIN, TAG, 'bootstrap failed: %{public}s', JSON.stringify(error));
    return null;
  }
}

/**
 * Runtime config projection.
 *
 * The build projects exactly one non-secret
 * `config/app/runtime-env.<deploymentProfile>.<environment>.json` resource
 * into the HAP. Until the resource projection task is wired into the hvigor
 * pipeline, bootstrap fails fast instead of falling back to a hand-written
 * environment.
 */
function createAgentsHarmonyRuntimeConfig(): Record<string, Object> {
  throw new Error(
    'Harmony runtime config projection is not wired yet: provide config/app/runtime-env.<profile-id>.json as an ArkTS resource module',
  );
}
