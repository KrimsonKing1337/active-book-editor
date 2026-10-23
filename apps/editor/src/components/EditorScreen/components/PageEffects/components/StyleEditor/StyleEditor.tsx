import { type ChangeEvent, type CSSProperties, type KeyboardEvent, useEffect, useRef, useState } from 'react';

import { HexAlphaColorPicker } from 'react-colorful';

import { InputMask, unformat } from '@react-input/mask';

import { Slider } from 'activeBook-core/components';

import {
  getHexColor,
  getRgbaColor,
  getRgbaMask,
  hexMaskOptions,
  modifyRgbaMask,
  parseRgbaColor,
  rgbaReplacement,
} from './color';

import styles from './StyleEditor.module.scss';

type StyleEditorProps = {
  value: CSSProperties;
  onChange: (style: CSSProperties) => void;
  defaultZIndex?: number;
  onStylePreview?: (style: CSSProperties) => void;
  onStyleCommit?: () => boolean;
};

type UpdatedValue = Record<string, string | number | undefined>;

type StyleRuleProps = {
  name: string;
  value: string | number;
  onUpdate: (name: string, nextName: string, nextValue: string) => string | null;
  onPreview: (name: string, nextValue: string) => void;
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

const removeLeadingZeros = (value: string): string => {
  return value.replace(/^(-?)0+(?=\d)/, '$1');
};

const handleInputEnter = (event: KeyboardEvent<HTMLDivElement>) => {
  if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
    event.target.blur();
  }
};

