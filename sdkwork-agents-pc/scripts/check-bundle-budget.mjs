import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(appRoot, 'dist');

// PC builds emit the FRONTEND_CODE_SPEC layout `dist/{standalone,cloud}/{env}`,
// so the budget runs against the most recently written route entry across all
// built profiles.
function resolveBuiltEntryRoot() {
  let candidate = null;
  for (const profile of readdirSync(distRoot)) {
    const profileRoot = path.join(distRoot, profile);
    if (!statSync(profileRoot).isDirectory()) continue;
    for (const env of readdirSync(profileRoot)) {
      const envRoot = path.join(profileRoot, env);
      const entry = path.join(envRoot, 'index.html');
      if (!statSync(entry).isFile()) continue;
      const builtAt = statSync(entry).mtimeMs;
      if (!candidate || builtAt > candidate.builtAt) {
        candidate = { root: envRoot, entry, builtAt };
      }
    }
  }
  if (!candidate) {
    throw new Error('PC build output not found under dist/{standalone,cloud}/{env}.');
  }
  return candidate;
}

const built = resolveBuiltEntryRoot();
const entryRoot = built.root;
const html = readFileSync(built.entry, 'utf8');
const initialScripts = [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+\.js)"/gu)]
  .map((match) => match[1])
  .filter((value, index, values) => values.indexOf(value) === index);

assert.ok(initialScripts.length > 0, 'PC production build must expose an initial JavaScript entry.');
const initialBytes = initialScripts.reduce((total, assetPath) => {
  const absolutePath = path.join(entryRoot, assetPath.replace(/^\//u, ''));
  return total + gzipSync(readFileSync(absolutePath)).byteLength;
}, 0);

// The lazy Token Plan entry adds only its navigation/runtime handshake to the
// shell. Baseline measured 2026-10-08 at ~415 KiB gzip when this script was
// repaired (it had been broken since the dist/{standalone,cloud}/{env} layout
// landed and never enforced); keep the budget enforced and trend it down.
const maxInitialGzipBytes = 512 * 1024;
assert.ok(
  initialBytes <= maxInitialGzipBytes,
  `PC initial JavaScript is ${Math.ceil(initialBytes / 1024)} KiB gzip; budget is ${maxInitialGzipBytes / 1024} KiB.`,
);

const forbiddenInitialChunks = ['MarkdownRendererImpl', 'monaco', 'pdf-export', 'editor'];
for (const forbidden of forbiddenInitialChunks) {
  assert.equal(
    initialScripts.some((assetPath) => assetPath.toLowerCase().includes(forbidden.toLowerCase())),
    false,
    `${forbidden} must remain outside the initial route dependency closure.`,
  );
}

console.log(`PC bundle budget passed: ${Math.ceil(initialBytes / 1024)} KiB initial gzip across ${initialScripts.length} chunk(s).`);
