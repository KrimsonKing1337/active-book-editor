import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { reportContentError } from '../ContentValidation';

import { CarouselNodeView } from './CarouselNodeView';
import { changeSlides, selectSlide } from './commands';
import { carouselSelectionPlugin, isInsideSlide } from './state';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    carousel: {
      insertCarousel: () => ReturnType;
      selectCarouselSlide: (position: number, index: number) => ReturnType;
      changeCarouselSlides: (position: number, action: 'add' | 'delete' | 'left' | 'right') => ReturnType;
    };
  }
}

export const CarouselSlide = Node.create({
  name: 'carouselSlide',
  content: 'slideBlock+',
  defining: true,
  isolating: true,

  parseHTML: () => [{ tag: 'section[data-type="carouselSlide"]' }],
  renderHTML: () => ['section', { 'data-type': 'carouselSlide', role: 'group' }, 0],
});

export const CarouselNode = Node.create({
  name: 'carousel',
  group: 'block',
  content: 'carouselSlide+',
  defining: true,
  isolating: true,

  parseHTML: () => [{ tag: 'section[data-type="carousel"]' }],
  renderHTML: () => ['section', { 'data-type': 'carousel' }, 0],

  addNodeView: () => ReactNodeViewRenderer(CarouselNodeView),
  addProseMirrorPlugins: () => [carouselSelectionPlugin()],

  addCommands() {
    return {
      insertCarousel: () => (props) => {
        if (isInsideSlide(props.state)) {
          if (props.dispatch) {
            reportContentError(props.editor, new Error('Карусель нельзя вставить внутрь слайда'));
          }

          return false;
        }

        const slide = { type: 'carouselSlide', content: [{ type: 'paragraph' }] };

        return props.commands.insertContent({ type: this.name, content: [slide, slide] });
      },
      selectCarouselSlide: (position, index) => (props) => {
        return selectSlide(props, { position, index });
      },
      changeCarouselSlides: (position, action) => (props) => {
        return changeSlides(props, { position, action });
      },
    };
  },
});
