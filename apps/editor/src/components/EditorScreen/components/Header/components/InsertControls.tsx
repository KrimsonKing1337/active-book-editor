import type { ReactNode } from 'react';

import type { TextBlock } from '../../../@types';

export type InsertControlsProps = {
  mediaTools: ReactNode;
  disabled: boolean;

  onInsertTextBlock: (block: TextBlock) => void;
  onInsertCarousel: () => void;
};

export const InsertControls = ({
  mediaTools,
  disabled,
  onInsertTextBlock,
  onInsertCarousel,
}: InsertControlsProps) => {
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onInsertTextBlock({ type: 'paragraph' })}
      >
        Добавить параграф
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onInsertTextBlock({ type: 'heading', attrs: { level: 1 } })}
      >
        Добавить заголовок 1
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onInsertTextBlock({ type: 'heading', attrs: { level: 2 } })}
      >
        Добавить заголовок 2
      </button>

      <button type="button" disabled={disabled} onClick={onInsertCarousel}>
        Добавить карусель
      </button>

      {mediaTools}
    </>
  );
};
