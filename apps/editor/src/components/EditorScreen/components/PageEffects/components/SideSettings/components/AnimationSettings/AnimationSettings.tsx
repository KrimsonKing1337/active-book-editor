import type { ChangeEvent } from 'react';

import type { SideOptions } from '@active-book/book-builder/effects';

type ShadowItem = NonNullable<SideOptions['shadows']>[number];
type SideAnimation = NonNullable<ShadowItem['animation']>;
type AnimationPreset = NonNullable<SideAnimation['preset']>;

type AnimationSettingsProps = {
  animation?: SideAnimation;
  presets: Array<{ value: AnimationPreset; label: string }>;
  onChange: (animation: SideAnimation) => void;
};

export const AnimationSettings = ({ animation = {}, presets, onChange }: AnimationSettingsProps) => {
  const updateAnimation = (changes: Partial<SideAnimation>) => {
    onChange({
      ...animation,
      ...changes,
    });
  };

  const handlePresetChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateAnimation({ preset: e.target.value as AnimationPreset });
  };

  const handleDurationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const duration = Number(e.target.value);

    if (Number.isFinite(duration) && duration >= 0) {
      updateAnimation({ duration });
    }
  };

  const handleDelayChange = (e: ChangeEvent<HTMLInputElement>) => {
    const delay = Number(e.target.value);

    if (Number.isFinite(delay) && delay >= 0) {
      updateAnimation({ delay });
    }
  };

  const handleIterationsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const iterations = Number(e.target.value);

    if (Number.isInteger(iterations) && iterations > 0) {
      updateAnimation({ iterations });
    }
  };

  const handleInfiniteChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateAnimation({ iterations: e.target.checked ? 'infinite' : 1 });
  };

  return (
    <fieldset>
      <legend>Анимация</legend>

      <label>
        Пресет
        <select value={animation.preset ?? presets[0].value} onChange={handlePresetChange}>
          {presets.map((presetCur) => {
            return (
              <option key={presetCur.value} value={presetCur.value}>
                {presetCur.label}
              </option>
            );
          })}
        </select>
      </label>

      <label>
        Длительность цикла (мс)
        <input
          type="number"
          min="0"
          step="100"
          value={animation.duration ?? 1000}
          onChange={handleDurationChange}
        />
      </label>

      <label>
        Задержка (мс)
        <input
          type="number"
          min="0"
          step="100"
          value={animation.delay ?? 0}
          onChange={handleDelayChange}
        />
      </label>

      <label>
        Повторений
        <input
          type="number"
          min="1"
          step="1"
          disabled={animation.iterations === 'infinite' || animation.iterations === undefined}
          value={typeof animation.iterations === 'number' ? animation.iterations : 1}
          onChange={handleIterationsChange}
        />
      </label>

      <label>
        <input
          type="checkbox"
          checked={animation.iterations === 'infinite' || animation.iterations === undefined}
          onChange={handleInfiniteChange}
        />
        Бесконечно
      </label>

      <div>
        <button type="button" onClick={() => updateAnimation({ playState: 'running' })}>
          Старт
        </button>
        <button type="button" onClick={() => updateAnimation({ playState: 'paused' })}>
          Пауза
        </button>
        <button type="button" onClick={() => updateAnimation({ playState: 'stopped' })}>
          Стоп
        </button>
      </div>
    </fieldset>
  );
};
