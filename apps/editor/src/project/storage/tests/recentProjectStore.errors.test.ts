import {
  afterEach,
  beforeEach,
  expect,
  test,
  vi,
} from 'vitest';

import { getLastProjectHandle, saveLastProjectHandle } from '../recentProjectStore';

import {
  createIndexedDb,
  expectFailure,
  handle,
  nextTurn,
} from './utils';

let scope: ReturnType<typeof createIndexedDb>;
const unhandled: unknown[] = [];
const recordUnhandled = (reason: unknown) => unhandled.push(reason);

beforeEach(() => {
  unhandled.length = 0;
  scope = createIndexedDb();
  process.on('unhandledRejection', recordUnhandled);
});

afterEach(async () => {
  try {
    await nextTurn();
    expect(unhandled).toEqual([]);
  } finally {
    process.off('unhandledRejection', recordUnhandled);
    vi.unstubAllGlobals();
  }
});

test('rejects a failed request even if its transaction completes', async () => {
  const failure = new DOMException('Request failed', 'UnknownError');
  const outcome = Promise.allSettled([getLastProjectHandle()]);

  await scope.open();
  scope.request.fail(failure);
  scope.commit();
  await expectFailure(outcome, failure);
  expect(scope.database.close).toHaveBeenCalledTimes(1);
});

test.each(['request-first', 'transaction-first'])('preserves the request error when both fail: %s', async (order) => {
  const requestError = new DOMException('Original request failure', 'UnknownError');
  const transactionError = new DOMException('Secondary transaction failure', 'AbortError');
  const outcome = Promise.allSettled([getLastProjectHandle()]);

  await scope.open();

  if (order === 'transaction-first') {
    scope.failTransaction(transactionError);
  }

  scope.request.fail(requestError);

  if (order === 'request-first') {
    scope.failTransaction(transactionError);
  }

  await expectFailure(outcome, requestError);
  expect(scope.database.close).toHaveBeenCalledTimes(1);
});

const transactionError = new DOMException('Transaction failed', 'UnknownError');
const transactionFailures = [{ event: 'error', failure: transactionError }, { event: 'abort', failure: null }];

test.each(transactionFailures)('rejects after request success and transaction $event', async ({ event, failure }) => {
  const outcome = Promise.allSettled([getLastProjectHandle()]);

  await scope.open();
  scope.request.succeed(handle);
  scope.failTransaction(failure, event);
  await expectFailure(outcome, failure);
  expect(scope.database.close).toHaveBeenCalledTimes(1);
});

test.each(['complete', 'abort'])('observes transaction %s after synchronous request failure', async (event) => {
  const failure = new DOMException('Handle cannot be cloned', 'DataCloneError');

  scope.store.put.mockImplementationOnce(() => {
    throw failure;
  });
  const outcome = Promise.allSettled([saveLastProjectHandle(handle)]);

  await scope.open();
  await nextTurn();
  const earlyCloses = scope.database.close.mock.calls.length;

  if (event === 'complete') {
    scope.commit();
  } else {
    scope.failTransaction(new DOMException('Secondary abort', 'AbortError'));
  }

  await expectFailure(outcome, failure);
  expect(earlyCloses).toBe(0);
  expect(scope.database.close).toHaveBeenCalledTimes(1);
});
