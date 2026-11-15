import {
  afterEach,
  expect,
  test,
  vi,
} from 'vitest';

import { createProjectAssetUrls } from '../utils';

afterEach(() => vi.restoreAllMocks());

const deferredFile = () => {
  let resolve!: (file: File) => void;
  const promise = new Promise<File>((complete) => {
    resolve = complete;
  });

  return { promise, resolve };
};

test('shares one read and one object URL across content and visual consumers until project disposal', async () => {
  const file = new File(['image'], 'image.png', { type: 'image/png' });
  const getAssetFile = vi.fn(async () => file);
  const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:project');
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const cache = createProjectAssetUrls({ getAssetFile });
  cache.activate();
  const first = cache.load('assets/image.png');
  const otherConsumer = cache.load('assets/image.png');
  expect(otherConsumer).toBe(first);
  expect(await first).toBe('blob:project');
  expect(await cache.load('assets/image.png')).toBe('blob:project');
  expect(getAssetFile).toHaveBeenCalledTimes(1);
  expect(create).toHaveBeenCalledTimes(1);
  expect(revoke).not.toHaveBeenCalled();
  cache.dispose();
  expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:project');
});

test('a late result from a retired scope cannot create a URL or replace a new request', async () => {
  const old = deferredFile();
  const next = deferredFile();
  const file = new File(['image'], 'image.png');
  const getAssetFile = vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
  const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:new');
  const cache = createProjectAssetUrls({ getAssetFile });
  cache.activate();
  const stale = cache.load('assets/image.png');
  const rejected = expect(stale).rejects.toMatchObject({ name: 'AbortError' });
  cache.dispose();
  cache.activate();
  const current = cache.load('assets/image.png');
  old.resolve(file);
  await rejected;
  expect(cache.load('assets/image.png')).toBe(current);
  expect(create).not.toHaveBeenCalled();
  next.resolve(file);
  expect(await current).toBe('blob:new');
  expect(create).toHaveBeenCalledTimes(1);
  cache.dispose();
});

test('surfaces storage errors, allows a retry and releases every URL when the project closes', async () => {
  const file = new File(['image'], 'image.png');
  const getAssetFile = vi.fn().mockRejectedValueOnce(new Error('Missing')).mockResolvedValue(file);
  vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const cache = createProjectAssetUrls({ getAssetFile });
  cache.activate();
  await expect(cache.load('assets/image.png')).rejects.toThrow('Missing');
  await expect(cache.load('assets/image.png')).resolves.toBe('blob:first');
  await expect(cache.load('assets/other.png')).resolves.toBe('blob:second');
  cache.dispose();
  expect(revoke.mock.calls).toEqual([['blob:first'], ['blob:second']]);
  await expect(cache.load('assets/image.png')).rejects.toThrow('недоступен');
  expect(getAssetFile).toHaveBeenCalledTimes(3);
});
