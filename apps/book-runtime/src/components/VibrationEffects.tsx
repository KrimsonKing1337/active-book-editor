import { useEffect } from 'react';

import { useSelector } from 'activeBook-core/store';
import { configSelectors } from 'activeBook-core/store/config';
import { mainSelectors } from 'activeBook-core/store/main';
import { useVibration } from 'activeBook-core/hooks/effects/vibration';

import type { BuiltVibrationEffect } from '@active-book/book-builder/effects';

type VibrationEffectsProps = {
  effects: BuiltVibrationEffect[];
};

export const VibrationEffects = ({ effects }: VibrationEffectsProps) => {
  const { vibrationOn, vibrationOff } = useVibration();

  const isVibrationAvailable = useSelector(mainSelectors.isVibrationAvailable);
  const vibrationIsEnabled = useSelector(configSelectors.vibration);

  useEffect(() => {
    if (!isVibrationAvailable || !vibrationIsEnabled) {
      return;
    }

    const timers: number[] = [];

    for (const effect of effects) {
      const { duration, delay, playOnLoad } = effect.options;

      if (!playOnLoad || duration <= 0) {
        continue;
      }

      const timer = window.setTimeout(() => {
        vibrationOn(duration);
      }, delay);

      timers.push(timer);
    }

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }

      vibrationOff();
    };
    // The core hook returns new callbacks on each render. Use device/config state as dependencies instead.
  }, [effects, isVibrationAvailable, vibrationIsEnabled]);

  return null;
};
