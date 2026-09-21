import { resolveBrowserDistOutDir } from '../../../sdkwork-specs/tools/browser-dist-layout.mjs';
function resolveViteEnvironment(mode: string | undefined, processEnv = process.env) {
  const profileMatch = /^(standalone|cloud)\.(development|test|staging|production)$/u.exec(mode ?? '');
  return profileMatch?.[2]
    ?? (['development', 'test', 'staging', 'production'].includes(processEnv.SDKWORK_ENVIRONMENT ?? '')
      ? (processEnv.SDKWORK_ENVIRONMENT ?? 'production')
      : 'production');
}
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSdkworkCredentialEntryBootstrapVitePlugin } from "@sdkwork/iam-credential-entry/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appRoot, "../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, appRoot, "");
  const accessToken = env.SDKWORK_ACCESS_TOKEN ?? process.env.SDKWORK_ACCESS_TOKEN;
  // The bootstrap credential reaches the renderer only through the IAM Vite
  // plugin below (dev-server HTML injection as
  // `globalThis.__SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN__`).
  // `define['process.env.SDKWORK_ACCESS_TOKEN']` is NOT a valid handoff: Vite 6
  // client dev transforms do not guarantee ordinary define replacement reaches
  // linked source packages (IAM_CREDENTIAL_ENTRY_SPEC.md section 2/4/5).
  return {
    build: {
      outDir: resolveBrowserDistOutDir(resolveViteEnvironment(mode, process.env)),
      emptyOutDir: true,
    },
    plugins: [
      createSdkworkCredentialEntryBootstrapVitePlugin({
        accessToken,
        environment: resolveViteEnvironment(mode, process.env),
        repoRoot,
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
      },
    },
    server: { port: 5196 },
  };
});
