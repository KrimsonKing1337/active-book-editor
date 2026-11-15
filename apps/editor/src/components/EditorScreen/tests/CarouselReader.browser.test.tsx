import { cleanup, render } from '@testing-library/react';
import {
  afterEach,
  expect,
  test,
  vi,
} from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { renderNode } from '@book-runtime/utils/renderNode';

import { createBookRuntime } from '@root/packages/book-builder/src/components/custom/runtime';
import { compileBookDocument } from '@root/packages/book-builder/src/bookPreparation';

import { createProject } from '@root/tests/editor-effects/project';

import { createLocalProject, openLocalProject } from '@project/projectService';

import '../../../../../../../active-book-common/styles/styles.scss';
import '@active-book/core/styles/styles.scss';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('saves, opens, compiles and recursively renders slide blocks and components', async () => {
  const carousel = {
    type: 'carousel',
    content: [
      {
        type: 'carouselSlide',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [
              {
                type: 'text',
                text: 'Заголовок слайда',
                marks: [{ type: 'bold' }],
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Текст' },
              { type: 'hardBreak' },
              { type: 'text', text: 'Продолжение' },
            ],
          },
        ],
      },
      {
        type: 'carouselSlide',
        content: [{ type: 'coreComponent', attrs: { name: 'Button', package: 'test-parts' } }],
      },
    ],
  };
  const project = await createProject({ empty: true });

  try {
    await createLocalProject({
      type: 'book',
      pages: [{ id: 'carousel-page', document: { type: 'doc', content: [carousel] } }],
      visualEffects: [],
    });
    const opened = await openLocalProject();
    const built = compileBookDocument(opened.document);

    expect(built.pages[0].document.content).toEqual([carousel]);
    const click = vi.fn();
    const TestButton = () => (
      <button type="button" onClick={click}>
        Вложенная кнопка
      </button>
    );
    const node = built.pages[0].document.content?.[0];

    const { container } = render(
      <div style={{ width: 500 }}>
        {renderNode({
          node,
          key: 0,
          customComponents: { 'test-parts/Button': TestButton },
          bookRuntime: createBookRuntime('reader'),
        })}
      </div>,
    );

    await expect.element(page.getByRole('button', { name: 'Следующий слайд' })).toBeEnabled();
    expect(container.querySelector('strong')?.textContent).toBe('Заголовок слайда');
    expect(container.querySelector('br')).not.toBeNull();
    await expect.element(page.getByRole('button', { name: 'Предыдущий слайд' })).toBeDisabled();
    await expect.element(page.getByRole('button', { name: 'Вложенная кнопка' })).not.toBeInTheDocument();

    await page.getByRole('button', { name: 'Следующий слайд' }).click();
    await expect.element(page.getByRole('button', { name: 'Следующий слайд' })).toBeDisabled();
    await page.getByRole('button', { name: 'Вложенная кнопка' }).click();
    await userEvent.keyboard('{ArrowLeft}');
    expect(click).toHaveBeenCalledOnce();
    await expect.element(page.getByText('2 из 2', { exact: true })).toBeVisible();

    await page.getByRole('region', { name: 'Карусель' }).click({ position: { x: 2, y: 2 } });
    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(page.getByText('1 из 2', { exact: true })).toBeVisible();
    cleanup();

    render(renderNode({
      node: { type: 'carousel', content: [carousel.content[0]] },
      key: 0,
      customComponents: {},
      bookRuntime: createBookRuntime('reader'),
    }));
    await expect.element(page.getByText('1 из 1', { exact: true })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Предыдущий слайд' })).toBeDisabled();
    await expect.element(page.getByRole('button', { name: 'Следующий слайд' })).toBeDisabled();
  } finally {
    await project.dispose();
  }
});
