import type { CreativeAspect, CreativeRun, CreativeTool } from "../types";

export interface CreativeGenerateInput {
  readonly tool: CreativeTool;
  readonly prompt: string;
  readonly aspect: CreativeAspect;
}

/**
 * Transport port for the media tool directory and one generation invocation.
 *
 * The application root binds `/ai/tools` plus the Drive preview resolver and
 * injects the port (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 8).
 */
export interface CreativePort {
  loadTools(): Promise<readonly CreativeTool[]>;
  generate(input: CreativeGenerateInput): Promise<CreativeRun>;
}

let creativePort: CreativePort | null = null;

export function configureCreativePort(port: CreativePort | null): void {
  creativePort = port;
}

export function getCreativePort(): CreativePort {
  if (!creativePort) {
    throw new Error("Creative transport is not composed for this client root.");
  }
  return creativePort;
}

export function isCreativePortConfigured(): boolean {
  return creativePort !== null;
}

export function resetCreativePort(): void {
  creativePort = null;
}
