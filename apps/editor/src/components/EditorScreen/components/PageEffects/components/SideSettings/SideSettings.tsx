import type { ChangeEvent, CSSProperties, FocusEvent } from 'react';

import type { FilterOperation, SideOptions } from '@active-book/book-builder/effects';

import type { SideEffectDraft } from '../../@types';

import { SIDE_SHADOW_PRESETS } from 'activeBook-core/components/SideEffects/components/SideShadow/presets';

import { StyleEditor } from '../StyleEditor';

import { getSidePreviewKey, getSideStylePreviewKey, usePageEffects } from '../../PageEffectsContext';

import { useCustomComponents } from '@project/customComponentRegistry';

import { AnimationSettings } from './components/AnimationSettings';

import { IntegerInput } from '../IntegerInput';
import { CssLengthInput } from '../CssLengthInput';
import { TextInput, Select, Checkbox, Button } from '../EffectControls';

import styles from './SideSettings.module.scss';

type ShadowItem = NonNullable<SideOptions['shadows']>[number];
type TextItem = NonNullable<SideOptions['texts']>[number];
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
  onChange: (changes: Partial<ItemLayout>) => void;
  hidden: boolean;
  onHiddenChange: (hidden: boolean) => void;
};

type PositionOption = {
  value: NonNullable<ItemLayout['position']>;
  label: string;
};

const positions: PositionOption[] = [
  { value: 'top-left', label: 'Сверху слева' },
  { value: 'top', label: 'Сверху' },
  { value: 'top-right', label: 'Сверху справа' },
  { value: 'left', label: 'Слева' },
  { value: 'center', label: 'По центру' },
  { value: 'right', label: 'Справа' },
  { value: 'bottom-left', label: 'Снизу слева' },
  { value: 'bottom', label: 'Снизу' },
  { value: 'bottom-right', label: 'Снизу справа' },
];

const shadowPresets = [...SIDE_SHADOW_PRESETS];

const textPresets = [
  { value: 'scroll' as const, label: 'Прокрутка' },
  { value: 'none' as const, label: 'Без анимации' },
];

