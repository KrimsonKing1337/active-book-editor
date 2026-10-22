import { useState, type CSSProperties } from 'react';

import { HexAlphaColorPicker } from 'react-colorful';

import styles from './StyleEditor.module.scss';

type StyleEditorProps = {
  value: CSSProperties;
  onChange: (style: CSSProperties) => void;
};

const getHexColor = (value: string): string => {
  if (/^#[\da-f]{6}([\da-f]{2})?$/i.test(value)) {
    return value.length === 7 ? `${value}ff` : value;
  }

  const match = value.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\/\s]+([\d.]+))?\s*\)$/i);

  if (!match) {
    return '#000000ff';
  }

  const channels = match.slice(1, 4).map((channel) => {
    return Math.max(0, Math.min(255, Number(channel))).toString(16).padStart(2, '0');
  });

  const alpha = Math.round(Math.max(0, Math.min(1, Number(match[4] ?? 1))) * 255);
  const alphaHex = alpha.toString(16).padStart(2, '0');

  return `#${channels.join('')}${alphaHex}`;
};

export const StyleEditor = ({ value, onChange }: StyleEditorProps) => {
  const [newProperty, setNewProperty] = useState('');
  const [newValue, setNewValue] = useState('');

  const rules = Object.entries(value ?? {});

  const setProperty = (name: string, nextValue: string | number | undefined) => {
    const updated = { ...value } as Record<string, string | number | undefined>;

    if (nextValue === undefined || nextValue === '') {
      delete updated[name];
    } else {
      updated[name] = nextValue;
    }

    onChange(updated as CSSProperties);
  };

  const normalizePropertyName = (name: string) => {
    const trimmed = name.trim();

    if (trimmed.startsWith('--')) {
      return trimmed;
    }

    return trimmed.replace(/-([a-z])/g, (_full, letter: string) => letter.toUpperCase());
  };

  const renameProperty = (oldName: string, nextName: string) => {
    const normalizedName = normalizePropertyName(nextName);

    if (!normalizedName || normalizedName === oldName) {
      return;
    }

    const updated = { ...value } as Record<string, string | number | undefined>;
    const previousValue = updated[oldName];

    delete updated[oldName];
    updated[normalizedName] = previousValue;
    onChange(updated as CSSProperties);
  };

  const addProperty = () => {
    const name = normalizePropertyName(newProperty);

    if (!name) {
      return;
    }

    setProperty(name, newValue);
    setNewProperty('');
    setNewValue('');
  };

  const backgroundColor = String(value?.backgroundColor ?? '');
  const parsedBackgroundColor = getHexColor(backgroundColor);

  return (
    <div className={styles.StyleEditor}>
      <label className={styles.Field}>
        <span>Цвет фона (HEX, RGB, RGBA)</span>
        <input
          type="text"
          value={backgroundColor}
          onChange={(event) => setProperty('backgroundColor', event.target.value)}
          placeholder="#00000080"
        />
      </label>

      <HexAlphaColorPicker
        color={parsedBackgroundColor}
        onChange={(color) => setProperty('backgroundColor', color)}
      />

      <label className={styles.Field}>
        <span>Размытие (условные единицы)</span>
        <input
          type="number"
          min={0}
          step={1}
          value={String(value?.backdropFilter ?? '').match(/blur\(([\d.]+)px\)/)?.[1] ?? 0}
          onChange={(event) => {
            const blur = Number(event.target.value);

            if (Number.isFinite(blur) && blur >= 0) {
              setProperty('backdropFilter', blur ? `blur(${blur}px)` : undefined);
            }
          }}
        />
      </label>

      <details className={styles.Advanced}>
        <summary>Дополнительные CSS-свойства</summary>
        {rules.map(([property, ruleValue]) => {
          return (
            <div className={styles.Rule} key={property}>
              <input
                aria-label="Имя свойства"
                defaultValue={property}
                onBlur={(event) => renameProperty(property, event.target.value)}
              />
              <input
                aria-label="Значение свойства"
                value={String(ruleValue)}
                onChange={(event) => setProperty(property, event.target.value)}
              />
              <button type="button" aria-label="Удалить свойство" onClick={() => setProperty(property, undefined)}>
                ×
              </button>
            </div>
          );
        })}

        <div className={styles.Rule}>
          <input
            aria-label="Новое CSS-свойство"
            value={newProperty}
            placeholder="opacity"
            onChange={(event) => setNewProperty(event.target.value)}
          />
          <input
            aria-label="Значение нового свойства"
            value={newValue}
            placeholder="0.8"
            onChange={(event) => setNewValue(event.target.value)}
          />
          <button type="button" onClick={addProperty}>+</button>
        </div>
      </details>
    </div>
  );
};
