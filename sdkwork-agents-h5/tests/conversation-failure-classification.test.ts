/**
 * Regression coverage for the H5 conversation failure classifier.
 *
 * Mirrors `chat-failure-classification.test.ts` on the PC surface (the two
 * apps are independent workspace roots, so the classifier is duplicated and
 * must stay in sync). Protects against a wallet shortfall being rendered as a
 * generic generation failure with no way for the user to recover.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyConversationFailure,
  isInsufficientBalanceFailure,
  INSUFFICIENT_BALANCE_CODE,
} from '../packages/sdkwork-agents-h5-conversation/src/utils/conversationFailure';

test('balance constant matches the SDKWork result-code registry', () => {
  assert.equal(INSUFFICIENT_BALANCE_CODE, 40201);
});

test('classifies the current 402/40201 contract as a funding problem', () => {
  assert.equal(
    classifyConversationFailure({ code: 40201, httpStatus: 402, failedStage: 'billing_precharge' }),
    'insufficient_balance',
  );
  assert.equal(classifyConversationFailure({ code: '40201' }), 'insufficient_balance');
  assert.equal(classifyConversationFailure({ httpStatus: 402 }), 'insufficient_balance');
});

test('classifies the pre-402 legacy shape reported as 50201', () => {
  assert.equal(
    classifyConversationFailure({
      code: 50201,
      httpStatus: 502,
      failedStage: 'dispatch_failed',
      message: 'insufficient available balance for hold',
    }),
    'insufficient_balance',
  );
});

test('honours a machine action.kind above every heuristic', () => {
  assert.equal(
    classifyConversationFailure({ action: { kind: 'recharge' }, httpStatus: 503 }),
    'insufficient_balance',
  );
});

test('does NOT treat a genuine upstream outage as a funding problem', () => {
  assert.equal(
    classifyConversationFailure({
      code: 50201,
      httpStatus: 502,
      failedStage: 'dispatch_failed',
      message: 'upstream provider returned 500',
    }),
    'generic',
  );
  assert.equal(classifyConversationFailure({ httpStatus: 503 }), 'generic');
  assert.equal(classifyConversationFailure({}), 'generic');
});

test('a 402 always wins over a stale 50201 code', () => {
  assert.equal(
    classifyConversationFailure({ httpStatus: 402, code: 50201 }),
    'insufficient_balance',
  );
});

test('isInsufficientBalanceFailure mirrors the classifier', () => {
  assert.equal(isInsufficientBalanceFailure({ code: 40201 }), true);
  assert.equal(isInsufficientBalanceFailure({ httpStatus: 503 }), false);
});
