import type { ChangeEvent } from 'react';

import type { SideOptions } from '@active-book/book-builder/effects';

import { IntegerInput } from '../../../IntegerInput';
import { Select, Button } from '../../../EffectControls';

type ShadowItem = NonNullable<SideOptions['shadows']>[number];
type SideAnimation = NonNullable<ShadowItem['animation']>;
type AnimationPreset = NonNullable<SideAnimation['preset']>;

type Preset = {
  value: AnimationPreset;
  label: string;
};

type PlaybackState = NonNullable<SideAnimation['playState']>;

type AnimationSettingsProps = {
  animation?: SideAnimation;
  presets: Preset[];
  defaultDuration: number;
  playState?: SideAnimation['playState'];
  onPlaybackChange: (state: PlaybackState) => void;
  onChange: (animation: SideAnimation) => void;
};

export const AnimationSettings = ({
  animation = {},
  presets,
  defaultDuration,
  playState,
  onChange,
  onPlaybackChange,
}: AnimationSettingsProps) => {
  const updateAnimation = (changes: Partial<SideAnimation>) => {
    onChange({
      ...animation,
      ...changes,
    });
  };

  const handlePresetChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateAnimation({ preset: e.target.value as AnimationPreset });
  };

  const handleDurationChange = (val: number) => {
    if (Number.isFinite(val) && val >= 0) {
      updateAnimation({ duration: val });
    }
  };

  const handleDelayChange = (val: number) => {
    if (Number.isFinite(val) && val >= 0) {
      updateAnimation({ delay: val });
    }
  };

  const handleIterationsChange = (val: number) => {
    if (Number.isInteger(val) && val > 0) {
      updateAnimation({ iterations: val });
    }
  };

  const handleIterationsModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'infinite' ? 'infinite' : 1;

    updateAnimation({ iterations: value });
  };

  const handleStart = () => {
    onPlaybackChange('running');
  };

  const handlePause = () => {
    onPlaybackChange('paused');
  };

  const handleStop = () => {
    onPlaybackChange('stopped');
  };

  const iterationsMode = typeof animation.iterations === 'number' ? 'count' : 'infinite';
  const showIterationsInput = iterationsMode === 'count';

  const selectPresetValue = animation.preset ?? presets[0].value;
  const iterationCountInputValue = typeof animation.iterations === 'number' ? animation.iterations : 1;

  return (
    <fieldset>
      <legend>
        Анимация
      </legend>

      <label>
        <span>
          Пресет
        </span>

        <Select value={selectPresetValue} onChange={handlePresetChange}>
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
        <span>
          Длительность цикла (мс)
        </span>

        <IntegerInput
          min={0}
          max={999999}
          value={animation.duration ?? defaultDuration}
          onValueChange={handleDurationChange}
        />
      </label>

      <label>
        <span>
          Задержка (мс)
        </span>

        <IntegerInput
          min={0}
          max={999999}
          value={animation.delay ?? 0}
          onValueChange={handleDelayChange}
        />
      </label>

      <label>
        <span>
          Повторений
        </span>

        <Select
          value={iterationsMode}
          onChange={handleIterationsModeChange}
        >
          <option value="infinite">
            Бесконечно
          </option>

          <option value="count">
            Указать количество
          </option>
        </Select>
      </label>

      {showIterationsInput && (
        <label>
          <span>
            Количество повторений
          </span>

          <IntegerInput
            min={1}
            max={999}
            value={iterationCountInputValue}
            onValueChange={handleIterationsChange}
          />
        </label>
      )}

      <div>
        <Button
          aria-pressed={playState === 'running'}
          onClick={handleStart}
        >
          Старт
        </Button>

        <Button
          aria-pressed={playState === 'paused'}
          onClick={handlePause}
        >
          Пауза
        </Button>

        <Button
          aria-pressed={playState === 'stopped'}
          onClick={handleStop}
        >
          Стоп
        </Button>
      </div>
    </fieldset>
  );
};
