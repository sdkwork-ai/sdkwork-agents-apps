import type { AssetItem } from "../types";

/**
 * Transport port for the asset library.
 *
 * The application root binds `/ai/assets` plus the Drive download-URL resolver
 * and injects the result (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 8);
 * the capability package never constructs a generated client.
 */
export interface AssetsPort {
  listAssets(): Promise<readonly AssetItem[]>;
}

let assetsPort: AssetsPort | null = null;

export function configureAssetsPort(port: AssetsPort | null): void {
  assetsPort = port;
}

export function getAssetsPort(): AssetsPort {
  if (!assetsPort) {
    throw new Error("Assets transport is not composed for this client root.");
  }
  return assetsPort;
}

export function isAssetsPortConfigured(): boolean {
  return assetsPort !== null;
}

export function resetAssetsPort(): void {
  assetsPort = null;
}
