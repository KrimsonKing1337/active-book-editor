import { cleanup, render } from '@testing-library/react';
import {
  afterEach,
  expect,
  test,
} from 'vitest';
import { userEvent } from 'vitest/browser';

import type { BookVideoAttributes } from '@active-book/types';

import { StoreProvider } from '@active-book/core/store';

import { ContentMedia } from '../ContentMedia';

let base: HTMLBaseElement | undefined;

afterEach(() => {
  cleanup();
  base?.remove();
});

const videoTree = (attrs: BookVideoAttributes, width = 400) => (
  <StoreProvider>
    <div style={{ width }}>
      <ContentMedia id="rerender-video" node={{ type: 'video', attrs }} />
    </div>
  </StoreProvider>
);

test('author layout updates preserve the actual Core Video node, manual pause and position', async () => {
  base = document.createElement('base');
  base.href = new URL('/tests/fixtures/multipage-book/', location.origin).href;
  document.head.prepend(base);
  const attrs: BookVideoAttributes = {
    src: 'assets/movie.webm',
    width: { value: 75, unit: '%' },
    height: { value: 180, unit: 'px' },
    controls: true,
    autoPlay: false,
    muted: true,
    loop: true,
  };
  const view = render(videoTree(attrs));
  const video = document.querySelector('video');

  if (!(video instanceof HTMLVideoElement)) {
    throw new Error('Missing Core Video');
  }

  await expect.poll(() => video.readyState >= 2).toBe(true);
  video.focus();
  await userEvent.keyboard(' ');
  await expect.poll(() => video.currentTime > 0.2 && !video.paused).toBe(true);
  await userEvent.keyboard(' ');
  await expect.poll(() => video.paused).toBe(true);
  const position = video.currentTime;
  view.rerender(videoTree({
    ...attrs,
    align: 'right',
    fit: 'cover',
  }, 300));
  expect(document.querySelector('video')).toBe(video);
  expect(video.paused).toBe(true);
  expect(video.currentTime).toBeCloseTo(position, 1);
  expect(getComputedStyle(video).objectFit).toBe('cover');
  expect(video.getBoundingClientRect().width).toBe(225);
  expect(video.controls).toBe(true);
});
