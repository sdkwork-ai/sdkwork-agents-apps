/**
 * Regression coverage for the chat failure classifier.
 *
 * The bug this protects against: a wallet shortfall reached the chat surface
 * as `50201 dispatch_failed` with the detail "insufficient available balance
 * for hold", and the UI rendered it as a generic generation failure — leaving
 * the user with an error they could neither understand nor act on. The
 * classifier must now recognize every shape the gateway has used for that
 * condition, and must NOT mistake a genuine upstream outage for it.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyChatFailure,
  isInsufficientBalanceFailure,
  INSUFFICIENT_BALANCE_CODE,
  INSUFFICIENT_BALANCE_HTTP_STATUS,
} from '../packages/sdkwork-agents-pc-chat/src/utils/chatFailure';

test('balance constants match the SDKWork result-code registry', () => {
  assert.equal(INSUFFICIENT_BALANCE_CODE, 40201);
  assert.equal(INSUFFICIENT_BALANCE_HTTP_STATUS, 402);
});

test('classifies the current 402/40201 contract as a funding problem', () => {
  assert.equal(
    classifyChatFailure({ code: 40201, httpStatus: 402, failedStage: 'billing_precharge' }),
    'insufficient_balance',
  );
  assert.equal(classifyChatFailure({ code: 40201 }), 'insufficient_balance');
  assert.equal(classifyChatFailure({ httpStatus: 402 }), 'insufficient_balance');
  // Result codes arrive as strings over the wire just as often as numbers.
  assert.equal(classifyChatFailure({ code: '40201' }), 'insufficient_balance');
});

test('classifies the pre-402 legacy shape reported as 50201', () => {
  // This is the exact payload from the reported incident.
  assert.equal(
    classifyChatFailure({
      code: 50201,
      httpStatus: 502,
      failedStage: 'dispatch_failed',
      message: 'insufficient available balance for hold',
    }),
    'insufficient_balance',
  );
});

test('classifies the precharge stage even without a recognized code', () => {
  assert.equal(
    classifyChatFailure({ httpStatus: 503, failedStage: 'billing_precharge' }),
    'insufficient_balance',
  );
});

test('honours a machine action.kind above every heuristic', () => {
  assert.equal(
    classifyChatFailure({ action: { kind: 'recharge' }, code: 50201, httpStatus: 503 }),
    'insufficient_balance',
  );
  assert.equal(
    classifyChatFailure({ action: { kind: 'membership' } }),
    'insufficient_balance',
  );
});

test('does NOT treat a genuine upstream outage as a funding problem', () => {
  // A 502 without a funding marker must stay generic, otherwise every provider
  // outage would render a "recharge" button.
  assert.equal(
    classifyChatFailure({
      code: 50201,
      httpStatus: 502,
      failedStage: 'dispatch_failed',
      message: 'upstream provider returned 500',
    }),
    'generic',
  );
  assert.equal(classifyChatFailure({ httpStatus: 503 }), 'generic');
  assert.equal(
    classifyChatFailure({ httpStatus: 502, message: 'upstream account credential rejected' }),
    'generic',
  );
  assert.equal(classifyChatFailure({}), 'generic');
});

test('a 402 always wins over a stale 50201 code', () => {
  // HTTP status is authoritative: the gateway now answers 402 for a shortfall,
  // so a leftover body code must not downgrade it to generic.
  assert.equal(
    classifyChatFailure({ httpStatus: 402, code: 50201 }),
    'insufficient_balance',
  );
});

test('isInsufficientBalanceFailure mirrors the classifier', () => {
  assert.equal(isInsufficientBalanceFailure({ code: 40201 }), true);
  assert.equal(isInsufficientBalanceFailure({ httpStatus: 503 }), false);
});
