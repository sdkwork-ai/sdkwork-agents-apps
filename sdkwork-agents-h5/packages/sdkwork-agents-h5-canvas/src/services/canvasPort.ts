import type { CanvasWorkflow } from "../types";

/**
 * Port for the browser-local canvas workflow.
 *
 * The composition root owns the storage key and the tolerant parser; the
 * capability package only renders the normalized graph. A root without the port
 * reports the unavailable state instead of inventing a workflow.
 */
export interface CanvasPort {
  loadWorkflow(): Promise<CanvasWorkflow | null>;
}

let canvasPort: CanvasPort | null = null;

export function configureCanvasPort(port: CanvasPort | null): void {
  canvasPort = port;
}

export function getCanvasPort(): CanvasPort {
  if (!canvasPort) {
    throw new Error("Canvas transport is not composed for this client root.");
  }
  return canvasPort;
}

export function isCanvasPortConfigured(): boolean {
  return canvasPort !== null;
}

export function resetCanvasPort(): void {
  canvasPort = null;
}
