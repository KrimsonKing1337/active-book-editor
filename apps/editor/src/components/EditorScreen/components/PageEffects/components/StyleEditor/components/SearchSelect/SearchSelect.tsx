import type { KeyboardEvent } from 'react';

import { useId, useState } from 'react';

import styles from '../../StyleEditor.module.scss';

export type SearchSelectOption = {
  value: string;
  label: string;
};

type SearchSelectProps = {
  value: string;
  options: SearchSelectOption[];
  placeholder: string;
  onChange: (value: string) => void;
};

export const SearchSelect = ({ value, options, placeholder, onChange }: SearchSelectProps) => {
  const listId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) => {
    const text = `${option.label} ${option.value}`.toLowerCase();

    return text.includes(query.toLowerCase().trim());
  });

  const choose = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setQuery('');

      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);

      const direction = event.key === 'ArrowDown' ? 1 : -1;

      setActiveIndex((index) => {
        return (index + direction + filtered.length) % Math.max(filtered.length, 1);
      });
    }

    if (event.key === 'Enter' && isOpen && filtered[activeIndex]) {
      event.preventDefault();
      choose(filtered[activeIndex].value);
    }
  };

  return (
    <div
      className={styles.SearchSelect}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
          setQuery('');
        }
      }}
    >
      <input
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={isOpen}
        aria-label={placeholder}
        placeholder={placeholder}
        value={isOpen ? query : selected?.label ?? ''}
        autoComplete="off"
        onFocus={() => {
          setQuery('');
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />

      {isOpen && (
        <div id={listId} role="listbox" className={styles.SearchOptions}>
          {filtered.length === 0 && <span className={styles.EmptyOptions}>Ничего не найдено</span>}

          {filtered.map((option, index) => {
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={value === option.value}
                data-active={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
