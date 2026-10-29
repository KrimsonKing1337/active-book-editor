import type { ChangeEvent, CSSProperties, FocusEvent } from 'react';

import type { FrameMask, FrameSide } from 'activeBook-core/hooks/effects/side/@types';

import type { FilterOperation, SideOptions } from '@active-book/book-builder/effects';

import { useCustomComponents } from '@project/customComponentRegistry';

import type { SideEffectDraft } from '../../@types';
import type { StyleEditorController } from '../StyleEditor/hooks';

import { getSidePreviewKey, getSideStylePreviewKey, usePageEffects } from '../../context';

import { StyleEditor } from '../StyleEditor';
import { IntegerInput } from '../IntegerInput';
import { CssLengthInput } from '../CssLengthInput';
import { TextInput, Select, Checkbox, Button } from '../EffectControls';

import { AnimationSettings } from './components/AnimationSettings';

import { frameSides, positions, shadowPresets, textPresets } from './constants';

import styles from './SideSettings.module.scss';

type ShadowItem = NonNullable<SideOptions['shadow']>;
type TextItem = NonNullable<SideOptions['text']>;
type SideAnimation = NonNullable<ShadowItem['animation']>;
type ItemLayout = Pick<ShadowItem, 'position' | 'offsetX' | 'offsetY' | 'hidden'>;

