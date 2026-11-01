import type { BookPage } from '@active-book/book-builder/book';

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

          return (
            <li key={pageCur.id} data-page-id={pageCur.id}>
              <button disabled={disabled} aria-current={current} onClick={() => onSelect(pageCur.id)}>
                Страница {index + 1}
              </button>
              <button
                aria-label={`Переместить страницу ${index + 1} вверх`}
                disabled={disabled || index === 0}
                onClick={() => onMove(pageCur.id, -1)}
              >
                ↑
              </button>
              <button
                aria-label={`Переместить страницу ${index + 1} вниз`}
                disabled={disabled || index === pages.length - 1}
                onClick={() => onMove(pageCur.id, 1)}
              >
                ↓
              </button>
              <button
                aria-label={`Удалить страницу ${index + 1}`}
                disabled={disabled || pages.length === 1}
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
