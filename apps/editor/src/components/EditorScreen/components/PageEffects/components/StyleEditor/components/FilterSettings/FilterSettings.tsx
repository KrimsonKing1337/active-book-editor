import type {
  FilterFunction,
  FilterOperation,
  FilterProperty,
} from '@active-book/book-builder/effects';
import type { NumericConfig } from '../NumericControl';

import { useEffect, useState } from 'react';

import { FILTER_FUNCTIONS, resolveStyle } from '@active-book/book-builder/effects';

import { NumericControl, isValidNumericValue } from '../NumericControl';

import { SearchSelect } from '../SearchSelect';

import styles from '../../StyleEditor.module.scss';

type FilterSettingsProps = {
  operations?: FilterOperation[];
  onApply: (operations: FilterOperation[]) => void;
};

type FilterDraft = {
  id: string;
  property: FilterProperty | '';
  function: FilterFunction | '';
  value: string;
};

const CONFIG: Record<FilterFunction, NumericConfig> = {
  blur: { min: 0, max: 50, step: 1, unit: 'px', initial: '0' },
  brightness: { min: 0, max: 300, step: 1, unit: '%', initial: '100' },
  contrast: { min: 0, max: 300, step: 1, unit: '%', initial: '100' },
  grayscale: { min: 0, max: 100, step: 1, unit: '%', initial: '0' },
  'hue-rotate': { min: -360, max: 360, step: 1, unit: 'deg', initial: '0' },
  invert: { min: 0, max: 100, step: 1, unit: '%', initial: '0' },
  opacity: { min: 0, max: 100, step: 1, unit: '%', initial: '100' },
  saturate: { min: 0, max: 300, step: 1, unit: '%', initial: '100' },
  sepia: { min: 0, max: 100, step: 1, unit: '%', initial: '0' },
};

const PROPERTY_OPTIONS = [
  { value: 'filter', label: 'filter' },
  { value: 'backdropFilter', label: 'backdrop-filter' },
];

const FUNCTION_OPTIONS = FILTER_FUNCTIONS.map((name) => ({ value: name, label: name }));

const getDrafts = (operations: FilterOperation[] | undefined): FilterDraft[] => {
  return (operations ?? []).map((operation) => {
    const config = CONFIG[operation.function];

    return {
      id: operation.id,
      property: operation.property,
      function: operation.function,
      value: operation.value.endsWith(config.unit)
        ? operation.value.slice(0, -config.unit.length) : operation.value,
    };
  });
};

export const FilterSettings = ({ operations, onApply }: FilterSettingsProps) => {
  const [drafts, setDrafts] = useState<FilterDraft[]>(() => getDrafts(operations));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setDrafts(getDrafts(operations));
  }, [operations]);

  const update = (id: string, changes: Partial<FilterDraft>) => {
    setDrafts((current) => current.map((draft) => {
      return draft.id === id ? { ...draft, ...changes } : draft;
    }));
    setError('');
  };

  const add = () => {
    const id = crypto.randomUUID();

    setDrafts((current) => [...current, { id, property: '', function: '', value: '' }]);
    setExpandedId(id);
    setError('');
  };

  const move = (index: number, offset: number) => {
    const nextIndex = index + offset;

    if (nextIndex < 0 || nextIndex >= drafts.length) {
      return;
    }

    const next = [...drafts];

    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];

    setDrafts(next);
    setError('');
  };

  const apply = () => {
    const next: FilterOperation[] = [];

    for (const draft of drafts) {
      if (!draft.property || !draft.function) {
        setError('Выбери свойство и функцию каждого фильтра');

        return;
      }

      const config = CONFIG[draft.function];
      const value = draft.value.trim();

      if (!isValidNumericValue(value, config)) {
        setError(`Некорректное значение для ${draft.function}`);

        return;
      }

      const result = `${draft.function}(${value}${config.unit})`;
      const property = draft.property === 'backdropFilter' ? 'backdrop-filter' : 'filter';

      if (!CSS.supports(property, result)) {
        setError(`Браузер не поддерживает ${result}`);

        return;
      }

      next.push({
        id: draft.id,
        property: draft.property,
        function: draft.function,
        value: `${value}${config.unit}`,
      });
    }

    const combined = resolveStyle({}, next);

    for (const property of PROPERTY_OPTIONS) {
      const cssValue = combined[property.value as FilterProperty];

      if (!cssValue) {
        continue;
      }

      const name = property.value === 'backdropFilter' ? 'backdrop-filter' : 'filter';

      if (!CSS.supports(name, String(cssValue))) {
        setError(`Некорректное составное значение ${property.label}`);

        return;
      }
    }

    onApply(next);
    setError('');
  };

  return (
    <details className={styles.Advanced}>
      <summary>Фильтры</summary>

      {drafts.map((draft, index) => {
        const config = draft.function ? CONFIG[draft.function] : null;
        const expanded = draft.id === expandedId;

        return (
          <div key={draft.id} className={styles.FilterRow}>
            <button
              type="button"
              className={styles.FilterSummary}
              aria-expanded={expanded}
              onClick={() => setExpandedId(expanded ? null : draft.id)}
            >
              <span>
                {draft.property ? (draft.property === 'backdropFilter' ? 'backdrop-filter' : 'filter') : 'Свойство'}
                {' → '}
                {draft.function || 'Функция'}
                {config ? `(${draft.value}${config.unit})` : ''}
              </span>
              <span>{expanded ? '▴' : '▾'}</span>
            </button>

            {expanded && (
              <div className={styles.FilterBody}>
                <SearchSelect
                  value={draft.property}
                  options={PROPERTY_OPTIONS}
                  placeholder="CSS-свойство"
                  onChange={(property) => update(draft.id, {
                    property: property as FilterProperty,
                    function: '',
                    value: '',
                  })}
                />

                {draft.property && (
                  <SearchSelect
                    value={draft.function}
                    options={FUNCTION_OPTIONS}
                    placeholder="Функция"
                    onChange={(name) => {
                      const functionName = name as FilterFunction;

                      update(draft.id, { function: functionName, value: CONFIG[functionName].initial });
                    }}
                  />
                )}

                {config && (
                  <NumericControl
                    label={`Значение ${draft.function}`}
                    config={config}
                    value={draft.value}
                    onChange={(value) => update(draft.id, { value })}
                  />
                )}

                <div className={styles.FilterActions}>
                  <button type="button" disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
                  <button type="button" disabled={index === drafts.length - 1} onClick={() => move(index, 1)}>↓</button>
                  <button type="button" onClick={() => {
                    setDrafts((current) => current.filter((item) => item.id !== draft.id));
                    setExpandedId(null);
                  }}>
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className={styles.FilterActions}>
        <button type="button" onClick={add}>+ Добавить фильтр</button>
        <button type="button" onClick={apply}>Применить фильтры</button>
      </div>

      {error && <span className={styles.Error} role="alert">{error}</span>}
    </details>
  );
};
