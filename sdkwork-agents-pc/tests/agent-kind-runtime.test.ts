import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

import {
  AGENT_CATEGORY_TAXONOMY,
  agentCategoryLabel,
  listAgentCategoryLeaves,
} from '../packages/sdkwork-agents-pc-agents/src/services/agentTaxonomy';
import {
  CONVERSATION_RUNTIME,
  HARNESS_RUNTIME_PROTOCOL,
  LOCAL_AGENT_ENGINES,
  buildLocalArchiveDistribution,
  buildLocalExecutionRuntime,
  findLocalAgentEngine,
} from '../packages/sdkwork-agents-pc-agents/src/services/agentRuntimeCatalog';
import {
  buildAgentConfigFromBasics,
  requiresPackageUpload,
} from '../packages/sdkwork-agents-pc-agents/src/editor/agentCreationModel';
import {
  AGENT_CATEGORY_TREE as SEEDED_CATEGORY_TREE,
  LOCAL_EXECUTION_AGENTS as SEEDED_LOCAL_AGENTS,
} from '../../../scripts/agent-catalog/catalog.mjs';

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_ROOT = resolve(APP_ROOT, 'packages/sdkwork-agents-pc-agents');

describe('professional agent taxonomy', () => {
  it('ships nine domains and twenty-five assignable specialties', () => {
    assert.equal(AGENT_CATEGORY_TAXONOMY.length, 9);
    const leaves = listAgentCategoryLeaves();
    assert.equal(leaves.length, 25);
    assert.equal(new Set(leaves.map((leaf) => leaf.code)).size, 25);
    assert.ok(leaves.every((leaf) => leaf.parentCode !== leaf.code));
  });

  it('never assigns a domain code as a leaf', () => {
    const domains = new Set(AGENT_CATEGORY_TAXONOMY.map((node) => node.code));
    for (const leaf of listAgentCategoryLeaves()) {
      assert.ok(!domains.has(leaf.code), `${leaf.code} is both a domain and a leaf`);
    }
  });

  it('classifies the local-execution specialty under technology', () => {
    const local = listAgentCategoryLeaves().find((leaf) => leaf.code === 'local-execution');
    assert.equal(local?.parentCode, 'technology');
    assert.equal(agentCategoryLabel('local-execution'), '本地执行智能体');
  });
});

describe('agent runtime descriptors', () => {
  it('defaults hosted agents to the Rig Rust implementation', () => {
    assert.equal(CONVERSATION_RUNTIME.family, 'rig');
    assert.equal(CONVERSATION_RUNTIME.engine, 'rig');
    assert.equal(CONVERSATION_RUNTIME.implementation_type, 'rig-rust');
    assert.equal(CONVERSATION_RUNTIME.provider_id, 'provider.rig.rust');
  });

  it('drives every local agent through the harness runtime protocol', () => {
    for (const engine of LOCAL_AGENT_ENGINES) {
      const runtime = buildLocalExecutionRuntime(engine.id);
      assert.equal(runtime.family, 'harness');
      assert.equal(runtime.engine, engine.id);
      assert.equal(runtime.protocol, HARNESS_RUNTIME_PROTOCOL);
      assert.equal(runtime.provider_id, 'provider.harness.local');
      assert.equal(runtime.implementation_type, 'custom');
    }
  });

  it('falls back to the first engine for an unknown local engine', () => {
    assert.equal(findLocalAgentEngine('not-a-real-engine').id, LOCAL_AGENT_ENGINES[0].id);
  });

  it('distributes local agents as zip archives', () => {
    const distribution = buildLocalArchiveDistribution('openclaw');
    assert.equal(distribution.kind, 'archive');
    assert.equal(distribution.format, 'zip');
    assert.equal(distribution.archiveRef, 'archive.sdkwork.openclaw');
    assert.equal(distribution.entrypoint, 'openclaw/manifest.json');
    assert.equal(distribution.installMode, 'extract');
    assert.equal(distribution.checksum, null);
  });
});

