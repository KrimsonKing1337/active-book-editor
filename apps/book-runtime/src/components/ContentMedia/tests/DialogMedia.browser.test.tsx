import { useState } from 'react';

import { cleanup, render } from '@testing-library/react';
import {
  afterEach,
  expect,
  test,
} from 'vitest';
import { page } from 'vitest/browser';

import type {
  BookCarouselNode,
  BookCarouselSlideNode,
  BookDialogMode,
  BookImageNode,
  BookParagraphNode,
} from '@active-book/types';

import { StoreProvider } from '@active-book/core/store';

import { BookApplicationSurface } from '@active-book/core/components/BookApplicationSurface';
import { Carousel } from '@active-book/core/components/Carousel';
import { StoryDialog, getDialogMode } from '@active-book/core/components/StoryDialog';

import { createBookRuntime } from '@active-book/book-builder/components/custom/runtime';

import { renderNode } from '../../../utils/renderNode';

const imageNode: BookImageNode = { type: 'image', attrs: {
  src: 'assets/range-pattern.svg',
  alt: 'Authored image',
  width: { value: 50, unit: 'px' },
  height: { value: 40, unit: 'px' },
  fit: 'cover',
} };
const textNode: BookParagraphNode = { type: 'paragraph', content: [{ type: 'text', text: 'Default text' }] };
const imageSlide: BookCarouselSlideNode = { type: 'carouselSlide', content: [imageNode] };
const textSlide: BookCarouselSlideNode = { type: 'carouselSlide', content: [textNode] };
const model: BookCarouselNode = { type: 'carousel', content: [imageSlide, textSlide] };

const Fixture = () => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<BookDialogMode>(getDialogMode([model]));
  const slides = model.content.map((node, key) => renderNode({
    node,
    key,
    customComponents: {},
    bookRuntime: createBookRuntime('reader'),
  }));

  return (
    <StoreProvider>
      <BookApplicationSurface style={{ width: 540, height: 430 }}>
        <div
          ref={setContainer}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          <StoryDialog
            isOpen
            container={container}
            title="Typed media compatibility"
            mode={mode}
            onOpenChange={() => {}}
          >
            <Carousel layout="fill" slides={slides} onSelect={(index) => setMode(getDialogMode([model], index))} />
          </StoryDialog>
        </div>
      </BookApplicationSurface>
    </StoreProvider>
  );
};

let base: HTMLBaseElement;

afterEach(() => {
  base?.remove();
  cleanup();
  localStorage.clear();
});

test('typed media uses dialog preferences without overwriting author dimensions', async () => {
  base = document.createElement('base');
  base.href = new URL('/tests/fixtures/multipage-book/', location.origin).href;
  document.head.prepend(base);
  const saved = JSON.stringify(model);
  render(<Fixture />);
  const image = document.querySelector('img[alt="Authored image"]');

  if (!(image instanceof HTMLImageElement)) {
    throw new Error('Missing authored image');
  }

  expect(getComputedStyle(image).objectFit).toBe('contain');
  expect(image.getBoundingClientRect().width).toBeGreaterThan(50);
  expect(image.getBoundingClientRect().height).toBeGreaterThan(40);
  await page.getByRole('button', { name: 'Заполнить область' }).click();
  expect(getComputedStyle(image).objectFit).toBe('cover');
  await page.getByRole('button', { name: 'Следующий слайд' }).click();
  await expect.element(page.getByText('Default text')).toBeVisible();
  await expect.element(page.getByRole('button', { name: 'Заполнить область' })).not.toBeInTheDocument();
  expect(JSON.stringify(model)).toBe(saved);
});
