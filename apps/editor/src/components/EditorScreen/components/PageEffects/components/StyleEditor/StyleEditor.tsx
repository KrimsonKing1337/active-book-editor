import { type CSSProperties, type KeyboardEvent, useEffect, useState } from 'react';

import { HexAlphaColorPicker } from 'react-colorful';

import styles from './StyleEditor.module.scss';

type StyleEditorProps = {
  value: CSSProperties;
  onChange: (style: CSSProperties) => void;
  defaultZIndex?: number;
};

type UpdatedValue = Record<string, string | number | undefined>;

type StyleRuleProps = {
  name: string;
  value: string | number;
  onUpdate: (name: string, nextName: string, nextValue: string) => string | null;
  onDelete: (name: string) => void;
};

const normalizePropertyName = (name: string) => {
  const trimmed = name.trim();

  if (trimmed.startsWith('--')) {
    return trimmed;
  }

  return trimmed.replace(/-([a-z])/g, (_full, letter: string) => letter.toUpperCase());
};

const isValidCssRule = (property: string, ruleValue: string): boolean => {
  const isCustomProperty = /^--[\w-]+$/.test(property);
  const isRegularProperty = /^[a-zA-Z][\w-]*$/.test(property);

  if (!isCustomProperty && !isRegularProperty) {
    return false;
  }

  const cssProperty = property.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());

  try {
    return CSS.supports(cssProperty, ruleValue);
  } catch {
    return false;
  }
};

const getHexColor = (value: string): string => {
  if (/^#[\da-f]{6}([\da-f]{2})?$/i.test(value)) {
    return value.length === 7 ? value + 'ff' : value;
  }

  const match = value.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\/\s]+(\d+(?:\.\d*)?|\.\d+))?\s*\)$/i);

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

  return '#' + channels.join('') + alphaHex;
};

const getRgbaColor = (hex: string): string => {
  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  const alpha = Math.round((parseInt(hex.slice(7, 9), 16) / 255) * 100) / 100;

  return red + ' ' + green + ' ' + blue + ' / ' + alpha;
};

const getIsValidRgba = (value: string): boolean => {
  const match = value.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*\/\s*(\d+(?:\.\d+)?|\.\d+)$/);

  if (!match) {
    return false;
  }

  const channels = match.slice(1, 4).map(Number);
  const alpha = Number(match[4]);

  return channels.every((channel) => channel >= 0 && channel <= 255)
    && alpha >= 0 && alpha <= 1;
};

const StyleRule = ({ name, value, onUpdate, onDelete }: StyleRuleProps) => {
  const [nameDraft, setNameDraft] = useState(name);
  const [valueDraft, setValueDraft] = useState(String(value));
  const [error, setError] = useState('');

  useEffect(() => {
    setNameDraft(name);
    setValueDraft(String(value));
  }, [name, value]);

  const applyRule = () => {
    const nextName = normalizePropertyName(nameDraft);
    const nextValue = valueDraft.trim();

    if (!nextValue || !isValidCssRule(nextName, nextValue)) {
      setError('Некорректное CSS-свойство или значение');

      return;
    }

    const updateError = onUpdate(name, nextName, nextValue);

    setError(updateError ?? '');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  };

  return (
    <div className={styles.RuleContainer}>
      <div className={styles.Rule}>
        <input
          aria-label="Имя свойства"
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value)}
          onBlur={applyRule}
          onKeyDown={handleKeyDown}
        />

        <input
          aria-label="Значение свойства"
          value={valueDraft}
          onChange={(event) => setValueDraft(event.target.value)}
          onBlur={applyRule}
          onKeyDown={handleKeyDown}
        />

        <button type="button" aria-label="Удалить свойство" onClick={() => onDelete(name)}>
          ×
        </button>
      </div>

      {error && <span className={styles.Error} role="alert">{error}</span>}
    </div>
  );
};

