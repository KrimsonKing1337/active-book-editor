import type { ChangeEvent } from 'react';

import { useEffect, useRef, useState } from 'react';

import { Slider } from 'activeBook-core/components';

import { getBlurPixels, removeLeadingZeros } from '../../utils';

import styles from '../../StyleEditor.module.scss';

type BlurSettingsProps = {
  filter: string | undefined;
  onChange: (blur: number, updateLocal?: boolean) => void;
  onCommit: () => void;
};

export const BlurSettings = ({ filter, onChange, onCommit }: BlurSettingsProps) => {
  const [dragBlur, setDragBlur] = useState<number | null>(null);
  const sliderFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (sliderFrameRef.current !== null) {
        cancelAnimationFrame(sliderFrameRef.current);
      }
    };
  }, []);

  const handleSliderChange = (blur: number) => {
    onChange(blur, false);

    if (sliderFrameRef.current !== null) {
      cancelAnimationFrame(sliderFrameRef.current);
    }

    sliderFrameRef.current = requestAnimationFrame(() => {
      setDragBlur(blur);

      sliderFrameRef.current = null;
    });
  };

  const handleSliderCommit = (blur: number) => {
    if (sliderFrameRef.current !== null) {
      cancelAnimationFrame(sliderFrameRef.current);
    }

    onChange(blur, false);

    // Keep document updates outside react-range's flushSync.
    sliderFrameRef.current = requestAnimationFrame(() => {
      setDragBlur(null);

      onCommit();

      sliderFrameRef.current = null;
    });
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const normalized = removeLeadingZeros(e.target.value);

    e.target.value = normalized;
    const value = Number(normalized);

    if (Number.isFinite(value) && value >= 0) {
      onChange(value);
    }
  };

  const blurValue = getBlurPixels(filter);
  const sliderBlur = Math.min(100, Math.max(0, blurValue));
  const displayedBlur = dragBlur ?? blurValue;

  return (
    <label className={styles.Field}>
      <span>
        Размытие (px)
      </span>

      <div className={styles.RangeFields}>
        <Slider
          className={styles.BlurSlider}
          value={sliderBlur}
          onChange={handleSliderChange}
          onAfterChange={handleSliderCommit}
        />

        <input
          type="number"
          min={0}
          step={1}
          aria-label="Размытие в пикселях"
          value={displayedBlur}
          onChange={handleInputChange}
          onBlur={onCommit}
        />
      </div>
    </label>
  );
};
