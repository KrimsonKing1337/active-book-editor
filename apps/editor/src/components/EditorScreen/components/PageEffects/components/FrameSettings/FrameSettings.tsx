import type {
  ChangeEvent,
  CSSProperties,
  FocusEvent,
} from 'react';

import type { FrameSide } from '@active-book/core/hooks/effects/frame/@types';

import type { VisualLayout } from '@active-book/book-builder/effects';

import { customVisualDefinitionId } from '@active-book/book-builder/visualEffects';

import type { FilterOperation, FrameOptions } from '@active-book/book-builder/effects';

import { useCustomComponents } from '@project/libraries';

import { FrameSideCheckboxes } from './components/FrameSideCheckboxes';
import { LayoutSettings } from './components/LayoutSettings';

import type { FrameEffectDraft } from '../../@types';
import type { StyleEditorController } from '../StyleEditor/hooks';

import {
  getFramePreviewKey,
  getFrameStylePreviewKey,
  usePageEffects,
} from '../../context';

import { StyleEditor } from '../StyleEditor';
import { IntegerInput } from '../IntegerInput';
import { CssLengthInput } from '../CssLengthInput';
import {
  TextInput,
  Select,
  Button,
} from '../EffectControls';
import { VisualRegionSettings } from '../VisualRegionSettings';

import { AnimationSettings } from './components';

import { shadowPresets, textPresets } from './constants';

import styles from './FrameSettings.module.scss';

type ShadowItem = NonNullable<FrameOptions['shadow']>;
type TextItem = NonNullable<FrameOptions['text']>;
type FrameAnimation = NonNullable<ShadowItem['animation']>;
type Kind = 'shadow' | 'text' | 'component';

export type FrameSettingsProps = {
  effect: FrameEffectDraft;
  onUpdate: (previousId: string, effect: FrameEffectDraft) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export const FrameSettings = ({
  effect,
  onUpdate,
  onDuplicate,
  onDelete,
}: FrameSettingsProps) => {
  const { visualDefinitions } = useCustomComponents();

  const definitions = visualDefinitions.filter((definitionCur) => {
    return definitionCur.category === 'frame';
  });

  const {
    frameItemPreviews,
    frameStylePreviews,
    updateFrameItemPreview,
    updateFrameStylePreview,
    flushStylePreviews,
    getCurrentEffects,
  } = usePageEffects();

  const {
    shadow,
    text,
    component,
  } = effect.options;

  const item = effect.kind === 'shadow' ? shadow : text;
  const previewKey = item ? getFramePreviewKey(effect.id, item.id) : '';

  const preview = frameItemPreviews[previewKey] ?? {};
  const previewIsHidden = preview.hidden ?? item?.hidden ?? false;

  const updateOptions = (updates: Partial<FrameOptions>) => {
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

  const getItemStyle = ({
    kind,
    id,
    style,
  }: {
    kind: Kind;
    id: string;
    style?: CSSProperties;
  }) => {
    const key = getFrameStylePreviewKey({
      effectId: effect.id,
      kind,
      itemId: id,
    });

    return frameStylePreviews[key] ?? style ?? {};
  };

  const handleStylePreview = ({
    kind,
    itemId,
    style,
  }: {
    kind: Kind;
    itemId: string;
    style: CSSProperties;
  }) => {
    updateFrameStylePreview({
      effectId: effect.id,
      kind,
      itemId,
      style,
    });
  };

  const commitItemFilters = (kind: Kind, styleFilters: FilterOperation[]) => {
    if (!flushStylePreviews()) {
      return;
    }

    const currentEffect = getCurrentEffects().find((effectCur): effectCur is FrameEffectDraft => {
      return effectCur.type === 'frame' && effectCur.id === effect.id;
    });

    if (!currentEffect) {
      return;
    }

    const options = { ...currentEffect.options };

    if (kind === 'shadow' && options.shadow) {
      options.shadow = {
        ...options.shadow,
        styleFilters,
      };
    } else if (kind === 'text' && options.text) {
      options.text = {
        ...options.text,
        styleFilters,
      };
    } else if (kind === 'component') {
      options.styleFilters = styleFilters;
    }

    onUpdate(effect.id, {
      ...currentEffect,
      options,
    });
  };

  const handlePlaybackChange = (state: NonNullable<FrameAnimation['playState']>) => {
    if (item) {
      const update = {
        effectId: effect.id,
        itemId: item.id,
        changes: { playState: state },
      };

      updateFrameItemPreview(update);
    }
  };

  const handleHiddenChange = (hidden: boolean) => {
    if (item) {
      const update = {
        effectId: effect.id,
        itemId: item.id,
        changes: { hidden },
      };

      updateFrameItemPreview(update);
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

  const handleLayoutChange = (layout: VisualLayout) => {
    onUpdate(effect.id, {
      ...effect,
      ...layout,
    });
  };

  const handleComponentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const definition = definitions.find((definitionCur) => {
      return definitionCur.id === e.target.value;
    });

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

  const componentId = component ? customVisualDefinitionId('frame', `${component.package}/${component.name}`) : '';

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

  const handleShadowAnimationChange = (val: FrameAnimation) => {
    updateShadow({ animation: val });
  };

  const handleTextAnimationChange = (val: FrameAnimation) => {
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
        handleStylePreview({
          kind: 'shadow',
          itemId: shadow.id,
          style: val,
        });
      }
    },

    commit: flushStylePreviews,
    commitFilters: (val) => commitItemFilters('shadow', val),
  };

  const textController: StyleEditorController = {
    preview: (val) => {
      if (text) {
        handleStylePreview({
          kind: 'text',
          itemId: text.id,
          style: val,
        });
      }
    },

    commit: flushStylePreviews,
    commitFilters: (val) => commitItemFilters('text', val),
  };

  const componentController: StyleEditorController = {
    preview: (val) => handleStylePreview({
      kind: 'component',
      itemId: effect.id,
      style: val,
    }),
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

  const styleEditorComponentStyle = getItemStyle({
    kind: 'component',
    id: effect.id,
    style: effect.options.style,
  });

  let styleEditorTextStyle = {};

  if (text) {
    styleEditorTextStyle = getItemStyle({
      kind: 'text',
      id: text.id,
      style: text.style,
    });
  }

  let styleEditorShadowStyle = {};

  if (shadow) {
    styleEditorShadowStyle = getItemStyle({
      kind: 'shadow',
      id: shadow.id,
      style: shadow.style,
    });
  }

  const textFontSize = String(text?.style?.fontSize ?? '12px');

  return (
    <div className={styles.Settings}>
      <label className={styles.Field}>
        <span>
          Название эффекта
        </span>

        <TextInput
          maxLength={120}
          value={effect.slug}
          onChange={handleNameChange}
        />
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

      <VisualRegionSettings
        placement={effect.placement}
        depth={effect.depth}
        visibility={effect.visibility}
        defaultPlane="belowNarrative"
        onChange={handleLayoutChange}
      />

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

            <FrameSideCheckboxes
              selectedSides={shadow.sides}
              onChange={handleSideChange}
            />
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
              value={styleEditorShadowStyle}
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
              value={textFontSize}
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
              value={styleEditorTextStyle}
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

          <details>
            <summary>
              Стили слоя
            </summary>

            <StyleEditor
              layer="background"
              value={styleEditorComponentStyle}
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
