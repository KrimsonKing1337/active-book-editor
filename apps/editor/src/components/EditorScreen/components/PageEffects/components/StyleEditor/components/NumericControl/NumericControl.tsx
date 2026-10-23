import { useEffect, useRef } from 'react';

import { InputMask } from '@react-input/mask';

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

const NUMBER_PATTERN = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;

export const isValidNumericValue = (value: string, config: NumericConfig): boolean => {
  if (!NUMBER_PATTERN.test(value.trim())) {
    return false;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return false;
  }

  // Slider limits are suggestions. CSS may accept a wider range.
  return config.min >= 0 ? number >= 0 : true;
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
  const sliderValue = Math.round((limited - config.min) / (config.max - config.min) * 100);

  const changeSlider = (position: number) => {
    const nextValue = config.min + (config.max - config.min) * position / 100;
    const stepped = Math.round(nextValue / config.step) * config.step;

    if (sliderFrameRef.current !== null) {
      cancelAnimationFrame(sliderFrameRef.current);
    }

    sliderFrameRef.current = requestAnimationFrame(() => {
      onChange(String(Number(stepped.toFixed(4))));
      sliderFrameRef.current = null;
    });
  };

  return (
    <div className={styles.NumericControl}>
      <div className={styles.NumericFields}>
        <Slider
          className={styles.BlurSlider}
          value={sliderValue}
          onChange={changeSlider}
        />

        <InputMask
          aria-label={label}
          mask="____________"
          replacement={{ _: /[0-9.\-]/ }}
          value={value}
          inputMode="decimal"
          spellCheck={false}
          placeholder={config.initial}
          onChange={(event) => {
            const text = event.target.value;

            if (/^-?\d*(?:\.\d*)?$/.test(text)) {
              onChange(text);
            }
          }}
        />

        <span>{config.unit}</span>
      </div>
    </div>
  );
};
