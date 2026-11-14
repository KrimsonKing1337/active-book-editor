import {
  afterEach,
  expect,
  test,
  vi,
} from 'vitest';

import { assertContentDocument } from '@active-book/book-builder/content';

import { openMediaEditor } from './fixture';

let fixture: Awaited<ReturnType<typeof openMediaEditor>>;

afterEach(async () => {
  await fixture?.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const readCarousel = () => {
  const document: unknown = fixture.editor.getJSON();
  assertContentDocument(document);
  const carousel = document.content[0];

  if (carousel.type !== 'carousel') {
    throw new Error('Expected carousel');
  }

  return carousel;
};

const drop = (position: number, html: string) => {
  const { editor } = fixture;
  const bounds = editor.view.coordsAtPos(position);
  const dataTransfer = new DataTransfer();
  dataTransfer.setData('text/html', html);
  editor.view.dom.dispatchEvent(new DragEvent('drop', {
    dataTransfer,
    clientX: bounds.left + 1,
    clientY: (bounds.top + bounds.bottom) / 2,
    bubbles: true,
    cancelable: true,
  }));
};

// Each test uses real ProseMirror clipboard/drop handlers, without replacing its fitting logic.
test('copies media to another slide through HTML/drop while retaining stable attributes', async () => {
  const sourceImage = { type: 'image', attrs: { src: 'assets/portrait.svg', alt: 'Source' } };
  const targetParagraph = { type: 'paragraph', content: [{ type: 'text', text: 'Target' }] };
  const first = { type: 'carouselSlide', content: [sourceImage] };
  const second = { type: 'carouselSlide', content: [targetParagraph] };
  fixture = await openMediaEditor({ type: 'doc', content: [{ type: 'carousel', content: [first, second] }] });
  const { editor } = fixture;
  const image = editor.state.doc.firstChild?.firstChild?.firstChild;
  expect(image?.type.name).toBe('image');
  editor.commands.selectCarouselSlide(0, 1);
  let target = 0;
  editor.state.doc.descendants((node, position) => {
    if (node.isTextblock && node.textContent === 'Target') {
      target = position + 1;
    }
  });
  drop(target, '<img src="assets/portrait.svg" alt="Source" data-book-width="null">');
  const slides = readCarousel().content;
  expect(slides?.[0]?.content?.filter((node) => node.type === 'image')).toHaveLength(1);
  expect(slides?.[1]?.content?.find((node) => node.type === 'image')?.attrs)
    .toMatchObject({ src: 'assets/portrait.svg', alt: 'Source' });
});

test('an internal media move within a slide preserves one atom and can be undone', async () => {
  const sourceImage = { type: 'image', attrs: {
    src: 'assets/portrait.svg',
    width: { value: 60, unit: 'px' },
  } };
  const targetParagraph = { type: 'paragraph', content: [{ type: 'text', text: 'Target text' }] };
  const slide = { type: 'carouselSlide', content: [sourceImage, targetParagraph] };
  fixture = await openMediaEditor({ type: 'doc', content: [{ type: 'carousel', content: [slide] }] });
  const { editor } = fixture;
  const original = editor.getJSON();
  let source = 0;
  let target = 0;
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === 'image') {
      source = position;
    } else if (node.isTextblock) {
      target = position + node.nodeSize - 1;
    }
  });
  editor.commands.setNodeSelection(source);
  editor.view.dragging = { slice: editor.state.selection.content(), move: true };
  const dom = editor.view.nodeDOM(source + 1);

  if (dom instanceof HTMLElement) {
    dom.scrollIntoView();
  }

  drop(target, '<img src="assets/portrait.svg" data-book-width=\'{"value":60,"unit":"px"}\'>');
  const content = readCarousel().content[0].content;
  expect(content?.filter((node) => node.type === 'image')).toHaveLength(1);
  expect(content?.at(-1)?.type).toBe('image');
  expect(content?.find((node) => node.type === 'image')?.attrs?.src).toBe('assets/portrait.svg');
  editor.commands.undo();
  expect(editor.getJSON()).toEqual(original);
});

test('raw file transfers report import commands without discarding content or navigating', async () => {
  fixture = await openMediaEditor();
  const { editor } = fixture;
  const original = editor.getJSON();
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(new File(['image'], 'image.png', { type: 'image/png' }));
  const event = new DragEvent('drop', {
    dataTransfer,
    bubbles: true,
    cancelable: true,
  });
  editor.view.dom.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(editor.getJSON()).toEqual(original);
  const paste = new ClipboardEvent('paste', {
    clipboardData: dataTransfer,
    bubbles: true,
    cancelable: true,
  });
  editor.view.dom.dispatchEvent(paste);
  expect(paste.defaultPrevented).toBe(true);
  expect(editor.getJSON()).toEqual(original);
});
