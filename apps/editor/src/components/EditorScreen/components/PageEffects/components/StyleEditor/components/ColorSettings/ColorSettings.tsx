import type { ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { InputMask, unformat } from '@react-input/mask';
import { HexAlphaColorPicker } from 'react-colorful';

import type { RgbaChannels } from '../../color';

import {
  getHexColor,
  getHexFromRgba,
  getRgbaChannels,
  getRgbaError,
  hexMaskOptions,
  normalizeRgbaChannel,
} from '../../color';

import styles from '../../StyleEditor.module.scss';

type ColorSettingsProps = {
  label?: string;
  color: string;
  onColorChange: (color: string) => void;
  onCommit: () => void;
};

type EditedFormat = 'hex' | 'rgba' | null;

const CHANNEL_LABELS = ['R', 'G', 'B', 'A'];

const getCompleteHex = (val: string): string | null => {
  const digits = unformat(val, hexMaskOptions);

  if (digits.length !== 6 && digits.length !== 8) {
    return null;
  }

  return getHexColor('#' + digits);
};

export const ColorSettings = ({
  label = 'Цвет фона (background-color)',
  color,
  onColorChange,
  onCommit,
}: ColorSettingsProps) => {
  const pickerColor = getHexColor(color);

  const [hexDraft, setHexDraft] = useState(pickerColor);
  const [rgbaDraft, setRgbaDraft] = useState<RgbaChannels>(() => getRgbaChannels(pickerColor));
  const [editedFormat, setEditedFormat] = useState<EditedFormat>(null);
  const [showValidation, setShowValidation] = useState(false);

  const rgbaDraftRef = useRef(rgbaDraft);
  const channelRefs = useRef<Array<HTMLInputElement | null>>([null, null, null, null]);

  useEffect(() => {
    const nextRgba = getRgbaChannels(pickerColor);

    rgbaDraftRef.current = nextRgba;

    setHexDraft(pickerColor);
    setRgbaDraft(nextRgba);
    setEditedFormat(null);
    setShowValidation(false);
  }, [pickerColor]);

  const updateChannel = (index: number, val: string) => {
    const updated: RgbaChannels = [...rgbaDraftRef.current];

    updated[index] = val;

    rgbaDraftRef.current = updated;

    setRgbaDraft(updated);
    setEditedFormat('rgba');
    setShowValidation(false);

    const hex = getHexFromRgba(updated);

    if (hex) {
      setHexDraft(hex);
    }
  };

  const focusChannel = (index: number, position: 'start' | 'end' | 'select' = 'end') => {
    const input = channelRefs.current[index];

    if (!input) {
      return;
    }

    input.focus();

    if (position === 'select') {
      input.select();

      return;
    }

    const offset = position === 'start' ? 0 : input.value.length;

    input.setSelectionRange(offset, offset);
  };

  const handleHexChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextHex = e.target.value;
    const parsedHex = getCompleteHex(nextHex);

    setHexDraft(nextHex);
    setEditedFormat('hex');
    setShowValidation(false);

    if (parsedHex) {
      const nextRgba = getRgbaChannels(parsedHex);

      rgbaDraftRef.current = nextRgba;

      setRgbaDraft(nextRgba);
    }
  };

  const handleChannelChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (/^\d{0,3}$/.test(val)) {
      updateChannel(index, val);
    }
  };

  const handleChannelBlur = (index: number) => {
    const value = rgbaDraftRef.current[index];
    const normalized = normalizeRgbaChannel(value, index);

    if (value !== normalized) {
      updateChannel(index, normalized);
    }

    setShowValidation(true);
  };

  const handleChannelKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const value = rgbaDraftRef.current[index];

    const caretIsAtStart = start === 0 && end === 0;
    const caretIsAtEnd = start === value.length && start === end;

    if (e.key === 'Enter') {
      e.preventDefault();

      setShowValidation(true);

      input.blur();

      return;
    }

    if (e.key === 'ArrowRight' && caretIsAtEnd && index < 3) {
      e.preventDefault();

      focusChannel(index + 1, 'start');

      return;
    }

    if (e.key === 'ArrowLeft' && caretIsAtStart && index > 0) {
      e.preventDefault();

      focusChannel(index - 1);

      return;
    }

    if (e.key === 'Backspace') {
      const selectedAll = start === 0 && end === value.length;
      const removingLastDigit = value.length === 1 && start === 1 && end === 1;

      if (selectedAll || removingLastDigit || value === '') {
        e.preventDefault();

        updateChannel(index, '');

        if (index > 0) {
          focusChannel(index - 1);
        }

        return;
      }

      if (caretIsAtStart && index > 0) {
        e.preventDefault();

        focusChannel(index - 1);

        return;
      }
    }

    const isDigit = /^\d$/.test(e.key);

    const hasModifier = e.ctrlKey || e.altKey || e.metaKey;
    const atThreeDigits = value.length === 3 && caretIsAtEnd;

    if (isDigit && !hasModifier && atThreeDigits) {
      e.preventDefault();

      if (index < 3) {
        focusChannel(index + 1, 'select');
      }
    }
  };

  const hexColor = getCompleteHex(hexDraft);
  const rgbaColor = getHexFromRgba(rgbaDraft);

  const nextColor = editedFormat === 'hex' ? hexColor : rgbaColor;

  const hasCompleteColor = nextColor !== null;
  const hasEditedColor = editedFormat !== null;

  const hasDifferentColor = nextColor?.toLowerCase() !== pickerColor.toLowerCase();

  const hasManualChanges = hasCompleteColor && hasEditedColor && hasDifferentColor;

  const hexValidationError = hexColor ? null : 'Укажите 6 или 8 HEX-символов';
  const validationError = editedFormat === 'hex' ? hexValidationError : getRgbaError(rgbaDraft);

  const handleApplyColor = () => {
    if (!nextColor || !hasManualChanges || validationError) {
      setShowValidation(true);

      return;
    }

    onColorChange(nextColor);
    onCommit();
  };

  const handleHexBlur = () => {
    setShowValidation(true);
  };

  const handleHexKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') {
      return;
    }

    e.preventDefault();

    setShowValidation(true);

    e.currentTarget.blur();
  };

  const handlePickerPointerUp = () => {
    requestAnimationFrame(onCommit);
  };

  const handlePickerKeyUp = () => {
    requestAnimationFrame(onCommit);
  };

  const applyButtonIsDisabled = !hasManualChanges || Boolean(validationError);
  const showValidationError = showValidation && validationError;

  return (
    <>
      <div className={styles.ColorPropertyHeading}>
        {label}
      </div>

      <fieldset className={styles.ManualColorSection}>
        <legend>
          Ручной ввод
        </legend>

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

            onChange={handleHexChange}
            onBlur={handleHexBlur}
            onKeyDown={handleHexKeyDown}
          />
        </label>

        <div className={styles.RgbaFields} role="group" aria-label="RGBA">
          {CHANNEL_LABELS.map((labelCur, index) => {
            const inputAriaLabel = index === 3 ? 'Альфа (0–100%)' : `Канал ${labelCur} (0–255)`;
            const rangeLabel = index === 3 ? '0–100%' : '0–255';

            const handleInputRef = (val: HTMLInputElement | null) => {
              channelRefs.current[index] = val;
            };

            const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
              e.currentTarget.select();
            };

            const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
              handleChannelChange(index, e);
            };

            const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
              handleChannelKeyDown(index, e);
            };

            const handleBlur = () => {
              handleChannelBlur(index);
            };

            return (
              <label key={labelCur} className={styles.Field}>
                <span>
                  {labelCur}
                </span>

                <InputMask
                  ref={handleInputRef}
                  mask="ddd"
                  replacement={{ d: /[0-9]/ }}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={3}
                  aria-label={inputAriaLabel}
                  value={rgbaDraft[index]}

                  onFocus={handleFocus}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                />

                <small>
                  {rangeLabel}
                </small>
              </label>
            );
          })}
        </div>

        <div className={styles.ColorActions}>
          <button
            type="button"
            disabled={applyButtonIsDisabled}
            onClick={handleApplyColor}
          >
            Применить
          </button>
        </div>

        {showValidationError && (
          <span className={styles.Error} role="alert">
            {validationError}
          </span>
        )}
      </fieldset>

      <div className={styles.ColorPickerSection}>
        <strong>
          Выбор цвета
        </strong>

        <small>
          Изменения через палитру применяются сразу.
        </small>

        <div
          onPointerUp={handlePickerPointerUp}
          onKeyUp={handlePickerKeyUp}
        >
          <HexAlphaColorPicker color={pickerColor} onChange={onColorChange} />
        </div>
      </div>
    </>
  );
};
