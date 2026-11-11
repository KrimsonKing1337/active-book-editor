import type { BookPage } from '@root/packages/book-builder/src/book/book';

import styles from './Pages.module.scss';

type PagesProps = {
  pages: BookPage[];
  activeId: string;
  disabled: boolean;

  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
};

export const Pages = ({
  pages,
  activeId,
  disabled,
  onSelect,
  onAdd,
  onDelete,
  onMove,
}: PagesProps) => {
  return (
    <nav className={styles.Pages} aria-label="Страницы книги">
      <ol>
        {pages.map((pageCur, index) => {
          const isActive = pageCur.id === activeId;
          const current = isActive ? 'page' : undefined;

          const pageNumber = index + 1;

          const buttonUpIsDisabled = disabled || index === 0;
          const buttonDownIsDisabled = disabled || index === pages.length - 1;
          const buttonDeleteIsDisabled = disabled || pages.length === 1;

          return (
            <li key={pageCur.id} data-page-id={pageCur.id}>
              <button
                aria-current={current}
                disabled={disabled}
                onClick={() => onSelect(pageCur.id)}
              >
                Страница {pageNumber}
              </button>

              <button
                aria-label={`Переместить страницу ${pageNumber} вверх`}
                disabled={buttonUpIsDisabled}
                onClick={() => onMove(pageCur.id, -1)}
              >
                ↑
              </button>

              <button
                aria-label={`Переместить страницу ${pageNumber} вниз`}
                disabled={buttonDownIsDisabled}
                onClick={() => onMove(pageCur.id, 1)}
              >
                ↓
              </button>

              <button
                aria-label={`Удалить страницу ${pageNumber}`}
                disabled={buttonDeleteIsDisabled}
                onClick={() => onDelete(pageCur.id)}
              >
                Удалить
              </button>
            </li>
          );
        })}
      </ol>

      <button disabled={disabled} onClick={onAdd}>
        Добавить страницу
      </button>
    </nav>
  );
};
