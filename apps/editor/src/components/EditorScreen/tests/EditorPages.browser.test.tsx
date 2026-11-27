import { StrictMode } from 'react';

import { cleanup, render } from '@testing-library/react';

import {
  afterEach,
  beforeEach,
  expect,
  test,
  vi,
} from 'vitest';

import { page, userEvent } from 'vitest/browser';

import { createProject, savedPageEffects } from '@root/tests/editor-effects/project';
import {
  addEffect,
  configureShadow,
  historyShortcut,
  selectEffect,
  setColor,
} from '@root/tests/editor-effects/controls';

import { LocalProjectStorage } from '@project/storage';

import { EditorScreen } from '../EditorScreen';

import '../../../../../../../active-book-common/styles/styles.scss';
import '@active-book/core/styles/styles.scss';
import '@styles/styles.scss';

let project: Awaited<ReturnType<typeof createProject>>;

type WriteParams = {
  directory: FileSystemDirectoryHandle;
  name: string;
  data: string | Blob;
};

const selectPage = async (number: number) => {
  await page.getByRole('button', {
    name: `Страница ${number}`,
    exact: true,
  }).click();
  await expect.element(page.getByRole('button', {
    name: `Страница ${number}`,
    exact: true,
  }))
    .toHaveAttribute('aria-current', 'page');
};
const editorText = () => page.getByRole('textbox', {
  name: 'Текст страницы',
  exact: true,
});
const typeText = async (text: string) => {
  await editorText().click();
  await userEvent.keyboard(text);
  await expect.element(editorText()).toHaveTextContent(text);
};
const saveBook = async () => {
  await page.getByRole('button', {
    name: 'Сохранить',
    exact: true,
  }).click();
  await expect.element(page.getByRole('button', {
    name: 'Сохранить',
    exact: true,
  })).toBeEnabled();
  await expect.element(page.getByText('Сохранено', { exact: true })).toBeVisible();

  return project.readDocument();
};

beforeEach(async () => {
  await page.viewport(1280, 900);
  project = await createProject({ empty: true });
  render(
    <StrictMode>
      <EditorScreen />
    </StrictMode>,
  );
  await expect.element(page.getByRole('button', {
    name: 'Сохранить',
    exact: true,
  })).toBeEnabled();
});

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  await project.dispose();
});

test('edits, reorders, saves and reopens three independent pages with isolated history', async () => {
  await expect.element(page.getByRole('button', {
    name: 'Удалить страницу 1',
    exact: true,
  })).toBeDisabled();
  await typeText('Первая история');
  await saveBook();
  const firstBook = await project.readDocument();
  const firstId = firstBook.pages[0].id;
  const root = document.querySelector('[data-story-region="story"]');
  await page.getByRole('button', {
    name: 'Добавить страницу',
    exact: true,
  }).click();
  const unload = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(unload);
  expect(unload.defaultPrevented).toBe(true);
  await expect.poll(async () => {
    try {
      return (await project.readDocument()).pages.length;
    } catch {
      return 0;
    }
  }, { timeout: 5000 }).toBe(2);

  await expect.element(editorText()).not.toHaveTextContent('Первая история');
  await typeText('Вторая история');
  await page.getByRole('button', {
    name: 'Добавить страницу',
    exact: true,
  }).click();
  await typeText('Третья история');
  await expect.element(page.getByText('3 из 3', { exact: true })).toBeVisible();
  expect(document.querySelector('[data-story-region="story"]')).toBe(root);
  const pageButtons = document.querySelectorAll<HTMLButtonElement>(
    'nav[aria-label="Страницы книги"] li > button:first-child',
  );
  for (const index of [
    1,
    0,
    2,
    1,
    2,
    0,
  ]) {
    pageButtons[index].click();
  }
  await selectPage(1);
  await expect.element(editorText()).toHaveTextContent('Первая история');
  await historyShortcut('undo');
  await expect.element(editorText()).toHaveTextContent('Первая история');
  await selectPage(2);
  await expect.element(editorText()).toHaveTextContent('Вторая история');
  await typeText(' дополнение');
  await historyShortcut('undo');
  await expect.element(editorText()).toHaveTextContent('Вторая история');
  await selectPage(3);
  await historyShortcut('redo');
  await expect.element(editorText()).toHaveTextContent('Третья история');
  const beforeMove = await saveBook();
  await page.getByRole('button', {
    name: 'Переместить страницу 3 вверх',
    exact: true,
  }).click();
  await expect.element(page.getByRole('button', {
    name: 'Страница 2',
    exact: true,
  }))
    .toHaveAttribute('aria-current', 'page');
  const moved = await saveBook();
  expect(moved.pages.map((cur) => cur.id)).toEqual([
    firstId,
    beforeMove.pages[2].id,
    beforeMove.pages[1].id,
  ]);
  expect(moved.pages[1]).toEqual(beforeMove.pages[2]);
  await page.getByRole('button', {
    name: 'Удалить страницу 2',
    exact: true,
  }).click();
  await expect.element(editorText()).toHaveTextContent('Вторая история');
  const deleted = await saveBook();
  expect(deleted.pages.map((cur) => cur.id)).toEqual([firstId, beforeMove.pages[1].id]);
  cleanup();
  render(
    <StrictMode>
      <EditorScreen />
    </StrictMode>,
  );
  await expect.element(page.getByRole('button', {
    name: 'Страница 2',
    exact: true,
  })).toBeVisible();
  await expect.element(editorText()).toHaveTextContent('Первая история');
  await selectPage(2);
  await expect.element(editorText()).toHaveTextContent('Вторая история');
  await page.getByRole('button', {
    name: 'Удалить страницу 1',
    exact: true,
  }).click();
  await expect.element(page.getByRole('button', {
    name: 'Удалить страницу 1',
    exact: true,
  })).toBeDisabled();
  await expect.element(page.getByText('1 из 1', { exact: true })).toBeVisible();
}, 60_000);

