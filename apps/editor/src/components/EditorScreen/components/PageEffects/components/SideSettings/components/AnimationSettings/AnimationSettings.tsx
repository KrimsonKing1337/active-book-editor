import type { ChangeEvent } from 'react';

import type { SideOptions } from '@active-book/book-builder/effects';

import { IntegerInput } from '../../../IntegerInput';
import { Select, Button } from '../../../EffectControls';

type ShadowItem = NonNullable<SideOptions['shadows']>[number];
type SideAnimation = NonNullable<ShadowItem['animation']>;
type AnimationPreset = NonNullable<SideAnimation['preset']>;

type AnimationSettingsProps = {
  animation?: SideAnimation;
  presets: Array<{ value: AnimationPreset; label: string }>;
  defaultDuration: number;
  playState?: SideAnimation['playState'];
  onPlaybackChange: (state: NonNullable<SideAnimation['playState']>) => void;
  onChange: (animation: SideAnimation) => void;
};

export const AnimationSettings = ({ animation = {}, presets, defaultDuration, playState, onChange, onPlaybackChange }: AnimationSettingsProps) => {
  const updateAnimation = (changes: Partial<SideAnimation>) => {
    onChange({
      ...animation,
      ...changes,
    });
  };

  const handlePresetChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateAnimation({ preset: e.target.value as AnimationPreset });
  };

  const handleDurationChange = (duration: number) => {

    if (Number.isFinite(duration) && duration >= 0) {
      updateAnimation({ duration });
    }
  };

  const handleDelayChange = (delay: number) => {

    if (Number.isFinite(delay) && delay >= 0) {
      updateAnimation({ delay });
    }
  };

  const handleIterationsChange = (iterations: number) => {

    if (Number.isInteger(iterations) && iterations > 0) {
      updateAnimation({ iterations });
    }
  };

  const handleIterationsModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateAnimation({ iterations: e.target.value === 'infinite' ? 'infinite' : 1 });
  };

  return (
    <fieldset>
      <legend>Анимация</legend>

      <label>
        Пресет
        <Select value={animation.preset ?? presets[0].value} onChange={handlePresetChange}>
          {presets.map((presetCur) => {
            return (
              <option key={presetCur.value} value={presetCur.value}>
                {presetCur.label}
              </option>
            );
          })}
        </Select>
      </label>

      <label>
        Длительность цикла (мс)
        <IntegerInput
          min={0}
          max={999999}
          value={animation.duration ?? defaultDuration}
          onValueChange={handleDurationChange}
        />
      </label>

      <label>
        Задержка (мс)
        <IntegerInput
          min={0}
          max={999999}
          value={animation.delay ?? 0}
          onValueChange={handleDelayChange}
        />
      </label>

      <label>
        Повторений
        <Select
          value={typeof animation.iterations === 'number' ? 'count' : 'infinite'}
          onChange={handleIterationsModeChange}
        >
          <option value="infinite">Бесконечно</option>
          <option value="count">Указать количество</option>
        </Select>
      </label>

      {typeof animation.iterations === 'number' && (
        <label>
          Количество повторений
          <IntegerInput
            min={1}
            max={999}
            value={animation.iterations}
            onValueChange={handleIterationsChange}
          />
        </label>
      )}

      <div>
        <Button type="button" aria-pressed={playState === 'running'} onClick={() => onPlaybackChange('running')}>
          Старт
        </Button>
        <Button type="button" aria-pressed={playState === 'paused'} onClick={() => onPlaybackChange('paused')}>
          Пауза
        </Button>
        <Button type="button" aria-pressed={playState === 'stopped'} onClick={() => onPlaybackChange('stopped')}>
          Стоп
        </Button>
      </div>
    </fieldset>
  );
};
