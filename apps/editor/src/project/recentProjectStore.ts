import type { ProjectDirectoryHandle } from './fileSystemAccess';

import {
  DATABASE_NAME,
  DATABASE_VERSION,
  STORE_NAME,
  LAST_PROJECT_KEY,
} from './constants';

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });
};

const transactionToPromise = (transaction: IDBTransaction): Promise<void> => {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve());

    transaction.addEventListener('abort', () => reject(transaction.error));
    transaction.addEventListener('error', () => reject(transaction.error));
  });
};

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.addEventListener('upgradeneeded', () => {
      const database = request.result;
      const databaseContainsStoreName= database.objectStoreNames.contains(STORE_NAME);

      if (!databaseContainsStoreName) {
        database.createObjectStore(STORE_NAME);
      }
    });

    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });
};

export type WithStoreOperation<T> = (store: IDBObjectStore) => IDBRequest<T>;

const withStore = async <T>(
  mode: IDBTransactionMode,
  operation: WithStoreOperation<T>,
): Promise<T> => {
  const database = await openDatabase();

  try {
    const transaction = database.transaction(STORE_NAME, mode);

    const transactionDone = transactionToPromise(transaction);
    const request = operation(transaction.objectStore(STORE_NAME));
    const result = await requestToPromise(request);

    await transactionDone;

    return result;
  } finally {
    database.close();
  }
};

export const saveLastProjectHandle = async (
  handle: ProjectDirectoryHandle,
): Promise<void> => {
  const actionFunction = (store: IDBObjectStore) => {
    return store.put(handle, LAST_PROJECT_KEY);
  };

  await withStore('readwrite', actionFunction);
};

type Handle = ProjectDirectoryHandle | undefined;

export const getLastProjectHandle = async (): Promise<ProjectDirectoryHandle | null> => {
  const actionFunction = (store: IDBObjectStore) => {
    return store.get(LAST_PROJECT_KEY);
  };

  const handle: Handle = await withStore('readonly', actionFunction);

  return handle ?? null;
};

export const clearLastProjectHandle = async (): Promise<void> => {
  await withStore('readwrite', (store) => {
    return store.delete(LAST_PROJECT_KEY);
  });
};
