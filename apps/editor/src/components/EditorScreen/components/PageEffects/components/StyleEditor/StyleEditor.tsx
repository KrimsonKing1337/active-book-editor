import {
  type ChangeEvent,
  type ClipboardEvent,
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import { HexAlphaColorPicker } from 'react-colorful';

import { InputMask, format, unformat } from '@react-input/mask';

import { Slider } from 'activeBook-core/components';

import {
  getHexColor,
  getRgbaColor,
  getRgbaMask,
  getRgbaWidths,
  hexMaskOptions,
  parseRgbaColor,
  rgbaReplacement,
} from './color';

import { getBlurPixels } from './utils';

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
  const [rgbaWidths, setRgbaWidths] = useState(() => getRgbaWidths(getRgbaColor(pickerColor)));
  const [activeColorInput, setActiveColorInput] = useState<'hex' | 'rgba' | null>(null);
  const [lastEditedColorInput, setLastEditedColorInput] = useState<'hex' | 'rgba'>('hex');
  const [colorError, setColorError] = useState('');

  const rgbaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeColorInput !== 'hex' && !(colorError && lastEditedColorInput === 'hex')) {
      setHexDraft(pickerColor);
    }

    if (activeColorInput !== 'rgba' && !(colorError && lastEditedColorInput === 'rgba')) {
      const rgba = getRgbaColor(pickerColor);

      setRgbaDraft(rgba);
      setRgbaWidths(getRgbaWidths(rgba));
    }
  }, [pickerColor, activeColorInput, colorError, lastEditedColorInput]);

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
    setLastEditedColorInput('hex');
    setColorError('');
  };

  const handleRgbaChange = (input: string) => {
    setRgbaDraft(input);
    setLastEditedColorInput('rgba');
    setColorError('');
  };

  const applyColor = (kind: 'hex' | 'rgba'): void => {
    let color: string | null = null;

    if (kind === 'hex') {
      const digits = unformat(hexDraft, hexMaskOptions);

      if (digits.length === 6 || digits.length === 8) {
        color = '#' + digits;
      }
    } else {
      color = parseRgbaColor(rgbaDraft);
    }

    if (!color) {
      setColorError(kind === 'hex' ? 'Укажи 6 или 8 HEX-символов' : 'Проверь RGB (0–255) и альфу (0–100%)');
      setActiveColorInput(null);

      return;
    }

    setColorError('');
    setActiveColorInput(null);
    setProperty('backgroundColor', color);
    commitStyle();
  };

  const handleRgbaKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const position = input.selectionStart ?? 0;
    const selectedAll = position === 0 && input.selectionEnd === input.value.length;
    const pressedDigit = event.key.length === 1 && event.key >= '0' && event.key <= '9';

    if (selectedAll && pressedDigit) {
      event.preventDefault();

      const widths: typeof rgbaWidths = [3, 3, 3, 3];
      const options = { mask: getRgbaMask(widths), replacement: rgbaReplacement };

      setRgbaWidths(widths);
      setRgbaDraft(format(event.key, options));
      setLastEditedColorInput('rgba');
      setColorError('');

      requestAnimationFrame(() => {
        rgbaInputRef.current?.setSelectionRange(1, 1);
      });

      return;
    }

    if (event.key !== ' ' && event.key !== '/') {
      return;
    }
    const [red, green, blue] = rgbaWidths;
    const starts = [0, red + 1, red + green + 2, red + green + blue + 5];
    const currentIndex = starts.reduce((index, start, itemIndex) => position >= start ? itemIndex : index, -1);

    if (currentIndex < 0 || currentIndex > 2) {
      return;
    }

    event.preventDefault();

    const currentValue = rgbaDraft.slice(starts[currentIndex], starts[currentIndex] + rgbaWidths[currentIndex]);
    const digits = [...currentValue].filter((character) => character >= '0' && character <= '9');

    if (!digits.length) {
      return;
    }

    const nextWidths: typeof rgbaWidths = [rgbaWidths[0], rgbaWidths[1], rgbaWidths[2], rgbaWidths[3]];
    nextWidths[currentIndex] = digits.length;

    const previousMask = { mask: getRgbaMask(rgbaWidths), replacement: rgbaReplacement };
    const nextMask = { mask: getRgbaMask(nextWidths), replacement: rgbaReplacement };
    const rawDigits = unformat(rgbaDraft, previousMask);

    setRgbaWidths(nextWidths);
    setRgbaDraft(format(rawDigits, nextMask));

    const nextIndex = event.key === '/' ? 3 : currentIndex + 1;
    const nextStarts = [
      0,
      nextWidths[0] + 1,
      nextWidths[0] + nextWidths[1] + 2,
      nextWidths[0] + nextWidths[1] + nextWidths[2] + 5,
    ];

    requestAnimationFrame(() => {
      rgbaInputRef.current?.setSelectionRange(nextStarts[nextIndex], nextStarts[nextIndex]);
    });
  };

  const handleRgbaPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedValue = event.clipboardData.getData('text').trim();

    if (!parseRgbaColor(pastedValue)) {
      return;
    }

    event.preventDefault();
    setRgbaDraft(pastedValue);
    setRgbaWidths(getRgbaWidths(pastedValue));
    setColorError('');
  };

  const handleBlurChange = (blur: number) => {
    if (Number.isFinite(blur) && blur >= 0) {
      const newFilter = blur ? `blur(${blur}px)` : undefined;

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

  const blurValue = getBlurPixels(currentStyle.backdropFilter);
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
            onFocus={() => {
              setActiveColorInput('hex');
              setLastEditedColorInput('hex');
            }}
            onBlur={() => applyColor('hex')}
          />
        </label>

        <label className={styles.Field}>
          <span>RGBA</span>

          <InputMask
            ref={rgbaInputRef}
            aria-label="RGBA"
            mask={getRgbaMask(rgbaWidths)}
            replacement={rgbaReplacement}
            showMask
            separate
            value={rgbaDraft}
            inputMode="numeric"
            spellCheck={false}
            placeholder="204 62 114 / 80%"
            onChange={(event) => handleRgbaChange(event.target.value)}
            onKeyDown={handleRgbaKeyDown}
            onPaste={handleRgbaPaste}
            onFocus={() => {
              setActiveColorInput('rgba');
              setLastEditedColorInput('rgba');
            }}
            onBlur={() => applyColor('rgba')}
          />
        </label>
      </div>

      <div className={styles.ColorActions}>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyColor(lastEditedColorInput)}
        >
          Применить цвет
        </button>
        {colorError && <span className={styles.Error} role="alert">{colorError}</span>}
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
          <button
            type="button"
            onClick={() => {
              handleZIndexChange(zIndex - 1);
              commitStyle();
            }}
            aria-label="На слой назад"
          >
            −
          </button>

          <input
            type="number"
            step={1}
            value={zIndex}
            onChange={handleZIndexInputChange}
            onBlur={commitStyle}
          />

          <button
            type="button"
            onClick={() => {
              handleZIndexChange(zIndex + 1);
              commitStyle();
            }}
            aria-label="На слой вперёд"
          >
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
