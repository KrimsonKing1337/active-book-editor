import type {
  FilterFunction,
  FilterOperation,
  FilterProperty,
} from '@active-book/book-builder/effects';

import { useEffect, useState } from 'react';

import { resolveStyle } from '@active-book/book-builder/effects';

import { Button } from '../../../EffectControls';

import { NumericControl, isValidNumericValue } from '../NumericControl';
import { SearchSelect } from '../SearchSelect';

import { CONFIG, PROPERTY_OPTIONS, FUNCTION_OPTIONS } from './constants';

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

const getDrafts = (operations: FilterOperation[] | undefined): FilterDraft[] => {
  const operationsSafe = operations ?? [];

  return operationsSafe.map((operationCur) => {
    const config = CONFIG[operationCur.function];

    const rawValue = operationCur.value;
    const unit = config.unit;

    const hasUnitSuffix = unit.length > 0 && rawValue.endsWith(unit);

    let value = rawValue;

    if (hasUnitSuffix) {
      value = rawValue.slice(0, -unit.length);
    }

    return {
      id: operationCur.id,
      property: operationCur.property,
      function: operationCur.function,
      value,
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

  const updateDraft = (id: string, changes: Partial<FilterDraft>) => {
    setDrafts((current) => {
      return current.map((draftCur) => {
        if (draftCur.id !== id) {
          return draftCur;
        }

        return {
          ...draftCur,
          ...changes,
        };
      });
    });

    setError('');
  };

  const handleAddFilter = () => {
    const id = crypto.randomUUID();

    const newDraft: FilterDraft = {
      id,
      property: '',
      function: '',
      value: '',
    };

    setDrafts((current) => [...current, newDraft]);
    setExpandedId(id);
    setError('');
  };

  const moveFilter = (index: number, offset: number) => {
    const nextIndex = index + offset;

    if (nextIndex < 0 || nextIndex >= drafts.length) {
      return;
    }

    const next = [...drafts];

    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];

    setDrafts(next);
    setError('');
  };

  const handleApplyFilters = () => {
    const next: FilterOperation[] = [];

    for (const draftCur of drafts) {
      if (!draftCur.property || !draftCur.function) {
        setError('Выбери свойство и функцию каждого фильтра');

        return;
      }

      const config = CONFIG[draftCur.function];
      const value = draftCur.value.trim();

      if (!isValidNumericValue(value, config)) {
        setError(`Некорректное значение для ${draftCur.function}`);

        return;
      }

      const filterValue = `${draftCur.function}(${value}${config.unit})`;
      const property = draftCur.property === 'backdropFilter' ? 'backdrop-filter' : 'filter';

      if (!CSS.supports(property, filterValue)) {
        setError(`Браузер не поддерживает ${filterValue}`);

        return;
      }

      next.push({
        id: draftCur.id,
        property: draftCur.property,
        function: draftCur.function,
        value: `${value}${config.unit}`,
      });
    }

    const combined = resolveStyle({}, next);

    for (const propertyCur of PROPERTY_OPTIONS) {
      const cssValue = combined[propertyCur.value as FilterProperty];

      if (!cssValue) {
        continue;
      }

      const name = propertyCur.value === 'backdropFilter' ? 'backdrop-filter' : 'filter';

      if (!CSS.supports(name, String(cssValue))) {
        setError(`Некорректное составное значение ${propertyCur.label}`);

        return;
      }
    }

    onApply(next);

    setError('');
  };

  return (
    <details className={styles.Advanced}>
      <summary>
        Фильтры
      </summary>

      {drafts.map((draftCur, index) => {
        const { id, property, function: functionName, value } = draftCur;

        const config = functionName ? CONFIG[functionName] : null;
        const expanded = id === expandedId;

        const propertyLabel = property === 'backdropFilter' ? 'backdrop-filter' : 'filter';
        const displayedProperty = property ? propertyLabel : 'Свойство';
        const displayedFunction = functionName || 'Функция';
        const displayedValue = config ? `(${value}${config.unit})` : '';
        const expandedIndicator = expanded ? '▴' : '▾';
        const valueLabel = `Значение ${functionName}`;

        const handleToggle = () => {
          setExpandedId(expanded ? null : id);
        };

        const handlePropertyChange = (val: string) => {
          const changes: Partial<FilterDraft> = {
            property: val as FilterProperty,
            function: '',
            value: '',
          };

          updateDraft(id, changes);
        };

        const handleFunctionChange = (val: string) => {
          const nextFunction = val as FilterFunction;

          const changes: Partial<FilterDraft> = {
            function: nextFunction,
            value: CONFIG[nextFunction].initial,
          };

          updateDraft(id, changes);
        };

        const handleValueChange = (val: string) => {
          updateDraft(id, { value: val });
        };

        const handleMoveUp = () => {
          moveFilter(index, -1);
        };

        const handleMoveDown = () => {
          moveFilter(index, 1);
        };

        const handleDelete = () => {
          setDrafts((current) => {
            return current.filter((cur) => cur.id !== id);
          });

          setExpandedId(null);
        };

        return (
          <div key={id} className={styles.FilterRow}>
            <Button
              type="button"
              className={styles.FilterSummary}
              aria-expanded={expanded}
              onClick={handleToggle}
            >
              <span>
                {displayedProperty} → {displayedFunction}{displayedValue}
              </span>

              <span>
                {expandedIndicator}
              </span>
            </Button>

            {expanded && (
              <div className={styles.FilterBody}>
                <SearchSelect
                  value={property}
                  options={PROPERTY_OPTIONS}
                  placeholder="CSS-свойство"
                  onChange={handlePropertyChange}
                />

                {property && (
                  <SearchSelect
                    value={functionName}
                    options={FUNCTION_OPTIONS}
                    placeholder="Функция"
                    onChange={handleFunctionChange}
                  />
                )}

                {config && (
                  <NumericControl
                    label={valueLabel}
                    config={config}
                    value={value}
                    onChange={handleValueChange}
                  />
                )}

                <div className={styles.FilterActions}>
                  <Button type="button" disabled={index === 0} onClick={handleMoveUp}>
                    ↑
                  </Button>

                  <Button type="button" disabled={index === drafts.length - 1} onClick={handleMoveDown}>
                    ↓
                  </Button>

                  <Button type="button" onClick={handleDelete}>
                    Удалить
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className={styles.FilterActions}>
        <Button type="button" onClick={handleAddFilter}>
          + Добавить фильтр
        </Button>

        <Button type="button" onClick={handleApplyFilters}>
          Применить фильтры
        </Button>
      </div>

      {error && (
        <span className={styles.Error} role="alert">
          {error}
        </span>
      )}
    </details>
  );
};
