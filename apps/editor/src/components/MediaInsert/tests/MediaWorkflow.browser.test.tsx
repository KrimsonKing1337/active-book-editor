import { cleanup, render } from '@testing-library/react';
import {
  afterEach,
  expect,
  test,
  vi,
} from 'vitest';
import { page, userEvent } from 'vitest/browser';

import movieUrl from '@root/tests/fixtures/multipage-book/assets/movie.webm?url';

import { createProject } from '@root/tests/editor-effects/project';

import { openLocalProject } from '@project/projectService';

import { EditorScreen } from '../../EditorScreen/EditorScreen';
import { imageMarkup } from '../../MediaNode/tests/fixture';

import '@active-book/common/styles';
import '@active-book/core/styles/styles.scss';
import '@styles/styles.scss';

let project: Awaited<ReturnType<typeof createProject>>;

afterEach(async () => {
  cleanup();
  await project?.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const save = async () => {
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect.element(page.getByText('Сохранено', { exact: true })).toBeVisible();

  return project.readDocument();
};

test('imports images, saves attributes and restores media after page/project changes', async () => {
  await page.viewport(1280, 900);
  project = await createProject({ empty: true });
  const imports = await project.directory.getDirectoryHandle('imports', { create: true });
  const image = await imports.getFileHandle('portrait.svg', { create: true });
  const writable = await image.createWritable();
  await writable.write(imageMarkup);
  await writable.close();
  let finishPick: (files: FileSystemFileHandle[]) => void = () => {};
  const pickerReady = new Promise<FileSystemFileHandle[]>((resolve) => {
    finishPick = resolve;
  });
  vi.stubGlobal('showOpenFilePicker', vi.fn(() => pickerReady));
  render(<EditorScreen />);
  await expect.element(page.getByRole('button', { name: 'Новый проект', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Новый проект', exact: true }).click();
  await save();
  await expect.element(page.getByRole('button', { name: 'Добавить изображение', exact: true })).toBeEnabled();
  await page.getByRole('textbox', { name: 'Текст страницы', exact: true }).fill('Before after');
  await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
  await page.getByRole('button', { name: 'Добавить изображение', exact: true }).click();
  await page.getByRole('button', { name: 'Показать структуру', exact: true }).click();
  await expect.element(page.getByRole('button', { name: 'Добавить изображение', exact: true })).toBeDisabled();
  finishPick([image]);
  await expect.poll(() => document.querySelector('[data-editor-media="image"] img')?.getAttribute('src'))
    .toMatch(/^blob:/u);
  const element = document.querySelector('[data-editor-media="image"] img');
  expect(element).not.toBeNull();
  const objectUrl = element?.getAttribute('src');
  await page.elementLocator(element!).click();
  await page.getByLabelText('Альтернативное описание').fill('Saved portrait');
  await page.getByLabelText('Ширина', { exact: true }).fill('60');
  await page.getByLabelText('Высота (пиксели)').fill('200');
  const first = await save();
  const media = first.pages[0].document.content?.find((node) => node.type === 'image');
  expect(media?.attrs).toMatchObject({
    src: 'assets/portrait.svg',
    alt: 'Saved portrait',
    width: { value: 60, unit: '%' },
    height: { value: 200, unit: 'px' },
  });
  expect(JSON.stringify(first)).not.toContain('blob:');
  const opened = await openLocalProject();
  expect(await (await opened.project.storage.getAssetFile('assets/portrait.svg')).text()).toBe(imageMarkup);
  await page.getByRole('button', { name: 'Добавить страницу', exact: true }).click();
  await expect.element(page.getByRole('img', { name: 'Saved portrait' })).not.toBeInTheDocument();
  await page.getByRole('button', { name: 'Страница 1', exact: true }).click();
  await expect.element(page.getByRole('img', { name: 'Saved portrait' })).toBeVisible();
  expect(page.getByRole('img', { name: 'Saved portrait' }).query()?.getAttribute('src')).toBe(objectUrl);
  await page.getByRole('button', { name: 'Открыть проект', exact: true }).click();
  await expect.element(page.getByRole('img', { name: 'Saved portrait' })).toBeVisible();
  await expect.poll(() => {
    const src = page.getByRole('img', { name: 'Saved portrait' }).query()?.getAttribute('src');

    return typeof src === 'string' && src !== objectUrl;
  }).toBe(true);
  expect((await project.readDocument()).pages[0].document.content).toContainEqual(media);
});

test('asset imports do not overwrite colliding names and reuse real handles already inside assets/', async () => {
  project = await createProject();
  const { project: opened } = await openLocalProject();
  const file = new File([imageMarkup], 'same.svg', { type: 'image/svg+xml' });
  const paths = await Promise.all([opened.storage.importAssetFile(file), opened.storage.importAssetFile(file)]);
  expect(paths).toEqual(['assets/same.svg', 'assets/same-1.svg']);
  const assets = await project.directory.getDirectoryHandle('assets');
  const existing = await assets.getFileHandle('same.svg');
  expect(await opened.storage.importAssetFile(await existing.getFile(), existing)).toBe('assets/same.svg');
  expect(await (await opened.storage.getAssetFile(paths[0])).text()).toBe(imageMarkup);
  expect(await (await opened.storage.getAssetFile(paths[1])).text()).toBe(imageMarkup);
});

test('imports video inside the selected slide, saves native attributes and never autoplays while editing', async () => {
  await page.viewport(1280, 900);
  project = await createProject({ empty: true });
  const imports = await project.directory.getDirectoryHandle('imports', { create: true });
  const handle = await imports.getFileHandle('movie.webm', { create: true });
  const writable = await handle.createWritable();
  await writable.write(await (await fetch(movieUrl)).blob());
  await writable.close();
  vi.stubGlobal('showOpenFilePicker', vi.fn(async () => [handle]));
  render(<EditorScreen />);
  await expect.element(page.getByRole('button', { name: 'Новый проект', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Новый проект', exact: true }).click();
  await save();
  const editorRoot = page.getByRole('textbox', { name: 'Текст страницы', exact: true }).element();
  const pageId = editorRoot.closest('[data-editor-page-id]')?.getAttribute('data-editor-page-id');

  await page.getByRole('button', { name: 'Добавить карусель', exact: true }).click();
  await page.getByRole('button', { name: 'Слайд 2', exact: true }).click();
  const paragraph = document.querySelector('[data-type="carouselSlide"]:not([hidden]) p');
  expect(paragraph).not.toBeNull();
  await page.elementLocator(paragraph!).click();
  await page.getByRole('button', { name: 'Добавить заголовок 2', exact: true }).click();
  await expect.element(page.elementLocator(editorRoot).getByRole('heading', { level: 2 })).toBeInTheDocument();
  await page.getByRole('button', { name: 'Добавить видео', exact: true }).click();
  await expect.poll(() => document.querySelector('[data-editor-media="video"] video')).not.toBeNull();
  const video = document.querySelector('[data-editor-media="video"] video');
  expect(video).toBeInstanceOf(HTMLVideoElement);
  await page.elementLocator(video!).click();
  await page.getByLabelText('Автовоспроизведение').click();
  await page.getByLabelText('Повторять').click();
  await page.getByLabelText('Постер (путь в assets/)').fill('assets/herb.svg');
  await page.getByLabelText('Высота (пиксели)').fill('180');
  const saved = await save();
  const carousel = saved.pages[0].document.content?.find((node) => node.type === 'carousel');
  const media = carousel?.content?.[1]?.content?.find((node) => node.type === 'video');
  expect(carousel?.content?.[0]?.content).toEqual([{ type: 'paragraph' }]);
  expect(media?.attrs).toMatchObject({
    src: 'assets/movie.webm',
    poster: 'assets/herb.svg',
    controls: true,
    autoPlay: true,
    muted: true,
    loop: true,
    height: { value: 180, unit: 'px' },
  });
  expect(JSON.stringify(saved)).not.toContain('blob:');
  expect(video instanceof HTMLVideoElement && video.paused && !video.autoplay && !video.controls).toBe(true);
  await page.getByRole('button', { name: 'Слайд 1', exact: true }).click();
  await page.getByRole('button', { name: 'Слайд 2', exact: true }).click();
  expect(document.querySelector('[data-editor-media="video"] video')).toBe(video);
  expect(video instanceof HTMLVideoElement && video.paused).toBe(true);
  expect(page.getByRole('textbox', { name: 'Текст страницы', exact: true }).element()).toBe(editorRoot);
  expect(editorRoot.closest('[data-editor-page-id]')?.getAttribute('data-editor-page-id')).toBe(pageId);
});
