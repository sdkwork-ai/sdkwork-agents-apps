import assert from 'node:assert/strict';
import test from 'node:test';

import {
  configureAgentsAdminRuntime,
  listAgentCategories,
  upsertAgentCategory,
} from '../packages/sdkwork-agents-pc-admin/src/agentsAdminService.ts';

/**
 * Contract test for the frontend-to-backend boundary of the agent category
 * catalog.
 *
 * The admin block never constructs transport itself: it asks the host runtime
 * for the generated `@sdkwork/agents-backend-sdk` client. This test pins the
 * service methods to the generated `client.ai.agentCategories` operations so a
 * future SDK regeneration or transport refactor cannot silently detach the
 * admin surface from the backend route.
 */
test('agent category service uses the generated backend client operations', async () => {
  const calls: unknown[] = [];
  const client = {
    ai: {
      agentCategories: {
        list: async (params: unknown) => {
          calls.push(['list', params]);
          return {
            items: [],
            pageInfo: { mode: 'offset', totalItems: '0' },
          };
        },
        update: async (categoryCode: string, body: unknown) => {
          calls.push(['update', categoryCode, body]);
          return { categoryCode, ...(body as Record<string, unknown>) };
        },
      },
    },
  };

  configureAgentsAdminRuntime({
    getBackendSdkClient: () => client as never,
  });

  await listAgentCategories({ page: 1, pageSize: 200 });
  await upsertAgentCategory('education', {
    name: 'Education',
    parentId: null,
    sortOrder: 1,
    status: 'active',
    expectedVersion: '0',
  });

  assert.deepEqual(calls[0], ['list', { page: 1, pageSize: 200 }]);
  assert.deepEqual(calls[1], [
    'update',
    'education',
    {
      name: 'Education',
      parentId: null,
      sortOrder: 1,
      status: 'active',
      expectedVersion: '0',
    },
  ]);
});
