import type { ProjectDirectoryHandle } from './fileSystemAccess';

const DATABASE_NAME = 'active-book-editor';
const DATABASE_VERSION = 1;
const STORE_NAME = 'project-handles';
const LAST_PROJECT_KEY = 'last-project';

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });

const transactionToPromise = (
  transaction: IDBTransaction,
): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve());
    transaction.addEventListener('abort', () => reject(transaction.error));
    transaction.addEventListener('error', () => reject(transaction.error));
  });

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.addEventListener('upgradeneeded', () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    });

    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });

const withStore = async <T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
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
  await withStore('readwrite', (store) => store.put(handle, LAST_PROJECT_KEY));
};

export const getLastProjectHandle = async (): Promise<ProjectDirectoryHandle | null> => {
  const handle = await withStore('readonly', (store) =>
    store.get(LAST_PROJECT_KEY),
  );

  return (handle as ProjectDirectoryHandle | undefined) ?? null;
};

export const clearLastProjectHandle = async (): Promise<void> => {
  await withStore('readwrite', (store) => store.delete(LAST_PROJECT_KEY));
};