const LayoutSettings = ({
  item,
  onChange,
  hidden,
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
          Точка привязки
          <Select value={item.position ?? 'top-left'} onChange={handlePositionChange}>
            {positions.map((positionCur) => {
              return (
                <option key={positionCur.value} value={positionCur.value}>
                  {positionCur.label}
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

  const previewFor = (itemId: string) => {
    const key = getSidePreviewKey(effect.id, itemId);

    return sideItemPreviews[key] ?? {};
  };

  const { shadows = [], texts = [], component } = effect.options;

  const getStyleForItem = (kind: 'shadow' | 'text', itemId: string, style: ShadowItem['style']) => {
    const key = getSideStylePreviewKey(effect.id, kind, itemId);

    return sideStylePreviews[key] ?? style ?? {};
  };

  const commitItemFilters = (kind: 'shadow' | 'text', id: string, styleFilters: FilterOperation[]) => {
    if (!flushStylePreviews()) {
      return;
    }

    const current = getCurrentEffects();
    const currentEffect = current.find((item): item is SideEffectDraft => {
      return item.type === 'side' && item.id === effect.id;
    });

    if (!currentEffect) {
      return;
    }

    const { shadows: currentShadows, texts: currentTexts } = currentEffect.options;

    const nextShadows = kind === 'shadow'
      ? currentShadows?.map((item) => item.id === id ? { ...item, styleFilters } : item)
      : currentShadows;

    const nextTexts = kind === 'text'
      ? currentTexts?.map((item) => item.id === id ? { ...item, styleFilters } : item)
      : currentTexts;

    const updatedOptions = {
      ...currentEffect.options,
      shadows: nextShadows,
      texts: nextTexts,
    };

    onUpdate(effect.id, {
      ...currentEffect,
      options: updatedOptions,
    });
  };

  const updateOptions = (updates: Partial<SideOptions>) => {
    const updatedOptions = {
      ...effect.options,
      ...updates,
    };

    onUpdate(effect.id, {
      ...effect,
      options: updatedOptions,
    });
  };

  const updateShadow = (id: string, changes: Partial<ShadowItem>) => {
    const updated = shadows.map((shadowCur) => {
      if (shadowCur.id !== id) {
        return shadowCur;
      }

      return {
        ...shadowCur,
        ...changes,
      };
    });

    updateOptions({ shadows: updated });
  };

  const updateText = (id: string, changes: Partial<TextItem>) => {
    const updated = texts.map((textCur) => {
      if (textCur.id !== id) {
        return textCur;
      }

      return {
        ...textCur,
        ...changes,
      };
    });

    updateOptions({ texts: updated });
  };

  const addShadow = () => {
    const shadowStyle = {
      color: '#ff0000',
      zIndex: 1,
    };

    const shadowAnimation = {
      preset: 'none' as const,
      duration: 1000,
      iterations: 'infinite' as const,
    };

    const shadow: ShadowItem = {
      id: crypto.randomUUID(),
      position: 'top-left',
      style: shadowStyle,
      thickness: 30,
      animation: shadowAnimation,
    };

    updateOptions({ shadows: [...shadows, shadow] });
  };

  const addText = () => {
    const textStyle = {
      color: '#a3a3a3',
      zIndex: 1,
      fontSize: '12px',
    };

    const textAnimation = {
      preset: 'scroll' as const,
      duration: 60000,
      iterations: 'infinite' as const,
    };

    const text: TextItem = {
      id: crypto.randomUUID(),
      leftText: 'Левая сторона',
      rightText: 'Правая сторона',
      style: textStyle,
      animation: textAnimation,
    };

    updateOptions({ texts: [...texts, text] });
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

  const handleComponentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const definition = definitions.find((cur) => cur.id === e.target.value);

    if (!definition) {
      updateOptions({ component: undefined });

      return;
    }

    const selectedComponent = {
      package: definition.packageName,
      name: definition.name,
    };

    updateOptions({ component: selectedComponent });
  };

  const componentId = component ? `${component.package}/${component.name}` : '';

  const shadowCountLabel = `Боковые тени (${shadows.length})`;
  const textCountLabel = `Боковой текст (${texts.length})`;

  return (
    <div className={styles.Settings}>
      <label className={styles.Field}>
        Название эффекта
        <TextInput maxLength={120} value={effect.slug} onChange={handleNameChange} />
      </label>

      <label className={styles.Field}>
        ID эффекта
        <TextInput key={effect.id} maxLength={80} defaultValue={effect.id} onBlur={handleIdChange} />
      </label>

      <details className={styles.Section}>
        <summary>
          {shadowCountLabel}
        </summary>

        {shadows.map((shadowCur, index) => {
          const {
            id,
            animation,
            style,
            hidden,
            thickness,
            styleFilters,
          } = shadowCur;

          const preset = animation?.preset;
          const selectedPreset = shadowPresets.find((cur) => cur.value === (preset ?? 'none'));
          const canChangeColor = selectedPreset?.canChangeColor ?? true;

          const colorDisabledReason = canChangeColor
            ? undefined
            : 'Цвет этого пресета меняется автоматически. Выбери одноцветный пресет, чтобы настроить его.';

          const handleHiddenChange = (val: boolean) => {
            updateSideItemPreview(effect.id, id, { hidden: val });
          };

          const handleLayoutChange = (val: Partial<ItemLayout>) => {
            updateShadow(id, val);
          };

          const handleThicknessChange = (val: number) => {
            updateShadow(id, { thickness: val });
          };

          const handleStylePreview = (val: CSSProperties) => {
            const update = {
              effectId: effect.id,
              kind: 'shadow' as const,
              itemId: id,
              style: val,
            };

            updateSideStylePreview(update);
          };

          const handleFiltersCommit = (val: FilterOperation[]) => {
            commitItemFilters('shadow', id, val);
          };

          const handleAnimationChange = (val: SideAnimation) => {
            updateShadow(id, { animation: val });
          };

          const handlePlaybackChange = (val: NonNullable<SideAnimation['playState']>) => {
            updateSideItemPreview(effect.id, id, { playState: val });
          };

          const handleDelete = () => {
            const remaining = shadows.filter((cur) => cur.id !== id);

            updateOptions({ shadows: remaining });
          };

          const controller = {
            preview: handleStylePreview,
            commit: flushStylePreviews,
            commitFilters: handleFiltersCommit,
          };

          const nameLabel = `Тень ${index + 1}`;

          return (
            <div key={id} className={styles.Media}>
              <strong>
                {nameLabel}
              </strong>

              <LayoutSettings
                item={shadowCur}
                hidden={previewFor(id).hidden ?? hidden ?? false}
                onHiddenChange={handleHiddenChange}
                onChange={handleLayoutChange}
              />

              <label className={styles.Field}>
                Толщина тени (px)
                <IntegerInput
                  min={0}
                  max={999}
                  value={thickness ?? 30}
                  onValueChange={handleThicknessChange}
                />
              </label>

              <details>
                <summary>
                  Стили тени
                </summary>

                <StyleEditor
                  layer="shadow"
                  colorProperty="color"
                  colorLabel="Цвет тени (color)"
                  colorDisabledReason={colorDisabledReason}
                  defaultZIndex={1}
                  value={getStyleForItem('shadow', id, style)}
                  styleFilters={styleFilters}
                  controller={controller}
                />
              </details>

              <AnimationSettings
                animation={animation}
                playState={previewFor(id).playState}
                onPlaybackChange={handlePlaybackChange}
                presets={shadowPresets}
                defaultDuration={1000}
                onChange={handleAnimationChange}
              />

              <Button
                variant="danger"
                onClick={handleDelete}
              >
                Удалить тень
              </Button>
            </div>
          );
        })}

        <Button variant="success" onClick={addShadow}>
          Добавить тень
        </Button>
      </details>

      <details className={styles.Section}>
        <summary>
          {textCountLabel}
        </summary>

        {texts.map((textCur, index) => {
          const {
            id,
            animation,
            style,
            hidden,
            styleFilters,
            leftText,
            rightText,
          } = textCur;

          const handleLeftTextChange = (e: ChangeEvent<HTMLInputElement>) => {
            updateText(id, { leftText: e.target.value });
          };

          const handleRightTextChange = (e: ChangeEvent<HTMLInputElement>) => {
            updateText(id, { rightText: e.target.value });
          };

          const handleHiddenChange = (val: boolean) => {
            updateSideItemPreview(effect.id, id, { hidden: val });
          };

          const handleLayoutChange = (val: Partial<ItemLayout>) => {
            updateText(id, val);
          };

          const handleFontSizeChange = (val: string) => {
            const updatedStyle = {
              ...style,
              fontSize: val,
            };

            updateText(id, { style: updatedStyle });
          };

          const handleStylePreview = (val: CSSProperties) => {
            const update = {
              effectId: effect.id,
              kind: 'text' as const,
              itemId: id,
              style: val,
            };

            updateSideStylePreview(update);
          };

          const handleFiltersCommit = (val: FilterOperation[]) => {
            commitItemFilters('text', id, val);
          };

          const handleAnimationChange = (val: SideAnimation) => {
            updateText(id, { animation: val });
          };

          const handlePlaybackChange = (val: NonNullable<SideAnimation['playState']>) => {
            updateSideItemPreview(effect.id, id, { playState: val });
          };

          const handleDelete = () => {
            const remaining = texts.filter((cur) => cur.id !== id);

            updateOptions({ texts: remaining });
          };

          const controller = {
            preview: handleStylePreview,
            commit: flushStylePreviews,
            commitFilters: handleFiltersCommit,
          };

          const nameLabel = `Текст ${index + 1}`;

          return (
            <div key={id} className={styles.Media}>
              <strong>
                {nameLabel}
              </strong>

              <label className={styles.Field}>
                Текст слева
                <TextInput
                  maxLength={500}
                  value={leftText}
                  onChange={handleLeftTextChange}
                />
              </label>

              <label className={styles.Field}>
                Текст справа
                <TextInput
                  maxLength={500}
                  value={rightText}
                  onChange={handleRightTextChange}
                />
              </label>

              <LayoutSettings
                item={textCur}
                hidden={previewFor(id).hidden ?? hidden ?? false}
                onHiddenChange={handleHiddenChange}
                onChange={handleLayoutChange}
              />

              <div className={styles.Field}>
                <span>
                  Размер шрифта
                </span>
                <CssLengthInput
                  label="Размер шрифта"
                  allowNegative={false}
                  value={String(style?.fontSize ?? '12px')}
                  onChange={handleFontSizeChange}
                />
              </div>

              <details>
                <summary>
                  Стили текста
                </summary>

                <StyleEditor
                  layer="shadow"
                  colorProperty="color"
                  colorLabel="Цвет текста (color)"
                  additionalColorProperty="backgroundColor"
                  defaultZIndex={1}
                  value={getStyleForItem('text', id, style)}
                  styleFilters={styleFilters}
                  controller={controller}
                />
              </details>

              <AnimationSettings
                animation={animation}
                playState={previewFor(id).playState}
                onPlaybackChange={handlePlaybackChange}
                presets={textPresets}
                defaultDuration={60000}
                onChange={handleAnimationChange}
              />

              <Button
                variant="danger"
                onClick={handleDelete}
              >
                Удалить текст
              </Button>
            </div>
          );
        })}

        <Button variant="success" onClick={addText}>
          Добавить текст
        </Button>
      </details>

      <details className={styles.Section}>
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
      </details>

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
