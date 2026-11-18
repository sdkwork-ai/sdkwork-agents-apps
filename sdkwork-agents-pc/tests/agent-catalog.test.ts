import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  AGENT_MARKET_CATEGORIES,
  filterMarketAgents,
} from '../packages/sdkwork-agents-pc-agents/src/pages/agentCatalog';

const agents = [
  { name: 'Developer', description: '', type: 'normal' as const, categoryId: 'engineering' },
  { name: 'Writer', description: '', type: 'normal' as const, categoryId: 'writing' },
  { name: 'Clinician', description: '', type: 'normal' as const, categoryId: 'healthcare' },
  { name: 'Uncategorized', description: '', type: 'normal' as const },
];

test('offers the professional domain taxonomy as market filters', () => {
  assert.deepEqual(
    AGENT_MARKET_CATEGORIES.map(({ id }) => id),
    [
      'all',
      'technology',
      'business',
      'corporate',
      'education',
      'health',
      'public-service',
      'lifestyle',
      'content',
      'industrial',
    ],
  );
});

test('filters by domain while aggregating every specialty beneath it', () => {
  assert.deepEqual(filterMarketAgents(agents, 'all').map(({ name }) => name), [
    'Developer',
    'Writer',
    'Clinician',
    'Uncategorized',
  ]);
  assert.deepEqual(filterMarketAgents(agents, 'technology').map(({ name }) => name), ['Developer']);
  assert.deepEqual(filterMarketAgents(agents, 'content').map(({ name }) => name), ['Writer']);
  assert.deepEqual(filterMarketAgents(agents, 'health').map(({ name }) => name), ['Clinician']);
  assert.deepEqual(filterMarketAgents(agents, 'industrial'), []);
});

test('Agent workspace renders and applies the market category controls', () => {
  const source = readFileSync(
    new URL('../packages/sdkwork-agents-pc-agents/src/pages/AgentsHomePage.tsx', import.meta.url),
    'utf8',
  );
  const publicExport = readFileSync(
    new URL('../packages/sdkwork-agents-pc-agents/src/index.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /AGENT_MARKET_CATEGORIES\.map/);
  assert.match(source, /filterMarketAgents\(catalog\.items, marketCategory\)/);
  assert.match(source, /scope === 'market'/);
  assert.match(publicExport, /export \{ AgentsHomePage \}/);
  assert.match(publicExport, /configureAgentsHomeRuntime/);
});
