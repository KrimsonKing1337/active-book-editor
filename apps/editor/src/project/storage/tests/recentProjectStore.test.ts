import {
  afterEach,
  beforeEach,
  expect,
  test,
  vi,
} from 'vitest';

import {
  clearLastProjectHandle,
  getLastProjectHandle,
  saveLastProjectHandle,
} from '../recentProjectStore';
import {
  DATABASE_NAME,
  DATABASE_VERSION,
  LAST_PROJECT_KEY,
  STORE_NAME,
} from '../constants';

import {
  createIndexedDb,
  expectFailure,
  handle,
  nextTurn,
} from './utils';

let scope: ReturnType<typeof createIndexedDb>;

beforeEach(() => {
  scope = createIndexedDb();
});

afterEach(() => vi.unstubAllGlobals());

test('reads the handle only after commit, then closes the connection', async () => {
  let returned = false;
  const operation = getLastProjectHandle().then((result) => {
    returned = true;

    return result;
  });

  await scope.open();
  scope.request.succeed(handle);
  await nextTurn();
  expect(returned).toBe(false);
  expect(scope.database.close).not.toHaveBeenCalled();
  scope.commit();
  await expect(operation).resolves.toBe(handle);
  expect(scope.factory.open).toHaveBeenCalledExactlyOnceWith(DATABASE_NAME, DATABASE_VERSION);
  expect(scope.database.transaction).toHaveBeenCalledExactlyOnceWith(STORE_NAME, 'readonly');
  expect(scope.transaction.objectStore).toHaveBeenCalledExactlyOnceWith(STORE_NAME);
  expect(scope.store.get).toHaveBeenCalledExactlyOnceWith(LAST_PROJECT_KEY);
  expect(scope.database.close).toHaveBeenCalledTimes(1);
});

test('writes the same handle and key in a committed readwrite transaction', async () => {
  const operation = saveLastProjectHandle(handle);

  await scope.open();
  scope.request.succeed(LAST_PROJECT_KEY);
  scope.commit();
  await expect(operation).resolves.toBeUndefined();
  expect(scope.database.transaction).toHaveBeenCalledExactlyOnceWith(STORE_NAME, 'readwrite');
  expect(scope.store.put).toHaveBeenCalledExactlyOnceWith(handle, LAST_PROJECT_KEY);
  expect(scope.database.close).toHaveBeenCalledTimes(1);
});

test('deletes the last handle in a committed readwrite transaction', async () => {
  const operation = clearLastProjectHandle();

  await scope.open();
  scope.request.succeed(undefined);
  scope.commit();
  await expect(operation).resolves.toBeUndefined();
  expect(scope.store.delete).toHaveBeenCalledExactlyOnceWith(LAST_PROJECT_KEY);
  expect(scope.database.transaction).toHaveBeenCalledExactlyOnceWith(STORE_NAME, 'readwrite');
  expect(scope.database.close).toHaveBeenCalledTimes(1);
});

test('returns null when the committed read finds no handle', async () => {
  const operation = getLastProjectHandle();

  await scope.open();
  scope.request.succeed(undefined);
  scope.commit();
  await expect(operation).resolves.toBeNull();
  expect(scope.database.close).toHaveBeenCalledTimes(1);
});

test('preserves an opening failure without starting a transaction or closing an unopened database', async () => {
  const failure = new DOMException('Cannot open database', 'UnknownError');
  const outcome = Promise.allSettled([getLastProjectHandle()]);

  scope.openRequest.fail(failure);
  await expectFailure(outcome, failure);
  expect(scope.database.transaction).not.toHaveBeenCalled();
  expect(scope.database.close).not.toHaveBeenCalled();
});

test('closes the opened connection if creating a transaction throws', async () => {
  const failure = new DOMException('Cannot create transaction', 'InvalidStateError');

  scope.database.transaction.mockImplementationOnce(() => {
    throw failure;
  });
  const outcome = Promise.allSettled([getLastProjectHandle()]);

  await scope.open();
  await expectFailure(outcome, failure);
  expect(scope.database.close).toHaveBeenCalledTimes(1);
});
