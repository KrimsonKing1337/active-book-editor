import { type NodeConfig, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { MediaNodeView } from './components';
import { mediaAttributes } from './utils';

type RenderHTML = NonNullable<NodeConfig['renderHTML']>;

const imageAddAttributes = () => mediaAttributes('image');
const imageParseHtml = () => [{ tag: 'img[src]' }];

const imageRenderHtml: RenderHTML = ({ HTMLAttributes }) => {
  const htmlAttrs = { ...HTMLAttributes, 'data-type': 'image' };

  return ['img', htmlAttrs];
};

const imageAddNodeView = () => ReactNodeViewRenderer(MediaNodeView);

export const ImageNode = Node.create({
  name: 'image',
  group: 'block slideBlock',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes: imageAddAttributes,
  parseHTML: imageParseHtml,
  renderHTML: imageRenderHtml,
  addNodeView: imageAddNodeView,
});

const videoAddAttributes = () => mediaAttributes('video');
const videoParseHtml = () => [{ tag: 'video[src]' }];

const videoRenderHtml: RenderHTML = ({ HTMLAttributes }) => {
  const htmlAttrs = { ...HTMLAttributes, 'data-type': 'video' };

  return ['video', htmlAttrs];
};

export const VideoNode = ImageNode.extend({
  name: 'video',
  addAttributes: videoAddAttributes,
  parseHTML: videoParseHtml,
  renderHTML: videoRenderHtml,
});
