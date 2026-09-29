/**
 * Application upload declaration conformance for sdkwork-agents-h5
 * (`DRIVE_SPEC.md` section 18).
 *
 * The declaration file is the authority; the constants module carries its values
 * into code so call sites do not repeat literals. This test keeps the two from
 * drifting and keeps the declared values rule-conforming.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DECLARATION_PATH = path.join(appRoot, 'specs/upload.declaration.json');
const CONSTANTS_PATH = path.join(
  appRoot,
  'packages/sdkwork-agents-h5-core/src/sdk/uploadDeclaration.ts',
);
const APP_CONFIG_PATH = path.join(appRoot, 'sdkwork.app.config.json');

/** §8.1 standard upload profiles. */
const STANDARD_UPLOAD_PROFILES = new Set([
  'generic', 'video', 'image', 'audio', 'document', 'archive',
  'text', 'dataset', 'attachment', 'avatar', 'thumbnail',
]);

/** §9.4 reserves `im` for Drive; an application must not declare or send it. */
const RESERVED_SCENES = new Set(['im']);

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const APP_RESOURCE_TYPE = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9_]*)+$/;

function loadDeclaration() {
  return JSON.parse(fs.readFileSync(DECLARATION_PATH, 'utf8'));
}

/** Reads the `export const AGENTS_H5_*_UPLOAD` entry objects out of the constants module. */
function readDeclaredConstantValues(source) {
  const stringConstants = new Map();
  for (const match of source.matchAll(
    /(?:^|[^A-Za-z0-9_])(?:export\s+)?const ([A-Z0-9_]+)(?:\s*:[^=]+)?\s*=\s*['"]([^'"]+)['"]\s*as const/g,
  )) {
    stringConstants.set(match[1], match[2]);
  }
  const resolve = (raw) => {
    if (raw === undefined) return undefined;
    const literal = raw.match(/^['"]([^'"]+)['"]$/);
    if (literal) return literal[1];
    return stringConstants.get(raw.trim());
  };

  const values = [];
  const blocks = source.split(/(?:^|[^A-Za-z0-9_])export const AGENTS_H5_[A-Z0-9_]*UPLOAD[A-Z0-9_]*\s*=\s*\{/g);
  for (const block of blocks.slice(1)) {
    const end = block.indexOf('} as const');
    const body = end >= 0 ? block.slice(0, end) : block.slice(0, 600);
    const pick = (key) =>
      resolve(body.match(new RegExp(`(?:^|[^A-Za-z0-9_])${key}\\s*:\\s*(['"][^'"]+['"]|[A-Z0-9_]+)`))?.[1]);
    values.push({
      appResourceType: pick('appResourceType'),
      scene: pick('scene'),
      source: pick('source'),
      uploadProfileCode: pick('uploadProfileCode'),
    });
  }
  return values;
}

test('upload declaration file exists, parses, and uses the supported schema', () => {
  const declaration = loadDeclaration();
  assert.equal(declaration.schemaVersion, 1);
  assert.ok(Array.isArray(declaration.declarations));
  assert.ok(declaration.declarations.length > 0);
});

test('upload declaration declares every required field on every entry', () => {
  const required = [
    'appResourceType', 'appResourceIdKind', 'scene', 'source',
    'uploadProfileCode', 'retention', 'purpose',
  ];
  for (const entry of loadDeclaration().declarations) {
    for (const field of required) {
      assert.ok(entry[field], `entry ${entry.appResourceType} is missing ${field}`);
    }
  }
});

test('upload declaration uses standard upload profiles only', () => {
  for (const entry of loadDeclaration().declarations) {
    assert.ok(
      STANDARD_UPLOAD_PROFILES.has(entry.uploadProfileCode),
      `${entry.appResourceType} declares a non-standard profile ${entry.uploadProfileCode}`,
    );
  }
});

test('upload declaration names appResourceType as a dotted lowercase business type', () => {
  for (const entry of loadDeclaration().declarations) {
    assert.match(entry.appResourceType, APP_RESOURCE_TYPE);
  }
});

test('upload declaration names source and scene as stable lowercase kebab-case labels', () => {
  for (const entry of loadDeclaration().declarations) {
    assert.match(entry.source, KEBAB_CASE);
    assert.ok(!entry.source.includes('/'), `${entry.source} contains a path separator`);
    assert.ok(!entry.source.includes('@'), `${entry.source} contains an npm scope`);
    assert.match(entry.scene, KEBAB_CASE);
    assert.ok(!RESERVED_SCENES.has(entry.scene), `${entry.scene} is reserved for Drive (§9.4)`);
  }
});

test('upload declaration declares one identity per entry', () => {
  const declarations = loadDeclaration().declarations;
  const identities = declarations.map(
    (entry) => `${entry.appResourceType}|${entry.scene}|${entry.uploadProfileCode}`,
  );
  assert.equal(new Set(identities).size, identities.length, 'a duplicated upload purpose was declared');
});

test('upload declaration constants agree on one source label', () => {
  const sources = new Set(loadDeclaration().declarations.map((entry) => entry.source));
  assert.equal(sources.size, 1, `expected one source label, found ${[...sources].join(', ')}`);
});

test('upload declaration appId matches the application config', () => {
  const config = JSON.parse(fs.readFileSync(APP_CONFIG_PATH, 'utf8'));
  const appId = config.backend?.appId ?? config.app?.key;
  assert.ok(appId, 'sdkwork.app.config.json does not declare an app identity.');
  assert.equal(loadDeclaration().appId, appId);
});

test('upload declaration constants mirror the declaration file', () => {
  const constants = readDeclaredConstantValues(fs.readFileSync(CONSTANTS_PATH, 'utf8'));
  const declared = loadDeclaration().declarations;
  assert.equal(constants.length, declared.length, 'constant count differs from declaration count');
  declared.forEach((declaredEntry, index) => {
    const constant = constants[index];
    const where = `entry #${index + 1} (${declaredEntry.appResourceType} / ${declaredEntry.scene} / ${declaredEntry.uploadProfileCode})`;
    for (const field of ['appResourceType', 'scene', 'source', 'uploadProfileCode']) {
      assert.equal(
        constant[field],
        declaredEntry[field],
        `constant ${field} disagrees with the declaration for ${where}`,
      );
    }
  });
});
