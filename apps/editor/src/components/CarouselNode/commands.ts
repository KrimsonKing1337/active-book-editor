import type { CommandProps } from '@tiptap/core';

import { Fragment } from '@tiptap/pm/model';
import { Selection } from '@tiptap/pm/state';
import { closeHistory } from '@tiptap/pm/history';

import {
  activeSlide,
  carouselKey,
  slidePosition,
} from './state';

type ChangeSlidesOptions = {
  position: number;
  action: 'add' | 'delete' | 'left' | 'right';
};

export const selectSlide = (props: CommandProps, options: { position: number; index: number }): boolean => {
  const { tr, dispatch } = props;
  const node = tr.doc.nodeAt(options.position);

  if (node?.type.name !== 'carousel' || options.index < 0 || options.index >= node.childCount) {
    return false;
  }

  if (dispatch) {
    const position = slidePosition(node, options);

    tr.setSelection(Selection.near(tr.doc.resolve(position + 1)));
  }

  return true;
};

export const changeSlides = (props: CommandProps, options: ChangeSlidesOptions): boolean => {
  const {
    tr,
    state,
    dispatch,
  } = props;
  const { position, action } = options;
  const node = tr.doc.nodeAt(position);

  if (node?.type.name !== 'carousel') {
    return false;
  }

  let index = activeSlide(state, position);
  const slides = [...node.content.content];

  if (action === 'add') {
    const emptySlide = state.schema.nodes.carouselSlide.createAndFill();

    if (!emptySlide) {
      return false;
    }

    index += 1;
    slides.splice(index, 0, emptySlide);
  } else if (action === 'delete') {
    if (slides.length === 1) {
      return false;
    }

    slides.splice(index, 1);
    index = Math.min(index, slides.length - 1);
  } else {
    let destination = index + 1;

    if (action === 'left') {
      destination = index - 1;
    }

    if (destination < 0 || destination >= slides.length) {
      return false;
    }

    const [slide] = slides.splice(index, 1);

    slides.splice(destination, 0, slide);
    index = destination;
  }

  if (dispatch) {
    closeHistory(tr);
    tr.setMeta(carouselKey, true);
    tr.replaceWith(position + 1, position + node.nodeSize - 1, Fragment.from(slides));
    const updated = tr.doc.nodeAt(position);

    if (updated) {
      const selectedPosition = slidePosition(updated, { position, index });

      tr.setSelection(Selection.near(tr.doc.resolve(selectedPosition + 1)));
    }

    tr.scrollIntoView();
  }

  return true;
};
