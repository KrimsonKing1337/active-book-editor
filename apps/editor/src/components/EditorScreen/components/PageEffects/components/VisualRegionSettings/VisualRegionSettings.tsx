import type { ChangeEvent } from 'react';

import type { VisualDisplayRegion } from '@active-book/book-builder/effects';

import { Select } from '../EffectControls';

import styles from './VisualRegionSettings.module.scss';

type VisualRegionSettingsProps = {
  value?: VisualDisplayRegion;
  onChange: (region: VisualDisplayRegion) => void;
};

export const VisualRegionSettings = ({ value = 'storyViewport', onChange }: VisualRegionSettingsProps) => {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const region = e.target.value;

    if (region === 'storyViewport' || region === 'narrativeFrame') {
      onChange(region);
    }
  };

  return (
    <label className={styles.Field}>
      <span>
        Область размещения эффекта
      </span>

      <Select value={value} onChange={handleChange}>
        {value === 'custom' && (
          <option value="custom" disabled>
            Произвольное позиционирование
          </option>
        )}

        <option value="storyViewport">
          Вся поверхность произведения
        </option>

        <option value="narrativeFrame">
          Только нарратив
        </option>
      </Select>

      <small>
        Выбор области заменяет позиционирование на её заполнение.
        Маски сохраняются. Маска рамки относится к нарративу
      </small>
    </label>
  );
};
