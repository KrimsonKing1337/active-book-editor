import type { Node } from '@tiptap/pm/model';
import type { EditorState, Transaction } from '@tiptap/pm/state';

import { Plugin, PluginKey } from '@tiptap/pm/state';
import { closeHistory } from '@tiptap/pm/history';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const carouselKey = new PluginKey<Map<number, number>>('carouselSelection');

export const slidePosition = (node: Node, options: { position: number; index: number }): number => {
  let position = options.position + 1;

  for (let index = 0; index < options.index; index += 1) {
    position += node.child(index).nodeSize;
  }

  return position;
};

export const activeSlide = (state: EditorState, position: number): number => {
  return carouselKey.getState(state)?.get(position) ?? 0;
};

export const isInsideSlide = (state: EditorState, position = state.selection.from): boolean => {
  const resolved = state.doc.resolve(position);

  for (let depth = resolved.depth; depth > 0; depth -= 1) {
    if (resolved.node(depth).type.name === 'carouselSlide') {
      return true;
    }
  }

  return false;
};

const followSelection = (slides: Map<number, number>, state: EditorState): Map<number, number> => {
  const { $from } = state.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === 'carousel') {
      slides.set($from.before(depth), $from.index(depth));
    }
  }

  return slides;
};

const mapSlides = (slides: Map<number, number>, transaction: Transaction): Map<number, number> => {
  const next = new Map<number, number>();

  for (const [position, index] of slides) {
    const mapped = transaction.mapping.mapResult(position);
    const node = transaction.doc.nodeAt(mapped.pos);

    if (!mapped.deleted && node?.type.name === 'carousel') {
      next.set(mapped.pos, Math.min(index, node.childCount - 1));
    }
  }

  return next;
};

export const carouselSelectionPlugin = () => new Plugin({
  key: carouselKey,
  appendTransaction: (...args) => {
    const [transactions, _oldState, state] = args;

    if (transactions.some((transaction) => transaction.getMeta(carouselKey))) {
      return closeHistory(state.tr);
    }
  },
  state: {
    init: (_config, state) => followSelection(new Map(), state),
    apply: (...args) => {
      const [transaction, slides, _oldState, state] = args;

      return followSelection(mapSlides(slides, transaction), state);
    },
  },
  props: {
    decorations(state) {
      const decorations: Decoration[] = [];

      state.doc.descendants((node, position) => {
        if (node.type.name !== 'carousel') {
          return;
        }

        const selected = activeSlide(state, position);

        node.forEach((...args) => {
          const [slide, offset, index] = args;
          const start = position + 1 + offset;
          const attrs: Record<string, string> = { 'aria-label': `Слайд ${index + 1}` };

          if (index !== selected) {
            attrs.hidden = 'hidden';
            attrs['aria-hidden'] = 'true';
          }

          decorations.push(Decoration.node(start, start + slide.nodeSize, attrs));
        });

        return false;
      });

      return DecorationSet.create(state.doc, decorations);
    },
  },
});