type SideSettingsProps = {
  effect: SideEffectDraft;

  onUpdate: (previousId: string, effect: SideEffectDraft) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

type LayoutSettingsProps = {
  item: ItemLayout;
  hidden: boolean;

  onChange: (changes: Partial<ItemLayout>) => void;
  onHiddenChange: (hidden: boolean) => void;
};

const LayoutSettings = ({
  item,
  hidden,

  onChange,
  onHiddenChange,
}: LayoutSettingsProps) => {
  const handlePositionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange({ position: e.target.value as ItemLayout['position'] });
  };

  const handleOffsetXChange = (val: string) => {
    onChange({ offsetX: val });
  };

  const handleOffsetYChange = (val: string) => {
    onChange({ offsetY: val });
  };

  const handleHiddenChange = (e: ChangeEvent<HTMLInputElement>) => {
    onHiddenChange(e.target.checked);
  };

  return (
    <>
      <div className={styles.Layout}>
        <label className={styles.Field}>
          <span>
            Точка привязки
          </span>

          <Select value={item.position ?? 'top-left'} onChange={handlePositionChange}>
            {positions.map((positionCur) => {
              const { value, label } = positionCur;

              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </Select>
        </label>

        <div className={styles.Field}>
          <span>
            Смещение X
          </span>

          <CssLengthInput
            label="Смещение X"
            value={item.offsetX ?? '0px'}
            onChange={handleOffsetXChange}
          />
        </div>

        <div className={styles.Field}>
          <span>
            Смещение Y
          </span>

          <CssLengthInput
            label="Смещение Y"
            value={item.offsetY ?? '0px'}
            onChange={handleOffsetYChange}
          />
        </div>
      </div>

      <div className={styles.Controls}>
        <Checkbox checked={hidden} onChange={handleHiddenChange}>
          Скрыть элемент
        </Checkbox>
      </div>
    </>
  );
};

export const SideSettings = ({ effect, onUpdate, onDuplicate, onDelete }: SideSettingsProps) => {
  const { definitions } = useCustomComponents();

  const {
    sideItemPreviews,
    sideStylePreviews,
    updateSideItemPreview,
    updateSideStylePreview,
    flushStylePreviews,
    getCurrentEffects,
  } = usePageEffects();

  const { shadow, text, component } = effect.options;
  const componentMask: FrameMask = effect.options.frameMask ?? {
    enabled: false,
    sides: ['top', 'right', 'bottom', 'left'],
  };
  const item = effect.kind === 'shadow' ? shadow : text;
  const previewKey = item ? getSidePreviewKey(effect.id, item.id) : '';
  const preview = sideItemPreviews[previewKey] ?? {};
  const previewIsHidden = preview.hidden ?? item?.hidden ?? false;

  const updateOptions = (updates: Partial<SideOptions>) => {
    const options = {
      ...effect.options,
      ...updates,
    };

    const updatedEffect = {
      ...effect,
      options,
    };

    onUpdate(effect.id, updatedEffect);
  };

  const updateShadow = (changes: Partial<ShadowItem>) => {
    if (shadow) {
      const updatedShadow = {
        ...shadow,
        ...changes,
      };

      updateOptions({ shadow: updatedShadow });
    }
  };

  const updateText = (changes: Partial<TextItem>) => {
    if (text) {
      const updatedText = {
        ...text,
        ...changes,
      };

      updateOptions({ text: updatedText });
    }
  };

  const getItemStyle = (kind: 'shadow' | 'text' | 'component', id: string, style?: CSSProperties) => {
    const key = getSideStylePreviewKey({
      effectId: effect.id,
      kind,
      itemId: id,
    });

    return sideStylePreviews[key] ?? style ?? {};
  };

  const handleStylePreview = (kind: 'shadow' | 'text' | 'component', itemId: string, style: CSSProperties) => {
    updateSideStylePreview({
      effectId: effect.id,
      kind,
      itemId,
      style,
    });
  };

  const commitItemFilters = (kind: 'shadow' | 'text' | 'component', styleFilters: FilterOperation[]) => {
    if (!flushStylePreviews()) {
      return;
    }

    const currentEffect = getCurrentEffects().find((current): current is SideEffectDraft => {
      return current.type === 'side' && current.id === effect.id;
    });

    if (!currentEffect) {
      return;
    }

    const options = { ...currentEffect.options };

    if (kind === 'shadow' && options.shadow) {
      options.shadow = { ...options.shadow, styleFilters };
    } else if (kind === 'text' && options.text) {
      options.text = { ...options.text, styleFilters };
    } else if (kind === 'component') {
      options.styleFilters = styleFilters;
    }

    onUpdate(effect.id, { ...currentEffect, options });
  };

  const handlePlaybackChange = (state: NonNullable<SideAnimation['playState']>) => {
    if (item) {
      const update = {
        effectId: effect.id,
        itemId: item.id,
        changes: { playState: state },
      };

      updateSideItemPreview(update);
    }
  };

  const handleHiddenChange = (hidden: boolean) => {
    if (item) {
      const update = {
        effectId: effect.id,
        itemId: item.id,
        changes: { hidden },
      };

      updateSideItemPreview(update);
    }
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const updatedEffect = {
      ...effect,
      slug: e.target.value,
    };

    onUpdate(effect.id, updatedEffect);
  };

  const handleIdChange = (e: FocusEvent<HTMLInputElement>) => {
    const updatedEffect = {
      ...effect,
      id: e.target.value,
    };

    onUpdate(effect.id, updatedEffect);
  };

  const handleComponentMaskEnabledChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateOptions({
      frameMask: {
        ...componentMask,
        enabled: e.target.checked,
      },
    });
  };

  const handleComponentMaskSideChange = (side: FrameSide, isEnabled: boolean) => {
    let sides = [...componentMask.sides, side];

    if (!isEnabled) {
      sides = componentMask.sides.filter((cur) => cur !== side);
    }

    updateOptions({
      frameMask: {
        ...componentMask,
        sides,
      },
    });
  };

  const handleComponentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const definition = definitions.find((current) => current.id === e.target.value);

    if (!definition) {
      updateOptions({ component: undefined });
      return;
    }

    const updatedComponent = {
      package: definition.packageName,
      name: definition.name,
    };

    updateOptions({ component: updatedComponent });
  };

  const componentId = component ? `${component.package}/${component.name}` : '';

  const handleThicknessChange = (val: number) => {
    updateShadow({ thickness: val });
  };

  const handleSideChange = (side: FrameSide, isEnabled: boolean) => {
    if (!shadow) {
      return;
    }

    let sides = [...shadow.sides, side];

    if (!isEnabled) {
      sides = shadow.sides.filter((cur) => cur !== side);
    }

    updateShadow({ sides });
  };

  const handleShadowAnimationChange = (val: SideAnimation) => {
    updateShadow({ animation: val });
  };

  const handleTextAnimationChange = (val: SideAnimation) => {
    updateText({ animation: val });
  };

  const handleLeftTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateText({ leftText: e.target.value });
  };

  const handleRightTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateText({ rightText: e.target.value });
  };

  const handleFontSizeChange = (val: string) => {
    const updatedStyle = {
      ...text?.style,
      fontSize: val,
    };

    updateText({ style: updatedStyle });
  };

  const shadowController: StyleEditorController = {
    preview: (val) => {
      if (shadow) {
        handleStylePreview('shadow', shadow.id, val);
      }
    },
    commit: flushStylePreviews,
    commitFilters: (val) => commitItemFilters('shadow', val),
  };

  const textController: StyleEditorController = {
    preview: (val) => {
      if (text) {
        handleStylePreview('text', text.id, val);
      }
    },
    commit: flushStylePreviews,
    commitFilters: (val) => commitItemFilters('text', val),
  };

  const componentController: StyleEditorController = {
    preview: (val) => handleStylePreview('component', effect.id, val),
    commit: flushStylePreviews,
    commitFilters: (val) => commitItemFilters('component', val),
  };

  let colorDisabledReason: string | undefined;

  if (shadow) {
    const selectedPreset = shadowPresets.find((presetCur) => {
      const animationPreset = shadow.animation?.preset ?? 'none';

      return presetCur.value === animationPreset;
    });

    const canChangeColor = selectedPreset?.canChangeColor ?? false;

    if (!canChangeColor) {
      colorDisabledReason = 'Цвет этого пресета меняется автоматически. Выберите одноцветный пресет';
    }
  }

  return (
    <div className={styles.Settings}>
      <label className={styles.Field}>
        <span>
          Название эффекта
        </span>

        <TextInput maxLength={120} value={effect.slug} onChange={handleNameChange} />
      </label>

      <label className={styles.Field}>
        <span>
          ID эффекта
        </span>

        <TextInput
          key={effect.id}
          maxLength={80}
          defaultValue={effect.id}
          onBlur={handleIdChange}
        />
      </label>

      {effect.kind === 'shadow' && shadow && (
        <>
          <LayoutSettings
            item={shadow}
            hidden={previewIsHidden}
            onHiddenChange={handleHiddenChange}
            onChange={updateShadow}
          />

          <div className={styles.Field}>
            <span>
              Стороны
            </span>

            <div className={styles.Sides}>
              {frameSides.map((sideCur) => {
                const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
                  handleSideChange(sideCur.value, e.target.checked);
                };

                return (
                  <Checkbox
                    key={sideCur.value}
                    checked={shadow.sides.includes(sideCur.value)}
                    onChange={handleChange}
                  >
                    {sideCur.label}
                  </Checkbox>
                );
              })}
            </div>
          </div>

          <label className={styles.Field}>
            <span>
              Толщина тени (px)
            </span>

            <IntegerInput
              min={0}
              max={999}
              value={shadow.thickness ?? 30}
              onValueChange={handleThicknessChange}
            />
          </label>

          <details className={styles.Section}>
            <summary>
              Стили тени
            </summary>

            <StyleEditor
              layer="shadow"
              colorProperty="color"
              colorLabel="Цвет тени (color)"
              colorDisabledReason={colorDisabledReason}
              defaultZIndex={1}
              value={getItemStyle('shadow', shadow.id, shadow.style)}
              styleFilters={shadow.styleFilters}
              controller={shadowController}
            />
          </details>

          <AnimationSettings
            animation={shadow.animation}
            playState={preview.playState}
            presets={shadowPresets}
            defaultDuration={1000}
            onPlaybackChange={handlePlaybackChange}
            onChange={handleShadowAnimationChange}
          />
        </>
      )}

      {effect.kind === 'text' && text && (
        <>
          <label className={styles.Field}>
            <span>
              Текст слева
            </span>

            <TextInput
              maxLength={500}
              value={text.leftText}
              onChange={handleLeftTextChange}
            />
          </label>

          <label className={styles.Field}>
            <span>
              Текст справа
            </span>

            <TextInput
              maxLength={500}
              value={text.rightText}
              onChange={handleRightTextChange}
            />
          </label>

          <LayoutSettings
            item={text}
            hidden={previewIsHidden}
            onHiddenChange={handleHiddenChange}
            onChange={updateText}
          />

          <div className={styles.Field}>
            <span>
              Размер шрифта
            </span>

            <CssLengthInput
              label="Размер шрифта"
              allowNegative={false}
              value={String(text.style?.fontSize ?? '12px')}
              onChange={handleFontSizeChange}
            />
          </div>

          <details className={styles.Section}>
            <summary>
              Стили текста
            </summary>

            <StyleEditor
              layer="shadow"
              colorProperty="color"
              colorLabel="Цвет текста (color)"
              additionalColorProperty="backgroundColor"
              defaultZIndex={1}
              value={getItemStyle('text', text.id, text.style)}
              styleFilters={text.styleFilters}
              controller={textController}
            />
          </details>

          <AnimationSettings
            animation={text.animation}
            playState={preview.playState}
            presets={textPresets}
            defaultDuration={60000}
            onPlaybackChange={handlePlaybackChange}
            onChange={handleTextAnimationChange}
          />
        </>
      )}

      {effect.kind === 'component' && (
        <details className={styles.Section} open>
          <summary>
            Кастомный компонент
          </summary>

          <Select value={componentId} onChange={handleComponentChange}>
            <option value="">
              Не использовать
            </option>

            {definitions.map((definitionCur) => {
              const { id, title } = definitionCur;

              return (
                <option key={id} value={id}>
                  {title}
                </option>
              );
            })}
          </Select>

          <div className={styles.Field}>
            <span>
              Область отображения
            </span>

            <Checkbox checked={componentMask.enabled} onChange={handleComponentMaskEnabledChange}>
              Ограничить рамкой
            </Checkbox>

            {componentMask.enabled && (
              <div className={styles.Sides}>
                {frameSides.map((sideCur) => {
                  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
                    handleComponentMaskSideChange(sideCur.value, e.target.checked);
                  };

                  return (
                    <Checkbox
                      key={sideCur.value}
                      checked={componentMask.sides.includes(sideCur.value)}
                      onChange={handleChange}
                    >
                      {sideCur.label}
                    </Checkbox>
                  );
                })}
              </div>
            )}
          </div>

          <details>
            <summary>
              Стили слоя
            </summary>

            <StyleEditor
              layer="background"
              defaultZIndex={1}
              value={getItemStyle('component', effect.id, effect.options.style)}
              styleFilters={effect.options.styleFilters}
              controller={componentController}
            />
          </details>
        </details>
      )}

      <div className={styles.Actions}>
        <Button onClick={onDuplicate}>
          Дублировать эффект
        </Button>

        <Button variant="danger" onClick={onDelete}>
          Удалить эффект
        </Button>
      </div>
    </div>
  );
};
