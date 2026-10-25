import type { ChangeEvent } from 'react';

import { useEffect, useRef } from 'react';

import { InputMask, unformat } from '@react-input/mask';

import { Slider } from 'activeBook-core/components';

import styles from '../../StyleEditor.module.scss';

export type NumericConfig = {
  min: number;
  max: number;
  step: number;
  unit: string;
  initial: string;
};

type NumericControlProps = {
  value: string;
  config: NumericConfig;
  label: string;
  onChange: (value: string) => void;
};

const numericReplacement = {
  _: /[0-9.-]/,
};

const NUMBER_PATTERN = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;

export const isValidNumericValue = (value: string, config: NumericConfig): boolean => {
  const trimmedValue = value.trim();

  if (!NUMBER_PATTERN.test(trimmedValue)) {
    return false;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return false;
  }

  return number >= config.min && number <= config.max;
};

export const NumericControl = ({ value, config, label, onChange }: NumericControlProps) => {
  const sliderFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (sliderFrameRef.current !== null) {
        cancelAnimationFrame(sliderFrameRef.current);
      }
    };
  }, []);

  const parsedValue = Number(value);
  const current = Number.isFinite(parsedValue) ? parsedValue : config.min;

  const limited = Math.min(config.max, Math.max(config.min, current));
  const range = config.max - config.min;
  const fraction = (limited - config.min) / range;
  const sliderValue = Math.round(fraction * 100);

  const handleSliderChange = (val: number) => {
    const nextValue = config.min + range * val / 100;
    const stepped = Math.round(nextValue / config.step) * config.step;

    if (sliderFrameRef.current !== null) {
      cancelAnimationFrame(sliderFrameRef.current);
    }

    sliderFrameRef.current = requestAnimationFrame(() => {
      const roundedValue = Math.round(stepped * 10000) / 10000;
      const value = String(roundedValue);

      onChange(value);

      sliderFrameRef.current = null;
    });
  };

  const maximum = Math.max(Math.abs(config.min), Math.abs(config.max));
  const integerDigits = String(Math.trunc(maximum)).length;

  const fractionDigits = config.step < 1
    ? (String(config.step).split('.')[1]?.length ?? 2)
    : 0;

  const signDigits = config.min < 0 ? 1 : 0;
  const maskLength = integerDigits + signDigits + fractionDigits + (fractionDigits > 0 ? 1 : 0);

  const maskOptions = {
    mask: '_'.repeat(maskLength),
    replacement: numericReplacement,
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = unformat(e.target.value, maskOptions);

    if (!/^-?(?:\d*(?:\.\d{0,2})?)$/.test(value)) {
      return;
    }

    if (value === '' || value === '-' || value.endsWith('.')) {
      onChange(value);

      return;
    }

    const number = Number(value);
    const bounded = Math.max(config.min, Math.min(config.max, number));

    onChange(String(bounded));
  };

  return (
    <div className={styles.NumericControl}>
      <div className={styles.NumericFields}>
        <Slider
          className={styles.BlurSlider}
          value={sliderValue}
          onChange={handleSliderChange}
        />

        <InputMask
          aria-label={label}
          mask={maskOptions.mask}
          replacement={numericReplacement}
          showMask
          value={value}
          inputMode="decimal"
          spellCheck={false}
          placeholder={config.initial}
          onChange={handleInputChange}
        />

        <span>
          {config.unit}
        </span>
      </div>
    </div>
  );
};
