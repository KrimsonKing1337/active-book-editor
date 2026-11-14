import { expect, vi } from 'vitest';

import type { ProjectDirectoryHandle } from '../../@types/fileSystemAccess';

class ControlledRequest extends EventTarget {
  result: unknown;
  error: unknown = null;

  succeed(value: unknown) {
    this.result = value;
    this.dispatchEvent(new Event('success'));
  }

  fail(error: unknown) {
    this.error = error;
    this.dispatchEvent(new Event('error'));
  }
}

class ControlledTransaction extends EventTarget {
  error: unknown = null;
}

const unavailable = async (): Promise<never> => {
  throw new Error('Filesystem access is outside this IndexedDB test');
};

export const handle: ProjectDirectoryHandle = {
  kind: 'directory',
  name: 'Last project',
  getFileHandle: unavailable,
  getDirectoryHandle: unavailable,
  async *values() {
    yield await unavailable();
  },
};

export const nextTurn = () => new Promise<void>((resolve) => setImmediate(resolve));

export const expectFailure = async (
  outcome: Promise<PromiseSettledResult<unknown>[]>,
  failure: unknown,
) => {
  const [result] = await outcome;

  expect(result.status).toBe('rejected');

  if (result.status === 'rejected') {
    expect(result.reason).toBe(failure);
  }
};

export const createIndexedDb = () => {
  const request = new ControlledRequest();
  const openRequest = new ControlledRequest();
  const store = {
    get: vi.fn(() => request),
    put: vi.fn(() => request),
    delete: vi.fn(() => request),
  };
  const transaction = Object.assign(new ControlledTransaction(), {
    objectStore: vi.fn(() => store),
  });
  const database = {
    transaction: vi.fn(() => transaction),
    close: vi.fn(),
  };
  const factory = { open: vi.fn(() => openRequest) };

  vi.stubGlobal('indexedDB', factory);

  const open = async () => {
    openRequest.succeed(database);
    await Promise.resolve();
  };
  const commit = () => transaction.dispatchEvent(new Event('complete'));
  const failTransaction = (error: unknown, event = 'abort') => {
    transaction.error = error;
    transaction.dispatchEvent(new Event(event));
  };

  return {
    request,
    openRequest,
    store,
    transaction,
    database,
    factory,
    open,
    commit,
    failTransaction,
  };
};
