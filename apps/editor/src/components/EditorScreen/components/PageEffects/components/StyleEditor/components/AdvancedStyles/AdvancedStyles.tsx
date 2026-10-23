import type { CSSProperties } from 'react';
import type { NumericConfig } from '../NumericControl';

import { useEffect, useState } from 'react';

import { NumericControl, isValidNumericValue } from '../NumericControl';

import { SearchSelect } from '../SearchSelect';

import styles from '../../StyleEditor.module.scss';

type AdvancedProperty = 'opacity' | 'borderRadius' | 'objectFit' | 'objectPosition';

type AdvancedStylesProps = {
  style: CSSProperties;
  isMedia: boolean;
  onPreview: (style: CSSProperties) => void;
  onCommit: () => void;
};

type Draft = {
  id: string;
  property: AdvancedProperty | '';
  value: string;
};

const NUMERIC: Partial<Record<AdvancedProperty, NumericConfig>> = {
  opacity: {
    min: 0,
    max: 1,
    step: 0.01,
    unit: '',
    initial: '1',
  },
  borderRadius: {
    min: 0,
    max: 100,
    step: 1,
    unit: 'px',
    initial: '0',
  },
};

const PROPERTY_OPTIONS = [
  {
    value: 'opacity',
    label: 'opacity',
  },
  {
    value: 'borderRadius',
    label: 'border-radius',
  },
  {
    value: 'objectFit',
    label: 'object-fit',
  },
  {
    value: 'objectPosition',
    label: 'object-position',
  },
];

const FIT_OPTIONS = [
  {
    value: 'fill',
    label: 'fill',
  },
  {
    value: 'contain',
    label: 'contain',
  },
  {
    value: 'cover',
    label: 'cover',
  },
  {
    value: 'none',
    label: 'none',
  },
  {
    value: 'scale-down',
    label: 'scale-down',
  },
];

const X_OPTIONS = ['left', 'center', 'right'].map((cur) => ({
  value: cur,
  label: cur,
}));

const Y_OPTIONS = ['top', 'center', 'bottom'].map((cur) => ({
  value: cur,
  label: cur,
}));

const getDrafts = (style: CSSProperties): Draft[] => {
  return PROPERTY_OPTIONS
    .filter((cur) => style[cur.value as AdvancedProperty] !== undefined)
    .map((optionCur) => {
      const property = optionCur.value as AdvancedProperty;
      const text = String(style[property]);
      const config = NUMERIC[property];
      const value = config?.unit && text.endsWith(config.unit)
        ? text.slice(0, -config.unit.length) : text;

      return {
        id: property,
        property,
        value,
      };
    });
};

export const AdvancedStyles = ({ style, isMedia, onPreview, onCommit }: AdvancedStylesProps) => {
  const [drafts, setDrafts] = useState<Draft[]>(() => getDrafts(style));
  const [error, setError] = useState('');

  useEffect(() => {
    setDrafts(getDrafts(style));
  }, [style.opacity, style.borderRadius, style.objectFit, style.objectPosition]);

  const options = PROPERTY_OPTIONS.filter((optionCur) => {
    const mediaOnly = optionCur.value === 'objectFit' || optionCur.value === 'objectPosition';

    return isMedia || !mediaOnly;
  });

  const updateDraft = (id: string, changes: Partial<Draft>) => {
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

  const handleAddProperty = () => {
    const newDraft: Draft = {
      id: crypto.randomUUID(),
      property: '',
      value: '',
    };

    setDrafts((current) => [...current, newDraft]);
    setError('');
  };

  const handleApplyProperties = () => {
    const next: CSSProperties = { ...style };

    for (const optionCur of PROPERTY_OPTIONS) {
      delete next[optionCur.value as AdvancedProperty];
    }

    const seen = new Set<string>();

    for (const draftCur of drafts) {
      const { property, value: draftValue } = draftCur;
      const hasProperty = Boolean(property);
      const hasValue = Boolean(draftValue.trim());
      const isDuplicate = seen.has(property);

      if (!hasProperty || !hasValue || isDuplicate) {
        setError('Выбери уникальное свойство и его значение');

        return;
      }

      seen.add(property);

      const config = NUMERIC[property as AdvancedProperty];

      if (config && !isValidNumericValue(draftValue, config)) {
        setError(`Некорректное значение ${property}`);

        return;
      }

      const value = config ? `${draftValue.trim()}${config.unit}` : draftValue.trim();
      const cssName = property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

      if (!CSS.supports(cssName, value)) {
        setError(`Браузер не поддерживает ${cssName}: ${value}`);

        return;
      }

      next[property as AdvancedProperty] = value;
    }

    onPreview(next);
    onCommit();
    setError('');
  };

  return (
    <details className={styles.Advanced}>
      <summary>
        Дополнительные эффекты
      </summary>

      {drafts.map((draftCur) => {
        const { id, property, value } = draftCur;
        const config = property ? NUMERIC[property] : undefined;

        const positions = value.split(' ');
        const horizontalPosition = positions[0] ?? 'center';
        const verticalPosition = positions[1] ?? 'center';

        const handlePropertyChange = (val: string) => {
          const nextProperty = val as AdvancedProperty;
          const defaultValue = NUMERIC[nextProperty]?.initial
            ?? (nextProperty === 'objectFit' ? 'cover' : 'center center');

          const changes: Partial<Draft> = {
            property: nextProperty,
            value: defaultValue,
          };

          updateDraft(id, changes);
        };

        const handleValueChange = (val: string) => {
          updateDraft(id, { value: val });
        };

        const handleHorizontalChange = (val: string) => {
          updateDraft(id, { value: `${val} ${verticalPosition}` });
        };

        const handleVerticalChange = (val: string) => {
          updateDraft(id, { value: `${horizontalPosition} ${val}` });
        };

        const handleDelete = () => {
          setDrafts((current) => current.filter((cur) => cur.id !== id));
        };

        return (
          <div className={styles.AdvancedRow} key={id}>
            <SearchSelect
              value={property}
              options={options}
              placeholder="CSS-свойство"
              onChange={handlePropertyChange}
            />

            {config && (
              <NumericControl
                value={value}
                config={config}
                label={property}
                onChange={handleValueChange}
              />
            )}

            {property === 'objectFit' && (
              <SearchSelect
                value={value}
                options={FIT_OPTIONS}
                placeholder="Режим заполнения"
                onChange={handleValueChange}
              />
            )}

            {property === 'objectPosition' && (
              <div className={styles.PositionRow}>
                <SearchSelect
                  value={horizontalPosition}
                  options={X_OPTIONS}
                  placeholder="По горизонтали"
                  onChange={handleHorizontalChange}
                />

                <SearchSelect
                  value={verticalPosition}
                  options={Y_OPTIONS}
                  placeholder="По вертикали"
                  onChange={handleVerticalChange}
                />
              </div>
            )}

            <button type="button" onClick={handleDelete}>
              Удалить
            </button>
          </div>
        );
      })}

      <div className={styles.FilterActions}>
        <button type="button" onClick={handleAddProperty}>
          + Добавить свойство
        </button>
        <button type="button" onClick={handleApplyProperties}>
          Применить свойства
        </button>
      </div>

      {error && (
        <span className={styles.Error} role="alert">
          {error}
        </span>
      )}
    </details>
  );
};
