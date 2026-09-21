import { resolveBrowserDistOutDir } from '../../../sdkwork-specs/tools/browser-dist-layout.mjs';
function resolveViteEnvironment(mode: string | undefined, processEnv = process.env) {
  const profileMatch = /^(standalone|cloud)\.(development|test|staging|production)$/u.exec(mode ?? '');
  return profileMatch?.[2]
    ?? (['development', 'test', 'staging', 'production'].includes(processEnv.SDKWORK_ENVIRONMENT ?? '')
      ? (processEnv.SDKWORK_ENVIRONMENT ?? 'production')
      : 'production');
}
import path from 'node:path';

import { createSdkworkCredentialEntryBootstrapVitePlugin } from '@sdkwork/iam-credential-entry/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const credentialEntryBootstrapAccessToken = process.env.SDKWORK_ACCESS_TOKEN ?? '';

  return {
    plugins: [
      // The bootstrap credential reaches the renderer only through the shared
      // IAM plugin (dev-server HTML injection as
      // `globalThis.__SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN__`).
      // Applications MUST NOT fork the serialization or lifecycle gating
      // (IAM_CREDENTIAL_ENTRY_SPEC.md section 2/4/5).
      createSdkworkCredentialEntryBootstrapVitePlugin({
        accessToken: credentialEntryBootstrapAccessToken,
        environment: resolveViteEnvironment(mode, process.env),
        repoRoot: path.resolve(__dirname, '../..'),
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      outDir: resolveBrowserDistOutDir(resolveViteEnvironment(mode, process.env)),
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replaceAll('\\\\', '/');
            if (normalizedId.includes('/sdks/sdkwork-agents-app-sdk/')) return 'sdk-agents';
            if (normalizedId.includes('/sdkwork-iam/sdks/sdkwork-iam-app-sdk/')) return 'sdk-iam';
            if (normalizedId.includes('/sdkwork-drive/sdks/sdkwork-drive-app-sdk/')) return 'sdk-drive';
            if (normalizedId.includes('/sdkwork-assets/sdks/sdkwork-assets-app-sdk/')) return 'sdk-assets';
            if (normalizedId.includes('/sdkwork-community/sdks/sdkwork-community-app-sdk/')) return 'sdk-community';
            if (normalizedId.includes('/sdkwork-generations/sdks/sdkwork-generations-app-sdk/')) return 'sdk-generations';
            if (normalizedId.includes('/sdkwork-knowledgebase/')) return 'sdk-knowledgebase';
            if (normalizedId.includes('/sdkwork-skills/')) return 'sdk-skills';
            if (normalizedId.includes('/sdkwork-voice/')) return 'sdk-voice';
            if (!id.includes('node_modules')) return undefined;
            return undefined;
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      port: 5195,
      proxy: {
        '/app/v3/api': 'http://127.0.0.1:8095',
        '/healthz': 'http://127.0.0.1:8095',
        '/livez': 'http://127.0.0.1:8095',
        '/readyz': 'http://127.0.0.1:8095',
      },
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
