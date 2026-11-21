import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSdkworkAgentService,
  type AgentConfig,
} from '../packages/sdkwork-agents-pc-agents/src/services/AgentService';
import type { SdkworkAgentsAppClient } from '../packages/sdkwork-agents-pc-core/src/sdk/agentsAppSdkClient';

interface CapturedCreate {
  body?: Record<string, unknown>;
}

/**
 * Minimal app SDK client: records the create request and burns down the
 * composition-slot list the create path performs right after it.
 */
function createFakeClient(captured: CapturedCreate): SdkworkAgentsAppClient {
  return {
    ai: {
      agents: {
        create: async (body: Record<string, unknown>) => {
          captured.body = body;
          return {
            agentId: String(body.agentId),
            code: String(body.code),
            displayName: String(body.displayName),
            manifest: body.manifest ?? {},
          };
        },
        compositionSlots: {
          list: async () => ({
            items: [],
            pageInfo: {
              page: 1,
              pageSize: 20,
              totalPages: 0,
              totalItems: 0,
              hasMore: false,
            },
          }),
        },
      },
    },
  } as unknown as SdkworkAgentsAppClient;
}

const baseConfig: AgentConfig = {
  name: 'SDKWork Agents',
  description: 'Built-in conversational assistant.',
  type: 'normal',
};

/**
 * The built-in assistant id is unique per tenant, so the record is shared by
 * every member: provisioning it as `private` leaves everybody but its creator
 * with 404 on retrieve and 409 on create.
 */
test('creates the built-in assistant with tenant visibility', async () => {
  const captured: CapturedCreate = {};
  const service = createSdkworkAgentService(() => createFakeClient(captured));

  await service.createAgent({
    ...baseConfig,
    id: 'agent.chat.default',
    visibility: 'tenant',
  });

  assert.equal(captured.body?.visibility, 'tenant');
});

test('keeps ordinary agents private by default', async () => {
  const captured: CapturedCreate = {};
  const service = createSdkworkAgentService(() => createFakeClient(captured));

  await service.createAgent(baseConfig);

  assert.equal(captured.body?.visibility, 'private');
});
