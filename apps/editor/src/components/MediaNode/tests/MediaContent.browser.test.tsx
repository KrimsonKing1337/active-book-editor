import {
  afterEach,
  expect,
  test,
  vi,
} from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { openMediaEditor } from './fixture';

let fixture: Awaited<ReturnType<typeof openMediaEditor>> | undefined;

afterEach(async () => {
  await fixture?.dispose();
  fixture = undefined;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('project images support atomic editing and undo/redo without reimporting', async () => {
  fixture = await openMediaEditor();
  const {
    editor,
    src,
    storage,
  } = fixture;
  const reads = vi.spyOn(storage, 'getAssetFile');
  const image = page.getByRole('img', { name: 'Portrait' });
  await expect.element(image).toBeVisible();
  await expect.poll(() => {
    const element = image.query();

    return element instanceof HTMLImageElement && element.naturalWidth === 120;
  }).toBe(true);
  reads.mockClear();
  expect(image.query()?.getAttribute('src')).toMatch(/^blob:/u);
  await image.click();
  await page.getByLabelText('Альтернативное описание').fill('Changed portrait');
  await page.getByLabelText('Ширина', { exact: true }).fill('55');
  await page.getByLabelText('Высота (пиксели)').fill('180');
  await page.getByLabelText('Выравнивание').selectOptions('center');
  await page.getByLabelText('Размещение в заданной области').selectOptions('cover');
  expect(editor.getJSON().content?.[0]?.attrs).toMatchObject({
    src,
    alt: 'Changed portrait',
    width: { value: 55, unit: '%' },
    height: { value: 180, unit: 'px' },
    align: 'center',
    fit: 'cover',
  });
  expect(editor.getJSON().content?.[0]?.content).toBeUndefined();
  expect(editor.getHTML()).toContain('src="assets/portrait.svg"');
  expect(editor.getHTML()).not.toContain('blob:');
  await page.getByRole('img', { name: 'Changed portrait' }).click();
  await userEvent.keyboard('{Control>}z{/Control}');
  expect(editor.getJSON().content?.[0]?.attrs?.fit).toBe('contain');
  await userEvent.keyboard('{Control>}y{/Control}');
  expect(editor.getJSON().content?.[0]?.attrs?.fit).toBe('cover');
  expect(reads).not.toHaveBeenCalled();
  await page.getByRole('img', { name: 'Changed portrait' }).click();
  await userEvent.keyboard('{ArrowRight}');
  expect(editor.getJSON().content?.[0]?.attrs?.src).toBe(src);
});

test('JSON and raw clipboard reject invalid media before fitting can discard source content', async () => {
  fixture = await openMediaEditor({ type: 'doc', content: [{ type: 'paragraph' }] });
  const { editor } = fixture;
  const original = editor.getJSON();
  const invalid = [
    { type: 'image', attrs: { src: 'blob:temporary' } },
    { type: 'unknownMedia', attrs: { src: 'assets/portrait.svg' } },
    {
      type: 'video',
      attrs: { src: 'assets/movie.webm' },
      content: [{ type: 'paragraph' }],
    },
    { type: 'paragraph', content: [{ type: 'image', attrs: { src: 'assets/portrait.svg' } }] },
    { type: 'image', attrs: { src: 'assets/portrait.svg', width: '30%' } },
  ];

  for (const node of invalid) {
    expect(editor.commands.insertContent(node)).toBe(false);
    expect(editor.getJSON()).toEqual(original);
  }

  const clipboard = new DataTransfer();
  clipboard.setData('text/html', '<iframe src="assets/movie.webm"></iframe>');
  editor.view.dom.dispatchEvent(new ClipboardEvent('paste', {
    clipboardData: clipboard,
    bubbles: true,
    cancelable: true,
  }));
  expect(editor.getJSON()).toEqual(original);
  clipboard.setData('text/html', '<div data-type="unknownMedia"><img src="assets/portrait.svg"></div>');
  editor.view.dom.dispatchEvent(new ClipboardEvent('paste', {
    clipboardData: clipboard,
    bubbles: true,
    cancelable: true,
  }));
  expect(editor.getJSON()).toEqual(original);
  clipboard.setData('text/html', '<video src="assets/movie.webm"><source src="assets/movie.webm"></video>');
  editor.view.dom.dispatchEvent(new ClipboardEvent('paste', {
    clipboardData: clipboard,
    bubbles: true,
    cancelable: true,
  }));
  expect(editor.getJSON()).toEqual(original);
  await expect.element(page.getByRole('alert')).toHaveTextContent('дочерние');
});

test('clipboard media keeps a stable path and explicitly reports a missing asset in another project', async () => {
  fixture = await openMediaEditor({ type: 'doc', content: [{ type: 'paragraph' }] });
  const { editor } = fixture;
  editor.commands.focus('start');
  const clipboard = new DataTransfer();
  clipboard.setData('text/html', '<img src="assets/from-other-project.png" alt="Missing" data-book-width="null">');
  editor.view.dom.dispatchEvent(new ClipboardEvent('paste', {
    clipboardData: clipboard,
    bubbles: true,
    cancelable: true,
  }));
  expect(editor.getJSON().content?.some((node) => node.type === 'image')).toBe(true);
  await expect.element(page.getByRole('alert')).toHaveTextContent('from-other-project.png');
  await expect.element(page.getByRole('alert')).toHaveTextContent('недоступен');
  expect(editor.getHTML()).toContain('src="assets/from-other-project.png"');
});

test('StrictMode releases project URLs on disposal and ordinary attribute edits do not allocate new ones', async () => {
  const create = vi.spyOn(URL, 'createObjectURL');
  const revoke = vi.spyOn(URL, 'revokeObjectURL');
  fixture = await openMediaEditor(undefined, true);
  await expect.poll(() => {
    const element = document.querySelector('[data-editor-media="image"] img');

    return element instanceof HTMLImageElement && element.naturalWidth > 0;
  }).toBe(true);
  const image = document.querySelector('[data-editor-media="image"] img');

  if (!(image instanceof HTMLImageElement)) {
    throw new Error('Missing project image');
  }

  const url = image.src;
  expect(create).toHaveBeenCalledTimes(1);
  fixture.editor.commands.setNodeSelection(0);
  fixture.editor.commands.updateAttributes('image', { width: { value: 60, unit: '%' } });
  await expect.poll(() => image.style.getPropertyValue('--book-media-width')).toBe('60%');
  expect(create).toHaveBeenCalledTimes(1);
  const current = fixture;
  fixture = undefined;
  await current.dispose();
  expect(revoke).toHaveBeenCalledExactlyOnceWith(url);
});
