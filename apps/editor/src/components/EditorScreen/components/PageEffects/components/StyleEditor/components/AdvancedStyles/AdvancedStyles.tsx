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
  opacity: { min: 0, max: 1, step: 0.01, unit: '', initial: '1' },
  borderRadius: { min: 0, max: 100, step: 1, unit: 'px', initial: '0' },
};

const PROPERTY_OPTIONS = [
  { value: 'opacity', label: 'opacity' },
  { value: 'borderRadius', label: 'border-radius' },
  { value: 'objectFit', label: 'object-fit' },
  { value: 'objectPosition', label: 'object-position' },
];

const FIT_OPTIONS = [
  { value: 'fill', label: 'fill' },
  { value: 'contain', label: 'contain' },
  { value: 'cover', label: 'cover' },
  { value: 'none', label: 'none' },
  { value: 'scale-down', label: 'scale-down' },
];

const X_OPTIONS = ['left', 'center', 'right'].map((value) => ({ value, label: value }));
const Y_OPTIONS = ['top', 'center', 'bottom'].map((value) => ({ value, label: value }));

const getDrafts = (style: CSSProperties): Draft[] => {
  return PROPERTY_OPTIONS
    .filter((option) => style[option.value as AdvancedProperty] !== undefined)
    .map((option) => {
      const property = option.value as AdvancedProperty;
      const text = String(style[property]);
      const config = NUMERIC[property];
      const value = config?.unit && text.endsWith(config.unit)
        ? text.slice(0, -config.unit.length) : text;

      return { id: property, property, value };
    });
};

export const AdvancedStyles = ({ style, isMedia, onPreview, onCommit }: AdvancedStylesProps) => {
  const [drafts, setDrafts] = useState<Draft[]>(() => getDrafts(style));
  const [error, setError] = useState('');

  useEffect(() => {
    setDrafts(getDrafts(style));
  }, [style.opacity, style.borderRadius, style.objectFit, style.objectPosition]);

  const options = PROPERTY_OPTIONS.filter((option) => {
    return isMedia || (option.value !== 'objectFit' && option.value !== 'objectPosition');
  });

  const update = (id: string, changes: Partial<Draft>) => {
    setDrafts((current) => current.map((draft) => (
      draft.id === id ? { ...draft, ...changes } : draft
    )));
    setError('');
  };

  const add = () => {
    setDrafts((current) => [...current, { id: crypto.randomUUID(), property: '', value: '' }]);
    setError('');
  };

  const apply = () => {
    const next: CSSProperties = { ...style };

    for (const { value } of PROPERTY_OPTIONS) {
      delete next[value as AdvancedProperty];
    }

    const seen = new Set<string>();

    for (const draft of drafts) {
      if (!draft.property || !draft.value.trim() || seen.has(draft.property)) {
        setError('Выбери уникальное свойство и его значение');

        return;
      }

      seen.add(draft.property);

      const config = NUMERIC[draft.property];

      if (config && !isValidNumericValue(draft.value, config)) {
        setError(`Некорректное значение ${draft.property}`);

        return;
      }

      const value = config ? `${draft.value.trim()}${config.unit}` : draft.value.trim();
      const cssName = draft.property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

      if (!CSS.supports(cssName, value)) {
        setError(`Браузер не поддерживает ${cssName}: ${value}`);

        return;
      }

      next[draft.property] = value;
    }

    onPreview(next);
    onCommit();
    setError('');
  };

  return (
    <details className={styles.Advanced}>
      <summary>Дополнительные эффекты</summary>

      {drafts.map((draft) => {
        const config = draft.property ? NUMERIC[draft.property] : undefined;
        const positions = draft.value.split(' ');

        return (
          <div className={styles.AdvancedRow} key={draft.id}>
            <SearchSelect
              value={draft.property}
              options={options}
              placeholder="CSS-свойство"
              onChange={(property) => {
                const next = property as AdvancedProperty;
                const value = NUMERIC[next]?.initial
                  ?? (next === 'objectFit' ? 'cover' : 'center center');

                update(draft.id, { property: next, value });
              }}
            />

            {config && (
              <NumericControl
                value={draft.value}
                config={config}
                label={draft.property}
                onChange={(value) => update(draft.id, { value })}
              />
            )}

            {draft.property === 'objectFit' && (
              <SearchSelect
                value={draft.value}
                options={FIT_OPTIONS}
                placeholder="Режим заполнения"
                onChange={(value) => update(draft.id, { value })}
              />
            )}

            {draft.property === 'objectPosition' && (
              <div className={styles.PositionRow}>
                <SearchSelect
                  value={positions[0] ?? 'center'}
                  options={X_OPTIONS}
                  placeholder="По горизонтали"
                  onChange={(value) => update(draft.id, { value: `${value} ${positions[1] ?? 'center'}` })}
                />
                <SearchSelect
                  value={positions[1] ?? 'center'}
                  options={Y_OPTIONS}
                  placeholder="По вертикали"
                  onChange={(value) => update(draft.id, { value: `${positions[0] ?? 'center'} ${value}` })}
                />
              </div>
            )}

            <button type="button" onClick={() => {
              setDrafts((current) => current.filter((item) => item.id !== draft.id));
            }}>
              Удалить
            </button>
          </div>
        );
      })}

      <div className={styles.FilterActions}>
        <button type="button" onClick={add}>+ Добавить свойство</button>
        <button type="button" onClick={apply}>Применить свойства</button>
      </div>

      {error && <span className={styles.Error} role="alert">{error}</span>}
    </details>
  );
};
