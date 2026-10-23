import type { ChangeEvent, KeyboardEvent } from 'react';
import type { RgbaChannels } from '../../color';

import { useEffect, useRef, useState } from 'react';

import { InputMask, unformat } from '@react-input/mask';
import { HexAlphaColorPicker } from 'react-colorful';

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
  color: string;
  onColorChange: (color: string) => void;
  onCommit: () => void;
};

type EditedFormat = 'hex' | 'rgba' | null;

const CHANNEL_LABELS = ['R', 'G', 'B', 'A'];

const getCompleteHex = (value: string): string | null => {
  const digits = unformat(value, hexMaskOptions);

  if (digits.length !== 6 && digits.length !== 8) {
    return null;
  }

  return getHexColor('#' + digits);
};

export const ColorSettings = ({ color, onColorChange, onCommit }: ColorSettingsProps) => {
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

  const updateChannel = (index: number, value: string) => {
    const updated: RgbaChannels = [...rgbaDraftRef.current];

    updated[index] = value;
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

  const handleHexChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextHex = event.target.value;
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

  const handleChannelChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (/^\d{0,3}$/.test(value)) {
      updateChannel(index, value);
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

  const handleChannelKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const value = rgbaDraftRef.current[index];

    if (event.key === 'Enter') {
      event.preventDefault();
      setShowValidation(true);
      input.blur();

      return;
    }

    if (event.key === 'ArrowRight' && start === value.length && start === end && index < 3) {
      event.preventDefault();
      focusChannel(index + 1, 'start');

      return;
    }

    if (event.key === 'ArrowLeft' && start === 0 && end === 0 && index > 0) {
      event.preventDefault();
      focusChannel(index - 1);

      return;
    }

    if (event.key === 'Backspace') {
      const selectedAll = start === 0 && end === value.length;
      const removingLastDigit = value.length === 1 && start === 1 && end === 1;

      if (selectedAll || removingLastDigit || value === '') {
        event.preventDefault();
        updateChannel(index, '');

        if (index > 0) {
          focusChannel(index - 1);
        }

        return;
      }

      if (start === 0 && end === 0 && index > 0) {
        event.preventDefault();
        focusChannel(index - 1);

        return;
      }
    }

    const isDigit = /^\d$/.test(event.key);

    if (!event.ctrlKey && !event.altKey && !event.metaKey
      && isDigit && value.length === 3 && start === end && start === 3) {
      event.preventDefault();

      if (index < 3) {
        focusChannel(index + 1, 'select');
      }
    }
  };

  const hexColor = getCompleteHex(hexDraft);
  const rgbaColor = getHexFromRgba(rgbaDraft);

  const nextColor = editedFormat === 'hex' ? hexColor : rgbaColor;
  const hasManualChanges = editedFormat !== null && nextColor !== null
    && nextColor.toLowerCase() !== pickerColor.toLowerCase();

  const validationError = editedFormat === 'hex'
    ? (!hexColor ? 'Укажи 6 или 8 HEX-символов' : null)
    : getRgbaError(rgbaDraft);

  const applyColor = () => {
    if (!nextColor || !hasManualChanges || validationError) {
      setShowValidation(true);

      return;
    }

    onColorChange(nextColor);
    onCommit();
  };

  const handlePickerPointerUp = () => {
    requestAnimationFrame(onCommit);
  };

  const handlePickerKeyUp = () => {
    requestAnimationFrame(onCommit);
  };

  return (
    <>
      <div className={styles.ColorPropertyHeading}>Цвет фона (background-color)</div>

      <fieldset className={styles.ManualColorSection}>
        <legend>Ручной ввод</legend>

        <label className={styles.Field}>
          <span>HEX</span>

          <InputMask
            aria-label="HEX"
            {...hexMaskOptions}
            showMask
            placeholder="#RRGGBBAA"
            value={hexDraft}
            spellCheck={false}
            onChange={handleHexChange}
            onBlur={() => setShowValidation(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                setShowValidation(true);
                event.currentTarget.blur();
              }
            }}
          />
        </label>

        <div className={styles.RgbaFields} role="group" aria-label="RGBA">
          {CHANNEL_LABELS.map((label, index) => {
            return (
              <label key={label} className={styles.Field}>
                <span>{label}</span>

                <input
                  ref={(element) => {
                    channelRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={3}
                  aria-label={label === 'A' ? 'Альфа (0–100%)' : `Канал ${label} (0–255)`}
                  value={rgbaDraft[index]}
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) => handleChannelChange(index, event)}
                  onKeyDown={(event) => handleChannelKeyDown(index, event)}
                  onBlur={() => handleChannelBlur(index)}
                />

                <small>{index === 3 ? '0–100%' : '0–255'}</small>
              </label>
            );
          })}
        </div>

        <div className={styles.ColorActions}>
          <button type="button" onClick={applyColor} disabled={!hasManualChanges || Boolean(validationError)}>
            Применить
          </button>
        </div>

        {showValidation && validationError && (
          <span className={styles.Error} role="alert">{validationError}</span>
        )}
      </fieldset>

      <div className={styles.ColorPickerSection}>
        <strong>Выбор цвета</strong>
        <small>Изменения через палитру применяются сразу.</small>

        <div onPointerUp={handlePickerPointerUp} onKeyUp={handlePickerKeyUp}>
          <HexAlphaColorPicker color={pickerColor} onChange={onColorChange} />
        </div>
      </div>
    </>
  );
};
