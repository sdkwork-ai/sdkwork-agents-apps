/**
 * Host adapter capability registry.
 *
 * Renderer/feature code routes through the declared capability set; direct
 * platform branches on HarmonyOS globals are forbidden.
 */
export const agentsHarmonyHostCapabilities: string[] = [
  'secureStorage',
  'networkStatus',
  'appLifecycle',
  'deepLinks',
  'filePicker',
  'camera',
  'qrScanner',
  'pushNotifications',
  'clipboard',
  'deviceInfo',
];

export function hasAgentsHarmonyHostCapability(capability: string): boolean {
  return agentsHarmonyHostCapabilities.includes(capability);
}
