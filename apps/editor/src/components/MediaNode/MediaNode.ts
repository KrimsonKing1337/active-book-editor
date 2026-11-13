import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { mediaAttributes } from './attributes';
import { MediaNodeView } from './MediaNodeView';

export const ImageNode = Node.create({
  name: 'image',
  group: 'block slideBlock',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes: () => mediaAttributes('image'),
  parseHTML: () => [{ tag: 'img[src]' }],
  renderHTML: ({ HTMLAttributes }) => ['img', { ...HTMLAttributes, 'data-type': 'image' }],
  addNodeView: () => ReactNodeViewRenderer(MediaNodeView),
});

export const VideoNode = ImageNode.extend({
  name: 'video',
  addAttributes: () => mediaAttributes('video'),
  parseHTML: () => [{ tag: 'video[src]' }],
  renderHTML: ({ HTMLAttributes }) => ['video', { ...HTMLAttributes, 'data-type': 'video' }],
});