export const StyleEditor = ({ value, onChange, defaultZIndex = 0 }: StyleEditorProps) => {
  const [newProperty, setNewProperty] = useState('');
  const [newValue, setNewValue] = useState('');
  const [propertyError, setPropertyError] = useState('');

  const backgroundColor = String(value.backgroundColor ?? '');
  const pickerColor = getHexColor(backgroundColor);

  const [hexDraft, setHexDraft] = useState(pickerColor);
  const [rgbaDraft, setRgbaDraft] = useState(getRgbaColor(pickerColor));
  const [activeColorInput, setActiveColorInput] = useState<'hex' | 'rgba' | null>(null);

  useEffect(() => {
    if (activeColorInput !== 'hex') {
      setHexDraft(pickerColor);
    }

    if (activeColorInput !== 'rgba') {
      setRgbaDraft(getRgbaColor(pickerColor));
    }
  }, [pickerColor, activeColorInput]);

  const rules = Object.entries(value);

  const setProperty = (name: string, nextValue: string | number | undefined) => {
    const updated: UpdatedValue = { ...value };

    if (nextValue === undefined || nextValue === '') {
      delete updated[name];
    } else {
      updated[name] = nextValue;
    }

    onChange(updated as CSSProperties);
  };

  const updateRule = (name: string, nextName: string, nextValue: string): string | null => {
    if (name !== nextName && Object.hasOwn(value, nextName)) {
      return 'Такое CSS-свойство уже существует';
    }

    const updated: UpdatedValue = { ...value };

    delete updated[name];
    updated[nextName] = nextValue;

    onChange(updated as CSSProperties);

    return null;
  };

  const addProperty = () => {
    const name = normalizePropertyName(newProperty);

    if (Object.hasOwn(value, name)) {
      setPropertyError('Такое CSS-свойство уже существует');

      return;
    }

    if (!isValidCssRule(name, newValue.trim())) {
      setPropertyError('Некорректное CSS-свойство или значение');

      return;
    }

    setProperty(name, newValue.trim());
    setNewProperty('');
    setNewValue('');
    setPropertyError('');
  };

  const handleHexChange = (input: string) => {
    const hexDigits = input.replaceAll('#', '').replace(/[^\da-f]/gi, '').slice(0, 8);
    const nextHex = '#' + hexDigits;

    setHexDraft(nextHex);

    if (/^#[\da-f]{6}([\da-f]{2})?$/i.test(nextHex)) {
      setProperty('backgroundColor', nextHex);
    }
  };

  const handleRgbaChange = (input: string) => {
    const cleaned = input.replace(/[(),]/g, ' ').replace(/[^\d./\s]/g, '')
      .replace(/\/+/g, ' / ').replace(/\s+/g, ' ').trimStart();

    const parts = cleaned.split(/[\s/]+/).filter(Boolean).slice(0, 4);

    let nextRgba = parts.slice(0, 3).join(' ');

    if (parts.length === 4) {
      nextRgba += ' / ' + parts[3];
    } else if (parts.length === 3 && (cleaned.endsWith(' ') || cleaned.includes('/'))) {
      nextRgba += ' / ';
    } else if (cleaned.endsWith(' ')) {
      nextRgba += ' ';
    }

    setRgbaDraft(nextRgba);

    if (getIsValidRgba(nextRgba)) {
      setProperty('backgroundColor', 'rgb(' + nextRgba.trim() + ')');
    }
  };

  const handleColorBlur = () => {
    setActiveColorInput(null);
  };

  const handleBlurChange = (blur: number) => {
    if (Number.isFinite(blur) && blur >= 0) {
      const newFilter = blur ? 'blur(' + blur + 'px)' : undefined;

      setProperty('backdropFilter', newFilter);
    }
  };

  const backdropFilter = String(value.backdropFilter ?? '');
  const blurMatch = backdropFilter.match(/blur\((\d+(?:\.\d+)?)px\)/);
  const blurValue = Number(blurMatch?.[1] ?? 0);
  const sliderBlur = Math.min(100, Math.max(0, blurValue));

  const rawZIndex = Number(value.zIndex ?? defaultZIndex);
  const zIndex = Number.isFinite(rawZIndex) ? rawZIndex : 0;

  const handleZIndexChange = (nextZIndex: number) => {
    if (Number.isFinite(nextZIndex)) {
      setProperty('zIndex', nextZIndex);
    }
  };

  return (
    <div className={styles.StyleEditor}>
      <div className={styles.ColorFields}>
        <label className={styles.Field}>
          <span>HEX</span>

          <input
            aria-label="HEX"
            value={hexDraft}
            maxLength={9}
            spellCheck={false}
            onChange={(event) => handleHexChange(event.target.value)}
            onFocus={() => setActiveColorInput('hex')}
            onBlur={handleColorBlur}
          />
        </label>

        <label className={styles.Field}>
          <span>RGBA</span>

          <input
            aria-label="RGBA"
            value={rgbaDraft}
            inputMode="decimal"
            spellCheck={false}
            placeholder="204 62 114 / 0.8"
            onChange={(event) => handleRgbaChange(event.target.value)}
            onFocus={() => setActiveColorInput('rgba')}
            onBlur={handleColorBlur}
          />
        </label>
      </div>

      <HexAlphaColorPicker
        color={pickerColor}
        onChange={(color) => setProperty('backgroundColor', color)}
      />

      <label className={styles.Field}>
        <span>Размытие (px)</span>

        <div className={styles.RangeFields}>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={sliderBlur}
            onChange={(event) => handleBlurChange(Number(event.target.value))}
          />

          <input
            type="number"
            min={0}
            step={1}
            aria-label="Размытие в пикселях"
            value={blurValue}
            onChange={(event) => handleBlurChange(Number(event.target.value))}
          />
        </div>
      </label>

      <label className={styles.Field}>
        <span>z-index</span>

        <div className={styles.LayerControls}>
          <button type="button" onClick={() => handleZIndexChange(zIndex - 1)} aria-label="На слой назад">
            −
          </button>

          <input
            type="number"
            step={1}
            value={zIndex}
            onChange={(event) => handleZIndexChange(Number(event.target.value))}
          />

          <button type="button" onClick={() => handleZIndexChange(zIndex + 1)} aria-label="На слой вперёд">
            +
          </button>
        </div>
      </label>

      <details className={styles.Advanced}>
        <summary>Дополнительные CSS-свойства</summary>

        {rules.map(([property, ruleValue]) => {
          return (
            <StyleRule
              key={property}
              name={property}
              value={ruleValue as string | number}
              onUpdate={updateRule}
              onDelete={(name) => setProperty(name, undefined)}
            />
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

        {propertyError && <span className={styles.Error} role="alert">{propertyError}</span>}
      </details>
    </div>
  );
};