const StyleRule = ({ name, value, onUpdate, onPreview, onDelete }: StyleRuleProps) => {
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

  const handleValueChange = (nextValue: string) => {
    setValueDraft(nextValue);

    if (isValidCssRule(name, nextValue.trim())) {
      onPreview(name, nextValue.trim());
    }
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
          onChange={(event) => handleValueChange(event.target.value)}
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

export const StyleEditor = ({
  value,
  onChange,
  defaultZIndex = 0,
  onStylePreview,
  onStyleCommit,
}: StyleEditorProps) => {
  const [newProperty, setNewProperty] = useState('');
  const [newValue, setNewValue] = useState('');
  const [propertyError, setPropertyError] = useState('');
  const [dragBlur, setDragBlur] = useState<number | null>(null);
  const [draftStyle, setDraftStyle] = useState<CSSProperties | null>(null);

  const sliderFrameRef = useRef<number | null>(null);
  const draftStyleRef = useRef<CSSProperties | null>(null);

  useEffect(() => {
    return () => {
      if (sliderFrameRef.current !== null) {
        cancelAnimationFrame(sliderFrameRef.current);
      }
    };
  }, []);

  const previewStyle = (updatedStyle: CSSProperties, updateLocal = true) => {
    draftStyleRef.current = updatedStyle;

    if (updateLocal) {
      setDraftStyle(updatedStyle);
    }

    if (onStylePreview) {
      onStylePreview(updatedStyle);
    } else {
      onChange(updatedStyle);
    }
  };

  const commitStyle = () => {
    if (!draftStyleRef.current) {
      return;
    }

    if (onStyleCommit && !onStyleCommit()) {
      return;
    }

    draftStyleRef.current = null;
    setDraftStyle(null);
  };

  const currentStyle = draftStyle ?? value;

  const backgroundColor = String((draftStyle ?? value).backgroundColor ?? '');
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

  const rules = Object.entries(currentStyle);

  const setProperty = (name: string, nextValue: string | number | undefined) => {
    const updated: UpdatedValue = { ...(draftStyleRef.current ?? value) };

    if (nextValue === undefined || nextValue === '') {
      delete updated[name];
    } else {
      updated[name] = nextValue;
    }

    previewStyle(updated as CSSProperties);
  };

  const previewRuleValue = (name: string, nextValue: string) => {
    const updated: UpdatedValue = { ...(draftStyleRef.current ?? value) };

    updated[name] = nextValue;

    previewStyle(updated as CSSProperties);
  };

  const updateRule = (name: string, nextName: string, nextValue: string): string | null => {
    if (name !== nextName && Object.hasOwn(currentStyle, nextName)) {
      return 'Такое CSS-свойство уже существует';
    }

    const updated: UpdatedValue = { ...(draftStyleRef.current ?? value) };

    delete updated[name];
    updated[nextName] = nextValue;

    previewStyle(updated as CSSProperties);
    commitStyle();

    return null;
  };

  const addProperty = () => {
    const name = normalizePropertyName(newProperty);

    if (Object.hasOwn(currentStyle, name)) {
      setPropertyError('Такое CSS-свойство уже существует');

      return;
    }

    if (!isValidCssRule(name, newValue.trim())) {
      setPropertyError('Некорректное CSS-свойство или значение');

      return;
    }

    setProperty(name, newValue.trim());
    commitStyle();
    setNewProperty('');
    setNewValue('');
    setPropertyError('');
  };

  const handleHexChange = (input: string) => {
    setHexDraft(input);

    const digits = unformat(input, hexMaskOptions);

    if (digits.length === 6 || digits.length === 8) {
      setProperty('backgroundColor', '#' + digits);
    }
  };

  const handleRgbaChange = (input: string) => {
    setRgbaDraft(input);

    const color = parseRgbaColor(input);

    if (color) {
      setProperty('backgroundColor', color);
    }
  };

  const handleColorBlur = () => {
    setActiveColorInput(null);
    commitStyle();
  };

  const handleBlurChange = (blur: number) => {
    if (Number.isFinite(blur) && blur >= 0) {
      const newFilter = blur ? 'blur(' + blur + 'px)' : undefined;

      setProperty('backdropFilter', newFilter);
    }
  };

  const handleSliderBlurChange = (blur: number) => {
    const nextStyle: CSSProperties = {
      ...(draftStyleRef.current ?? value),
      backdropFilter: blur ? `blur(${blur}px)` : undefined,
    };

    previewStyle(nextStyle, false);

    if (sliderFrameRef.current !== null) {
      cancelAnimationFrame(sliderFrameRef.current);
    }

    sliderFrameRef.current = requestAnimationFrame(() => {
      setDragBlur(blur);
      sliderFrameRef.current = null;
    });
  };

  const handleSliderBlurCommit = (blur: number) => {
    if (sliderFrameRef.current !== null) {
      cancelAnimationFrame(sliderFrameRef.current);
    }

    // Keep document updates outside react-range's flushSync.
    const nextStyle: CSSProperties = {
      ...(draftStyleRef.current ?? value),
      backdropFilter: blur ? `blur(${blur}px)` : undefined,
    };

    previewStyle(nextStyle, false);

    sliderFrameRef.current = requestAnimationFrame(() => {
      setDragBlur(null);
      commitStyle();
      sliderFrameRef.current = null;
    });
  };

  const handleBlurInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const normalized = removeLeadingZeros(event.target.value);

    event.target.value = normalized;

    handleBlurChange(Number(normalized));
  };

  const backdropFilter = String(currentStyle.backdropFilter ?? '');
  const blurMatch = backdropFilter.match(/blur\((\d+(?:\.\d+)?)px\)/);
  const blurValue = Number(blurMatch?.[1] ?? 0);
  const sliderBlur = Math.min(100, Math.max(0, blurValue));
  const displayedBlur = dragBlur ?? blurValue;

  const rawZIndex = Number(currentStyle.zIndex ?? defaultZIndex);
  const zIndex = Number.isFinite(rawZIndex) ? rawZIndex : 0;

  const handleZIndexChange = (nextZIndex: number) => {
    if (Number.isFinite(nextZIndex)) {
      setProperty('zIndex', nextZIndex);
    }
  };

  const handleZIndexInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const normalized = removeLeadingZeros(event.target.value);

    event.target.value = normalized;

    handleZIndexChange(Number(normalized));
  };

  return (
    <div className={styles.StyleEditor} onKeyDown={handleInputEnter}>
      <div className={styles.ColorFields}>
        <label className={styles.Field}>
          <span>HEX</span>

          <InputMask
            aria-label="HEX"
            {...hexMaskOptions}
            showMask
            placeholder="#RRGGBBAA"
            value={hexDraft}
            spellCheck={false}
            onChange={(event) => handleHexChange(event.target.value)}
            onFocus={() => setActiveColorInput('hex')}
            onBlur={handleColorBlur}
          />

          <small>#RRGGBBAA</small>
        </label>

        <label className={styles.Field}>
          <span>RGBA</span>

          <InputMask
            aria-label="RGBA"
            mask={getRgbaMask(rgbaDraft)}
            modify={modifyRgbaMask}
            replacement={rgbaReplacement}
            showMask
            separate
            value={rgbaDraft}
            inputMode="decimal"
            spellCheck={false}
            placeholder="204 62 114 / 0.8"
            onChange={(event) => handleRgbaChange(event.target.value)}
            onFocus={() => setActiveColorInput('rgba')}
            onBlur={handleColorBlur}
          />

          <small>204 62 114 / 0.8</small>
        </label>
      </div>

      <div
        onPointerUp={() => requestAnimationFrame(commitStyle)}
        onKeyUp={() => requestAnimationFrame(commitStyle)}
      >
        <HexAlphaColorPicker
          color={pickerColor}
          onChange={(color) => setProperty('backgroundColor', color)}
        />
      </div>

      <label className={styles.Field}>
        <span>Размытие (px)</span>

        <div className={styles.RangeFields}>
          <Slider
            className={styles.BlurSlider}
            value={sliderBlur}
            onChange={handleSliderBlurChange}
            onAfterChange={handleSliderBlurCommit}
          />

          <input
            type="number"
            min={0}
            step={1}
            aria-label="Размытие в пикселях"
            value={displayedBlur}
            onChange={handleBlurInputChange}
            onBlur={commitStyle}
          />
        </div>
      </label>

      <label className={styles.Field}>
        <span>z-index</span>

        <div className={styles.LayerControls}>
          <button type="button" onClick={() => {
            handleZIndexChange(zIndex - 1);
            commitStyle();
          }} aria-label="На слой назад">
            −
          </button>

          <input
            type="number"
            step={1}
            value={zIndex}
            onChange={handleZIndexInputChange}
            onBlur={commitStyle}
          />

          <button type="button" onClick={() => {
            handleZIndexChange(zIndex + 1);
            commitStyle();
          }} aria-label="На слой вперёд">
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
              onPreview={previewRuleValue}
              onDelete={(name) => {
                setProperty(name, undefined);
                commitStyle();
              }}
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
