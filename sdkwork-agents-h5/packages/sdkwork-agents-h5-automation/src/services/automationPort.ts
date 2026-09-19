/**
 * Automation port.
 *
 * The transport lives behind an injected port so this package never constructs a
 * generated SDK client (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 8).
 */

import type { AutomationTaskPage } from "../types";

export interface AutomationPort {
  /** Lists scheduled tasks for the agent scope the composition root owns. */
  listTasks(page: number, pageSize: number): Promise<AutomationTaskPage>;
}

let automationPort: AutomationPort | null = null;

export function configureAutomationPort(port: AutomationPort): void {
  automationPort = port;
}

export function getAutomationPort(): AutomationPort {
  if (!automationPort) {
    throw new Error("Automation port is not configured.");
  }
  return automationPort;
}

export function isAutomationPortConfigured(): boolean {
  return automationPort !== null;
}

/** Test-only reset so isolated unit tests can re-wire the port. */
export function resetAutomationPort(): void {
  automationPort = null;
}
