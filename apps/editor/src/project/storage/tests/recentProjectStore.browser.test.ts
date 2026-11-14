import {
  expect,
  test,
  vi,
} from 'vitest';

import { createProject } from '@root/tests/editor-effects/project';

import {
  createLocalProject,
  openLocalProject,
  restoreLastProject,
} from '@project/projectService';

import { createEmptyBook } from '@components/EditorScreen/book/documents';

import { clearLastProjectHandle, getLastProjectHandle } from '../recentProjectStore';

test('preserves project operations after a native clone error and an aborted recent-handle read', async () => {
  const project = await createProject({ empty: true });
  const unhandled: unknown[] = [];
  const recordUnhandled = (event: PromiseRejectionEvent) => unhandled.push(event.reason);

  window.addEventListener('unhandledrejection', recordUnhandled);

  try {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const close = vi.spyOn(IDBDatabase.prototype, 'close');
    const put = IDBObjectStore.prototype.put;

    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(function (
      this: IDBObjectStore,
      ...[_value, key]: Parameters<IDBObjectStore['put']>
    ) {
      // A real native put throws DataCloneError before it creates a request.
      return put.call(this, () => {}, key);
    });
    const document = createEmptyBook();
    const created = await createLocalProject(document);

    expect(await created.storage.readBook()).toEqual(document);
    expect(close).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[project] Could not remember the last project.',
      expect.objectContaining({ name: 'DataCloneError' }),
    );
    expect(await getLastProjectHandle()).toBeNull();
    const opened = await openLocalProject();

    expect(opened.document).toEqual(document);
    expect((await getLastProjectHandle())?.name).toBe(created.name);
    const get = IDBObjectStore.prototype.get;

    vi.spyOn(IDBObjectStore.prototype, 'get').mockImplementationOnce(function (
      this: IDBObjectStore,
      query: IDBValidKey | IDBKeyRange,
    ) {
      const request = get.call(this, query);

      this.transaction.abort();

      return request;
    });
    expect(await restoreLastProject()).toEqual({ status: 'none' });
    expect(warn).toHaveBeenLastCalledWith(
      '[project] Could not read the last project.',
      expect.objectContaining({ name: 'AbortError' }),
    );
    const restored = await restoreLastProject();

    expect(restored.status).toBe('opened');

    if (restored.status === 'opened') {
      expect(restored.openedProject.document).toEqual(document);
    }

    await clearLastProjectHandle();
    expect(await getLastProjectHandle()).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(unhandled).toEqual([]);
  } finally {
    window.removeEventListener('unhandledrejection', recordUnhandled);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    await project.dispose();
  }
});