describe('creation flow model', () => {
  it('routes a local agent to the archive upload step with a host category', () => {
    const config = buildAgentConfigFromBasics({
      name: '我的本地助手',
      description: '本机任务',
      categoryId: 'engineering',
      agentKind: 'local-execution',
      runtimeEngine: 'workbuddy',
    });
    assert.equal(config.agentKind, 'local-execution');
    assert.equal(config.categoryId, 'local-execution');
    assert.equal(config.executionRoute, 'host');
    assert.equal(config.runtimeEngine, 'workbuddy');
    assert.equal(config.distribution?.kind, 'archive');
    assert.equal(requiresPackageUpload({ agentKind: 'local-execution' }), true);
    assert.equal(requiresPackageUpload({ agentKind: 'conversation' }), false);
  });

  it('keeps the chosen professional category for a conversation agent', () => {
    const config = buildAgentConfigFromBasics({
      name: '合同审阅助手',
      description: '审阅合同条款',
      categoryId: 'legal',
      agentKind: 'conversation',
    });
    assert.equal(config.categoryId, 'legal');
    assert.equal(config.agentKind, 'conversation');
    assert.equal(config.distribution, undefined);
  });

  it('does not reset an existing local archive when basics are re-saved', () => {
    const patch = buildAgentConfigFromBasics(
      {
        name: '更新后的本地助手',
        description: '新描述',
        categoryId: 'local-execution',
        agentKind: 'local-execution',
        runtimeEngine: 'openclaw',
      },
      { type: 'normal' },
      { includeLocalArchive: false },
    );
    assert.equal(patch.distribution, undefined);
    assert.equal(patch.agentKind, 'local-execution');
  });
});

describe('client taxonomy mirrors the seeded catalog', () => {
  it('keeps every category code, parent, and label in sync', () => {
    const seeded = (SEEDED_CATEGORY_TREE as Array<{
      code: string;
      children: Array<{ code: string; zhName: string }>;
    }>)
      .flatMap((parent) =>
        parent.children.map((child) => ({
          code: child.code,
          label: child.zhName,
          parentCode: parent.code,
        })),
      )
      .sort((left, right) => left.code.localeCompare(right.code));
    const client = listAgentCategoryLeaves()
      .map((leaf) => ({
        code: leaf.code,
        label: leaf.label,
        parentCode: leaf.parentCode,
      }))
      .sort((left, right) => left.code.localeCompare(right.code));
    assert.deepEqual(client, seeded);
  });

  it('keeps every local engine, archive reference, and entrypoint in sync', () => {
    const seeded = (SEEDED_LOCAL_AGENTS as Array<{
      slug: string;
      engine: string;
      distribution: { archiveRef: string; entrypoint: string };
    }>)
      .map((agent) => ({
        engine: agent.engine,
        archiveRef: agent.distribution.archiveRef,
        entrypoint: agent.distribution.entrypoint,
      }))
      .sort((left, right) => left.engine.localeCompare(right.engine));
    const client = LOCAL_AGENT_ENGINES.map((engine) => ({
      engine: engine.id,
      archiveRef: engine.archiveRef,
      entrypoint: engine.entrypoint,
    })).sort((left, right) => left.engine.localeCompare(right.engine));
    assert.deepEqual(client, seeded);
  });
});

describe('creation surface ownership', () => {
  it('publishes the creation flow from the reusable editor entry', () => {
    const packageJson = JSON.parse(readFileSync(resolve(PACKAGE_ROOT, 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
    };
    assert.ok(packageJson.exports['./editor'], 'missing ./editor export');
    const editorIndex = readFileSync(resolve(PACKAGE_ROOT, 'src/editor/index.ts'), 'utf8');
    assert.match(editorIndex, /AgentCreationFlow/);
    assert.match(editorIndex, /AgentBasicInfoDialog/);
    assert.match(editorIndex, /AgentPackageUpload/);
  });

  it('persists the manifest-derived kind, category, and runtime binding', () => {
    const service = readFileSync(
      resolve(PACKAGE_ROOT, 'src/services/AgentService.ts'),
      'utf8',
    );
    assert.match(service, /agent_kind/);
    assert.match(service, /category_code/);
    assert.match(service, /provider\.rig\.rust/);
    assert.match(service, /HARNESS_RUNTIME_PROVIDER_ID/);
    assert.match(service, /distribution/);
  });

  it('declares the local package upload intent', () => {
    const declaration = JSON.parse(
      readFileSync(resolve(APP_ROOT, 'specs/upload.declaration.json'), 'utf8'),
    ) as { declarations: Array<{ appResourceType: string; scene: string }> };
    const entry = declaration.declarations.find(
      (candidate) => candidate.appResourceType === 'agent.package_archive',
    );
    assert.ok(entry, 'missing agent.package_archive upload declaration');
    assert.equal(entry.scene, 'agent-package');
  });
});
