import type {
  ChangeEvent,
  ClipboardEvent,
  KeyboardEvent,
  MouseEvent,
} from 'react';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { InputMask, format, unformat } from '@react-input/mask';
import { HexAlphaColorPicker } from 'react-colorful';

import {
  getHexColor,
  getRgbaColor,
  getRgbaMask,
  getRgbaWidths,
  hexMaskOptions,
  parseRgbaColor,
  rgbaReplacement,
} from '../../color';

import styles from '../../StyleEditor.module.scss';

type ColorSettingsProps = {
  color: string;
  onColorChange: (color: string) => void;
  onCommit: () => void;
};

export const ColorSettings = ({ color, onColorChange, onCommit }: ColorSettingsProps) => {
  const pickerColor = getHexColor(color);

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

  const handleApplyColor = (kind: 'hex' | 'rgba'): void => {
    let color: string | null = null;

    if (kind === 'hex') {
      const digits = unformat(hexDraft, hexMaskOptions);

      if (digits.length === 6 || digits.length === 8) {
        color = `#${digits}`;
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
    onColorChange(color);
    onCommit();
  };

  const handleRgbaKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const position = input.selectionStart ?? 0;
    const selectedAll = position === 0 && input.selectionEnd === input.value.length;
    const pressedDigit = e.key.length === 1 && e.key >= '0' && e.key <= '9';

    if (selectedAll && pressedDigit) {
      e.preventDefault();

      const widths: typeof rgbaWidths = [3, 3, 3, 3];
      const options = {
        mask: getRgbaMask(widths),
        replacement: rgbaReplacement,
      };

      setRgbaWidths(widths);
      setRgbaDraft(format(e.key, options));
      setLastEditedColorInput('rgba');
      setColorError('');

      requestAnimationFrame(() => {
        rgbaInputRef.current?.setSelectionRange(1, 1);
      });

      return;
    }

    if (e.key !== ' ' && e.key !== '/') {
      return;
    }

    const [red, green, blue] = rgbaWidths;
    const starts = [
      0,
      red + 1,
      red + green + 2,
      red + green + blue + 5,
    ];
    const currentIndex = starts.reduce((index, start, itemIndex) => position >= start ? itemIndex : index, -1);

    if (currentIndex < 0 || currentIndex > 2) {
      return;
    }

    e.preventDefault();

    const currentValue = rgbaDraft.slice(starts[currentIndex], starts[currentIndex] + rgbaWidths[currentIndex]);
    const digits = [...currentValue].filter((character) => character >= '0' && character <= '9');

    if (!digits.length) {
      return;
    }

    const nextWidths: typeof rgbaWidths = [
      rgbaWidths[0],
      rgbaWidths[1],
      rgbaWidths[2],
      rgbaWidths[3],
    ];
    nextWidths[currentIndex] = digits.length;

    const previousMask = {
      mask: getRgbaMask(rgbaWidths),
      replacement: rgbaReplacement,
    };

    const nextMask = {
      mask: getRgbaMask(nextWidths),
      replacement: rgbaReplacement,
    };
    const rawDigits = unformat(rgbaDraft, previousMask);

    setRgbaWidths(nextWidths);
    setRgbaDraft(format(rawDigits, nextMask));

    const nextIndex = e.key === '/' ? 3 : currentIndex + 1;
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

  const handleRgbaPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pastedValue = e.clipboardData.getData('text').trim();

    if (!parseRgbaColor(pastedValue)) {
      return;
    }

    e.preventDefault();
    setRgbaDraft(pastedValue);
    setRgbaWidths(getRgbaWidths(pastedValue));
    setColorError('');
  };


  const handleHexInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleHexChange(e.target.value);
  };

  const handleRgbaInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleRgbaChange(e.target.value);
  };

  const handleHexFocus = () => {
    setActiveColorInput('hex');
    setLastEditedColorInput('hex');
  };

  const handleRgbaFocus = () => {
    setActiveColorInput('rgba');
    setLastEditedColorInput('rgba');
  };

  const handleHexBlur = () => {
    handleApplyColor('hex');
  };

  const handleRgbaBlur = () => {
    handleApplyColor('rgba');
  };

  const handleApplyButtonClick = () => {
    handleApplyColor(lastEditedColorInput);
  };

  const handleApplyButtonMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  const handlePickerPointerUp = () => {
    requestAnimationFrame(onCommit);
  };

  const handlePickerKeyUp = () => {
    requestAnimationFrame(onCommit);
  };

  return (
    <>
      <div className={styles.ColorFields}>
        <label className={styles.Field}>
          <span>
            HEX
          </span>

          <InputMask
            aria-label="HEX"
            {...hexMaskOptions}
            showMask
            placeholder="#RRGGBBAA"
            value={hexDraft}
            spellCheck={false}
            onChange={handleHexInputChange}
            onFocus={handleHexFocus}
            onBlur={handleHexBlur}
          />
        </label>

        <label className={styles.Field}>
          <span>
            RGBA
          </span>

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
            onChange={handleRgbaInputChange}
            onKeyDown={handleRgbaKeyDown}
            onPaste={handleRgbaPaste}
            onFocus={handleRgbaFocus}
            onBlur={handleRgbaBlur}
          />
        </label>
      </div>

      <div className={styles.ColorActions}>
        <button
          type="button"
          onMouseDown={handleApplyButtonMouseDown}
          onClick={handleApplyButtonClick}
        >
          Применить цвет
        </button>
        {colorError && (
          <span className={styles.Error} role="alert">
            {colorError}
          </span>
        )}
      </div>

      <div
        onPointerUp={handlePickerPointerUp}
        onKeyUp={handlePickerKeyUp}
      >
        <HexAlphaColorPicker
          color={pickerColor}
          onChange={onColorChange}
        />
      </div>
    </>
  );
};
