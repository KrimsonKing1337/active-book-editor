import type { NodeViewProps } from '@tiptap/react';

import {
  NodeViewContent,
  NodeViewWrapper,
  useEditorState,
} from '@tiptap/react';

import { activeSlide } from './state';

import styles from './CarouselNode.module.scss';

export const CarouselNodeView = ({
  node,
  editor,
  getPos,
}: NodeViewProps) => {
  const index = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const position = getPos();

      if (position === undefined) {
        return 0;
      }

      return activeSlide(current.state, position);
    },
  });

  const select = (slide: number) => {
    const position = getPos();

    if (position !== undefined) {
      editor.commands.selectCarouselSlide(position, slide);
      editor.commands.focus();
    }
  };

  const change = (action: 'add' | 'delete' | 'left' | 'right') => {
    const position = getPos();

    if (position !== undefined) {
      editor.commands.changeCarouselSlides(position, action);
      editor.commands.focus();
    }
  };

  const selectCarousel = () => {
    const position = getPos();

    if (position !== undefined) {
      editor.commands.setNodeSelection(position);
      editor.commands.focus();
    }
  };

  const slides = Array.from({ length: node.childCount }, (_unused, slide) => slide);

  return (
    <NodeViewWrapper className={styles.Carousel} data-editor-carousel>
      <div className={styles.Controls} contentEditable={false}>
        <button type="button" onClick={selectCarousel}>
          Выделить карусель
        </button>

        {slides.map((slide) => {
          const label = `Слайд ${slide + 1}`;

          return (
            <button
              key={slide}
              type="button"
              aria-pressed={index === slide}
              onClick={() => select(slide)}
            >
              {label}
            </button>
          );
        })}

        <button type="button" onClick={() => change('add')}>
          Добавить слайд
        </button>

        <button type="button" disabled={node.childCount === 1} onClick={() => change('delete')}>
          Удалить слайд
        </button>

        <button type="button" disabled={index === 0} onClick={() => change('left')}>
          Переместить слайд влево
        </button>

        <button type="button" disabled={index === node.childCount - 1} onClick={() => change('right')}>
          Переместить слайд вправо
        </button>
      </div>

      <NodeViewContent className={styles.Content} />
    </NodeViewWrapper>
  );
};
