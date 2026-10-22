import { type CSSProperties, useState } from 'react';

import { HexAlphaColorPicker } from 'react-colorful';

import styles from './StyleEditor.module.scss';

type StyleEditorProps = {
  value: CSSProperties;
  onChange: (style: CSSProperties) => void;
};

type UpdatedValue = Record<string, string | number | undefined>;

const getHexColor = (value: string): string => {
  /*
 * Проверяем, что строка содержит цвет в формате HEX:
 * #RRGGBB или #RRGGBBAA.
 *
 * ^ — начало строки
 * # — обязательный символ #
 * [\da-f] — шестнадцатеричная цифра (0–9 или a–f)
 * {6} — ровно 6 символов (RRGGBB)
 * ([\da-f]{2})? — необязательные 2 символа прозрачности (AA)
 * $ — конец строки
 * i — регистронезависимый поиск (a–f и A–F)
 */
  if (/^#[\da-f]{6}([\da-f]{2})?$/i.test(value)) {
    return value.length === 7 ? `${value}ff` : value;
  }

  /*
 * Разбираем цвет в формате rgb(...) или rgba(...).
 *
 * ^rgba?  — строка начинается с rgb или rgba (a необязательна)
 * \( — открывающая круглая скобка
 * \s* — любое количество пробельных символов
 * (\d+) — первая группа: красный канал
 * [,\s]+ — один или несколько разделителей (запятая/пробел)
 * (\d+) — вторая группа: зелёный канал
 * [,\s]+ — разделитель
 * (\d+) — третья группа: синий канал
 *
 * (?: ... )? — необязательная группа для альфа-канала
 * [,\/\s]+ — разделитель: запятая, / или пробел
 * (\d+(?:\.\d*)?|\.\d+) — четвёртая группа: прозрачность (число с точкой)
 *
 * \s* — необязательные пробелы перед закрывающей скобкой
 * \) — закрывающая круглая скобка
 * $ — конец строки
 * i — регистронезависимый поиск
 */
  const match = value.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\/\s]+([\d.]+))?\s*\)$/i);

  if (!match) {
    return '#000000ff';
  }

  const rgbChannels = match.slice(1, 4);

  const channels = rgbChannels.map((channel) => {
    const clampedChannel = Math.max(0, Math.min(255, Number(channel)));

    return clampedChannel.toString(16).padStart(2, '0');
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
    const updated: UpdatedValue = {
      ...value,
    };

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

    const updated: UpdatedValue = {
      ...value,
    };

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

  const blurValueChangeHandler = (val: string) => {
    const blur = Number(val);

    if (Number.isFinite(blur) && blur >= 0) {
      const blurValuesAsString = `blur(${blur}px)`;
      const newProperty = blur ? blurValuesAsString : undefined;

      setProperty('backdropFilter', newProperty);
    }
  };

  const backgroundColor = String(value?.backgroundColor ?? '');
  const parsedBackgroundColor = getHexColor(backgroundColor);

  const backdropFilter = String(value?.backdropFilter ?? '');
  const blurMatch = backdropFilter.match(/blur\(([\d.]+)px\)/);
  const blurValue = Number(blurMatch?.[1] ?? 0);

  return (
    <div className={styles.StyleEditor}>
      <label className={styles.Field}>
        <span>
          Цвет фона (HEX, RGB, RGBA)
        </span>

        <input
          type="text"
          value={backgroundColor}
          onChange={(e) => setProperty('backgroundColor', e.target.value)}
          placeholder="#00000080"
        />
      </label>

      <HexAlphaColorPicker
        color={parsedBackgroundColor}
        onChange={(color) => setProperty('backgroundColor', color)}
      />

      <label className={styles.Field}>
        <span>
          Размытие (условные единицы)
        </span>

        <input
          type="number"
          min={0}
          step={1}
          value={blurValue}
          onChange={(e) => blurValueChangeHandler(e.target.value)}
        />
      </label>

      <details className={styles.Advanced}>
        <summary>
          Дополнительные CSS-свойства
        </summary>

        {rules.map(([property, ruleValue]) => {
          return (
            <div className={styles.Rule} key={property}>
              <input
                aria-label="Имя свойства"
                defaultValue={property}
                onBlur={(e) => renameProperty(property, e.target.value)}
              />

              <input
                aria-label="Значение свойства"
                value={String(ruleValue)}
                onChange={(e) => setProperty(property, e.target.value)}
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
            onChange={(e) => setNewProperty(e.target.value)}
          />

          <input
            aria-label="Значение нового свойства"
            value={newValue}
            placeholder="0.8"
            onChange={(e) => setNewValue(e.target.value)}
          />

          <button type="button" onClick={addProperty}>
            +
          </button>
        </div>
      </details>
    </div>
  );
};
