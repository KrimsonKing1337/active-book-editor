import {
  afterEach,
  expect,
  test,
} from 'vitest';

import { getHasPendingProjectChanges } from '../../../pendingOperations';

import {
  book,
  createFile,
  createStorage,
  nextTurn,
} from './utils';

afterEach(() => {
  expect(getHasPendingProjectChanges()).toBe(false);
});

test.each([
  { stage: 'write', cleanup: 'success' },
  { stage: 'write', cleanup: 'reject' },
  { stage: 'write', cleanup: 'absent' },
  { stage: 'write', cleanup: 'throw' },
  { stage: 'close', cleanup: 'success' },
  { stage: 'close', cleanup: 'reject' },
  { stage: 'close', cleanup: 'absent' },
  { stage: 'close', cleanup: 'throw' },
])('preserves $stage error when abort is $cleanup', async ({ stage, cleanup }) => {
  const { root, storage } = createStorage();
  const file = createFile('book.json');
  const failure = Object.assign(new Error('Original failure'), { code: 'PRIMARY' });
  const secondary = new Error('Abort failure');
  const unhandled: unknown[] = [];
  const recordUnhandled = (reason: unknown) => unhandled.push(reason);

  root.files.set('book.json', file.handle);

  if (stage === 'write') {
    file.write.mockRejectedValueOnce(failure);
  } else {
    file.close.mockRejectedValueOnce(failure);
  }

  if (cleanup === 'reject') {
    file.abort.mockRejectedValueOnce(secondary);
  } else if (cleanup === 'absent') {
    delete file.writable.abort;
  } else if (cleanup === 'throw') {
    file.abort.mockImplementationOnce(() => {
      throw secondary;
    });
  }

  process.on('unhandledRejection', recordUnhandled);

  try {
    await expect(storage.writeBook(book)).rejects.toBe(failure);
    await nextTurn();
    expect(unhandled).toEqual([]);
    expect(file.createWritable).toHaveBeenCalledTimes(1);
    expect(file.write).toHaveBeenCalledExactlyOnceWith(`${JSON.stringify(book, null, 2)}\n`);

    if (stage === 'write') {
      expect(file.close).not.toHaveBeenCalled();
    } else {
      expect(file.close).toHaveBeenCalledTimes(1);
    }

    if (cleanup === 'absent') {
      expect(file.abort).not.toHaveBeenCalled();
    } else {
      expect(file.abort).toHaveBeenCalledTimes(1);
    }
  } finally {
    process.off('unhandledRejection', recordUnhandled);
  }
});

test('preserves createWritable failure without writing, closing or aborting', async () => {
  const { root, storage } = createStorage();
  const file = createFile('book.json');
  const failure = new Error('Cannot create writable');

  root.files.set('book.json', file.handle);
  file.createWritable.mockRejectedValueOnce(failure);
  await expect(storage.writeBook(book)).rejects.toBe(failure);
  expect(file.write).not.toHaveBeenCalled();
  expect(file.close).not.toHaveBeenCalled();
  expect(file.abort).not.toHaveBeenCalled();
});