test('restoring a saved book does not mark the project dirty', async () => {
  await typeText('Сохранённая история');
  await saveBook();

  cleanup();

  render(
    <StrictMode>
      <EditorScreen />
    </StrictMode>,
  );

  await expect.element(editorText()).toHaveTextContent('Сохранённая история');

  const unload = new Event('beforeunload', { cancelable: true });

  window.dispatchEvent(unload);

  expect(unload.defaultPrevented).toBe(false);
});

test('page effects keep their settings and pending autosaves cannot overwrite later pages', async () => {
  await typeText('Красная страница');
  await saveBook();
  await addEffect('Frame');
  await configureShadow();
  await setColor('#ff0000ff');
  const firstEffects = await project.save();
  await page.getByRole('button', {
    name: 'Добавить страницу',
    exact: true,
  }).click();
  await typeText('Синяя страница');
  await addEffect('Frame');
  await configureShadow();
  await setColor('#0000ffff');
  const secondEffects = await project.save();
  const saved = await project.readDocument();
  expect(savedPageEffects(saved.pages[0].document).frame).toEqual(firstEffects.frame);
  const secondId = saved.pages[1].id;
  expect(savedPageEffects(saved.pages[0].document).frame?.[0].options.shadow?.style?.color).toBe('#ff0000ff');
  expect(savedPageEffects(saved.pages[1].document).frame?.[0].options.shadow?.style?.color).toBe('#0000ffff');
  expect(savedPageEffects(saved.pages[1].document).frame?.[0].id).not.toBe(firstEffects.frame?.[0].id);
  await selectPage(1);
  const frameId = firstEffects.frame?.[0].id;
  await expect.poll(() => document.querySelector(`[data-effect-id="${frameId}"]`)).not.toBeNull();
  await selectPage(2);
  await expect.poll(() => document.querySelector(`[data-effect-id="${frameId}"]`)).toBeNull();
  expect(secondEffects).toEqual(firstEffects); // helper reads page 1, which must remain unchanged
  const write = LocalProjectStorage.prototype.writeBook;
  let writes = 0;
  const writeSpy = vi.spyOn(LocalProjectStorage.prototype, 'writeBook').mockImplementation(async function (
    this: LocalProjectStorage,
    book,
  ) {
    writes += 1;
    if (writes === 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    await write.call(this, book);
  });
  await typeText(' автосохранение');
  await expect.poll(() => writeSpy.mock.calls.length, { timeout: 5000 }).toBeGreaterThan(0);
  await selectPage(1);
  await typeText(' финальная версия');
  await userEvent.keyboard('{Control>}s{/Control}');
  await expect.element(page.getByText('Сохранено', { exact: true })).toBeVisible();
  const result = await project.readDocument();
  expect(result.pages[1].id).toBe(secondId);
  expect(JSON.stringify(result.pages[1].document)).toContain('автосохранение');
  expect(JSON.stringify(result.pages[0].document)).toContain('финальная версия');
}, 60_000);

test('opens a complete book with page-owned media and a real custom TGZ, preserving positional ranges', async () => {
  const { default: fixture } = await import('@root/tests/fixtures/multipage-book/book.json');
  const { default: packageMeta } = await import('@root/tests/fixtures/multipage-book/package.json');
  const { default: archiveUrl } = await import(
    '@root/tests/fixtures/multipage-book/dependencies/fixture-parts.tgz?url'
  );
  const { default: soundUrl } = await import('@root/tests/fixtures/multipage-book/assets/tone.wav?url');

  const write = async ({
    directory,
    name,
    data,
  }: WriteParams) => {
    const handle = await directory.getFileHandle(name, { create: true });
    const stream = await handle.createWritable();
    await stream.write(data);
    await stream.close();
  };
  const bookWithRanges = fixture;
  await write({
    directory: project.directory,
    name: 'book.json',
    data: JSON.stringify(bookWithRanges),
  });
  await write({
    directory: project.directory,
    name: 'package.json',
    data: JSON.stringify(packageMeta),
  });
  const dependencies = await project.directory.getDirectoryHandle('dependencies', { create: true });
  const assets = await project.directory.getDirectoryHandle('assets', { create: true });
  await write({
    directory: dependencies,
    name: 'fixture-parts.tgz',
    data: await (await fetch(archiveUrl)).blob(),
  });
  await write({
    directory: assets,
    name: 'tone.wav',
    data: await (await fetch(soundUrl)).blob(),
  });
  const { default: movieUrl } = await import('@root/tests/fixtures/multipage-book/assets/movie.webm?url');
  const { default: imageUrl } = await import('@root/tests/fixtures/multipage-book/assets/range-pattern.svg?url');
  await write({
    directory: assets,
    name: 'movie.webm',
    data: await (await fetch(movieUrl)).blob(),
  });
  await write({
    directory: assets,
    name: 'range-pattern.svg',
    data: await (await fetch(imageUrl)).blob(),
  });
  await page.getByRole('button', {
    name: 'Открыть проект',
    exact: true,
  }).click();
  await expect.element(editorText()).toHaveTextContent('Альфа: первая страница');
  await expect.element(page.getByTestId('custom-badge')).toHaveAttribute('data-audio-alpha', 'true');
  await selectEffect('Звук');
  const settings = page.getByRole('dialog', { name: 'Эффекты страницы' });
  const audition = settings.getByRole('button', { name: 'Прослушать', exact: true });
  await expect.element(audition).toBeEnabled();
  await settings.getByRole('checkbox', { name: 'Зациклить только предпрослушивание' }).click();
  await audition.click();
  const stop = settings.getByRole('button', { name: 'Остановить', exact: true });
  await expect.element(stop).toBeEnabled();
  await stop.click();
  await expect.element(audition).toBeEnabled();
  await settings.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await page.getByTestId('custom-badge').click();
  await expect.element(page.getByTestId('custom-badge')).toHaveTextContent('Кастомная вставка: 1');
  await selectPage(2);
  await expect.element(editorText()).toHaveTextContent('Бета: вторая страница');
  await expect.element(page.getByTestId('custom-badge')).toHaveTextContent('Кастомная вставка: 0');
  await expect.element(page.getByTestId('custom-badge')).toHaveAttribute('data-audio-alpha', 'false');
  await expect.element(page.getByTestId('custom-badge')).toHaveAttribute('data-audio-beta', 'true');
  expect(document.querySelector('[data-effect-id="bg-alpha"]')).toBeNull();
  await expect.poll(() => document.querySelector('[data-effect-id="bg-beta"]')).not.toBeNull();
  await selectPage(3);
  await expect.element(editorText()).toHaveTextContent('Гамма: третья страница');
  await expect.poll(() => document.querySelector('[data-testid="custom-effect"]')).not.toBeNull();
  await expect.element(page.getByTestId('custom-badge')).toHaveAttribute('data-audio-beta', 'false');
  const beforeMove = await saveBook();
  await page.getByRole('button', {
    name: 'Переместить страницу 3 вверх',
    exact: true,
  }).click();
  const saved = await saveBook();
  expect(saved.pages.map((cur) => cur.id)).toEqual([
    'stable-alpha',
    'stable-gamma',
    'stable-beta',
  ]);
  expect(saved.visualEffects).toEqual(fixture.visualEffects);
  expect(saved.audioEffects).toEqual(fixture.audioEffects);
  expect(saved.pages[1].document.content).toEqual(fixture.pages[2].document.content);
  expect(saved.pages[1]).toEqual(beforeMove.pages[2]);
}, 60_000);

test('new project replaces the book with one fresh author page', async () => {
  await typeText('Несохранённая история');
  const previous = document.querySelector('nav[aria-label="Страницы книги"] li')?.getAttribute('data-page-id');
  await page.getByRole('button', {
    name: 'Новый проект',
    exact: true,
  }).click();
  expect(window.confirm).toHaveBeenCalled();
  await expect.element(editorText()).not.toHaveTextContent('Несохранённая история');
  await expect.element(page.getByRole('button', {
    name: 'Удалить страницу 1',
    exact: true,
  })).toBeDisabled();
  const next = await saveBook();
  expect(next.pages).toHaveLength(1);
  expect(next.pages[0].id).not.toBe(previous);
  expect(next.type).toBe('book');
});

test('switching projects during a real TGZ import disposes resources and isolates definitions', async () => {
  const { default: fixture } = await import('@root/tests/fixtures/multipage-book/book.json');
  const { default: packageMeta } = await import('@root/tests/fixtures/multipage-book/package.json');
  const { default: archiveUrl } = await import(
    '@root/tests/fixtures/multipage-book/dependencies/fixture-parts.tgz?url'
  );
  const write = async ({
    directory,
    name,
    data,
  }: WriteParams) => {
    const file = await directory.getFileHandle(name, { create: true });
    const stream = await file.createWritable();
    await stream.write(data);
    await stream.close();
  };
  await write({
    directory: project.directory,
    name: 'book.json',
    data: JSON.stringify(fixture),
  });
  await write({
    directory: project.directory,
    name: 'package.json',
    data: JSON.stringify(packageMeta),
  });
  const dependencies = await project.directory.getDirectoryHandle('dependencies', { create: true });
  await write({
    directory: dependencies,
    name: 'fixture-parts.tgz',
    data: await (await fetch(archiveUrl)).blob(),
  });
  let finishImport: () => void = () => {};
  vi.stubGlobal('__fixtureLibraryGate', new Promise<void>((resolve) => {
    finishImport = resolve;
  }));
  const createUrl = vi.spyOn(URL, 'createObjectURL');
  const revokeUrl = vi.spyOn(URL, 'revokeObjectURL');
  await page.getByRole('button', {
    name: 'Открыть проект',
    exact: true,
  }).click();
  await expect.element(editorText()).toHaveTextContent('Альфа: первая страница');
  await expect.poll(() => createUrl.mock.results.length).toBeGreaterThan(0);
  const oldRoot = document.querySelector('[data-story-region="story"]');
  const oldUrls = createUrl.mock.results.map((cur) => cur.value);
  await page.getByRole('button', {
    name: 'Новый проект',
    exact: true,
  }).click();
  await expect.element(editorText()).not.toHaveTextContent('Альфа: первая страница');
  expect(document.querySelector('[data-story-region="story"]')).not.toBe(oldRoot);
  finishImport();
  const allOldUrlsRevoked = () => oldUrls.every((url) => revokeUrl.mock.calls.some((cur) => cur[0] === url));
  await expect.poll(allOldUrlsRevoked).toBe(true);
  expect(document.querySelector('[data-testid="custom-badge"]')).toBeNull();
  expect(document.querySelector('[data-testid="native-visual"]')).toBeNull();
  expect(document.querySelector('[data-effect-id="bg-alpha"]')).toBeNull();
  await page.getByRole('button', {
    name: 'Открыть проект',
    exact: true,
  }).click();
  await expect.element(editorText()).toHaveTextContent('Альфа: первая страница');
  await expect.element(page.getByTestId('native-visual')).toHaveTextContent('0');
  expect(document.querySelector('[data-testid="custom-badge"]')).not.toBeNull();
}, 60_000);
