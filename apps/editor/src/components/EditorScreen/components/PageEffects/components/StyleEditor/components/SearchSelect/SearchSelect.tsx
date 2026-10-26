import type {
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
} from 'react';

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

  const selectedOption = options.find((cur) => cur.value === value);

  const filteredOptions = options.filter((optionCur) => {
    const searchText = `${optionCur.label} ${optionCur.value}`.toLowerCase();
    const searchQuery = query.toLowerCase().trim();

    return searchText.includes(searchQuery);
  });

  const selectOption = (val: string) => {
    onChange(val);

    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');

      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();

      setIsOpen(true);

      const direction = e.key === 'ArrowDown' ? 1 : -1;

      setActiveIndex((index) => {
        const optionsCount = filteredOptions.length;
        const safeOptionsCount = Math.max(optionsCount, 1);
        const nextIndex = index + direction + optionsCount;

        return nextIndex % safeOptionsCount;
      });
    }

    const selectedOption = filteredOptions[activeIndex];

    if (
      e.key === 'Enter'
      && isOpen
      && selectedOption
    ) {
      e.preventDefault();

      selectOption(selectedOption.value);
    }
  };

  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleFocus = () => {
    setQuery('');
    setActiveIndex(0);
    setIsOpen(true);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setActiveIndex(0);
    setIsOpen(true);
  };

  return (
    <div className={styles.SearchSelect} onBlur={handleBlur}>
      <input
        type="search"
        maxLength={120}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={isOpen}
        aria-label={placeholder}
        placeholder={placeholder}
        value={isOpen ? query : selectedOption?.label ?? ''}
        autoComplete="off"

        onFocus={handleFocus}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />

      {isOpen && (
        <div id={listId} role="listbox" className={styles.SearchOptions}>
          {filteredOptions.length === 0 && (
            <span className={styles.EmptyOptions}>
              Ничего не найдено
            </span>
          )}

          {filteredOptions.map((optionCur, index) => {
            const { value: optionValue, label } = optionCur;

            const handleOptionMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
            };

            const handleOptionClick = () => {
              selectOption(optionValue);
            };

            const isSelected = value === optionValue;
            const isActive = index === activeIndex;

            return (
              <button
                key={optionValue}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-active={isActive}

                onMouseDown={handleOptionMouseDown}
                onClick={handleOptionClick}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
