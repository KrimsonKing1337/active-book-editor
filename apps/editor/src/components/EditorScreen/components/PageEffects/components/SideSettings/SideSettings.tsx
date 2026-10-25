import type { ChangeEvent, FocusEvent } from 'react';

import type { FilterOperation, SideOptions } from '@active-book/book-builder/effects';

import { SIDE_SHADOW_PRESETS } from 'activeBook-core/components/SideEffects/components/SideShadow/presets';

import { StyleEditor } from '../StyleEditor';

import type { SideEffectDraft } from '../../@types';

import { getSidePreviewKey, getSideStylePreviewKey, usePageEffects } from '../../PageEffectsContext';

import { useCustomComponents } from '@project/customComponentRegistry';

import { AnimationSettings } from './components/AnimationSettings';

import { IntegerInput } from '../IntegerInput';
import { CssLengthInput } from '../CssLengthInput';
import { TextInput, Select, Checkbox, Button } from '../EffectControls';

import styles from './SideSettings.module.scss';

type ShadowItem = NonNullable<SideOptions['shadows']>[number];
type TextItem = NonNullable<SideOptions['texts']>[number];
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

const positions: Array<{ value: NonNullable<ItemLayout['position']>; label: string }> = [
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

  const handleOffsetXChange = (value: string) => {
    onChange({ offsetX: value });
  };

  const handleOffsetYChange = (value: string) => {
    onChange({ offsetY: value });
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
          <span>Смещение X</span>
          <CssLengthInput
            label="Смещение X"
            value={item.offsetX ?? '0px'}
            onChange={handleOffsetXChange}
          />
        </div>

        <div className={styles.Field}>
          <span>Смещение Y</span>
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

    onUpdate(effect.id, {
      ...currentEffect,
      options: {
        ...currentEffect.options,
        shadows: nextShadows,
        texts: nextTexts,
      },
    });
  };

  const updateOptions = (updates: Partial<SideOptions>) => {
    onUpdate(effect.id, {
      ...effect,
      options: {
        ...effect.options,
        ...updates,
      },
    });
  };

  const updateShadow = (id: string, changes: Partial<ShadowItem>) => {
    const updated = shadows.map((shadowCur) => {
      return shadowCur.id === id ? { ...shadowCur, ...changes } : shadowCur;
    });

    updateOptions({ shadows: updated });
  };

  const updateText = (id: string, changes: Partial<TextItem>) => {
    const updated = texts.map((textCur) => {
      return textCur.id === id ? { ...textCur, ...changes } : textCur;
    });

    updateOptions({ texts: updated });
  };

  const addShadow = () => {
    const shadow: ShadowItem = {
      id: crypto.randomUUID(),
      position: 'top-left',
      style: { color: '#ff0000', zIndex: 1 },
      thickness: 30,
      animation: { preset: 'none', duration: 1000, iterations: 'infinite' },
    };

    updateOptions({ shadows: [...shadows, shadow] });
  };

  const addText = () => {
    const text: TextItem = {
      id: crypto.randomUUID(),
      leftText: 'Левая сторона',
      rightText: 'Правая сторона',
      style: { color: '#a3a3a3', zIndex: 1, fontSize: '12px' },
      animation: { preset: 'scroll', duration: 60000, iterations: 'infinite' },
    };

    updateOptions({ texts: [...texts, text] });
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    onUpdate(effect.id, { ...effect, slug: e.target.value });
  };

  const handleIdChange = (e: FocusEvent<HTMLInputElement>) => {
    onUpdate(effect.id, { ...effect, id: e.target.value });
  };

  const handleComponentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const definition = definitions.find((cur) => cur.id === e.target.value);

    if (!definition) {
      updateOptions({ component: undefined });

      return;
    }

    updateOptions({
      component: {
        package: definition.packageName,
        name: definition.name,
      },
    });
  };

  const componentId = component ? `${component.package}/${component.name}` : '';

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
        <summary>Боковые тени ({shadows.length})</summary>

        {shadows.map((shadowCur, index) => {
          const preset = shadowCur.animation?.preset;
          const selectedPreset = shadowPresets.find((item) => item.value === (preset ?? 'none'));
          const canChangeColor = selectedPreset?.canChangeColor ?? true;

          const colorDisabledReason = canChangeColor
            ? undefined
            : 'Цвет этого пресета меняется автоматически. Выбери одноцветный пресет, чтобы настроить его.';

          return (
            <div key={shadowCur.id} className={styles.Media}>
              <strong>Тень {index + 1}</strong>

              <LayoutSettings
                item={shadowCur}
                hidden={previewFor(shadowCur.id).hidden ?? shadowCur.hidden ?? false}
                onHiddenChange={(hidden) => updateSideItemPreview(effect.id, shadowCur.id, { hidden })}
                onChange={(changes) => updateShadow(shadowCur.id, changes)}
              />

              <label className={styles.Field}>
                Толщина тени (px)
                <IntegerInput
                  min={0}
                  max={999}
                  value={shadowCur.thickness ?? 30}
                  onValueChange={(thickness) => updateShadow(shadowCur.id, { thickness })}
                />
              </label>

              <details>
                <summary>Стили тени</summary>

                <StyleEditor
                  layer="shadow"
                  colorProperty="color"
                  colorLabel="Цвет тени (color)"
                  colorDisabledReason={colorDisabledReason}
                  defaultZIndex={1}
                  value={getStyleForItem('shadow', shadowCur.id, shadowCur.style)}
                  styleFilters={shadowCur.styleFilters}
                  controller={{
                    preview: (style) => updateSideStylePreview(effect.id, 'shadow', shadowCur.id, style),
                    commit: flushStylePreviews,
                    commitFilters: (filters) => commitItemFilters('shadow', shadowCur.id, filters),
                  }}
                />
              </details>

              <AnimationSettings
                animation={shadowCur.animation}
                playState={previewFor(shadowCur.id).playState}
                onPlaybackChange={(playState) => updateSideItemPreview(effect.id, shadowCur.id, { playState })}
                presets={shadowPresets}
                defaultDuration={1000}
                onChange={(animation) => updateShadow(shadowCur.id, { animation })}
              />

              <Button
                variant="danger"
                onClick={() => updateOptions({ shadows: shadows.filter((cur) => cur.id !== shadowCur.id) })}
              >
                Удалить тень
              </Button>
            </div>
          );
        })}

        <Button variant="success" onClick={addShadow}>Добавить тень</Button>
      </details>

      <details className={styles.Section}>
        <summary>Боковой текст ({texts.length})</summary>

        {texts.map((textCur, index) => {
          return (
            <div key={textCur.id} className={styles.Media}>
              <strong>Текст {index + 1}</strong>

              <label className={styles.Field}>
                Текст слева
                <TextInput
                  maxLength={500}
                  value={textCur.leftText}
                  onChange={(e) => updateText(textCur.id, { leftText: e.target.value })}
                />
              </label>

              <label className={styles.Field}>
                Текст справа
                <TextInput
                  maxLength={500}
                  value={textCur.rightText}
                  onChange={(e) => updateText(textCur.id, { rightText: e.target.value })}
                />
              </label>

              <LayoutSettings
                item={textCur}
                hidden={previewFor(textCur.id).hidden ?? textCur.hidden ?? false}
                onHiddenChange={(hidden) => updateSideItemPreview(effect.id, textCur.id, { hidden })}
                onChange={(changes) => updateText(textCur.id, changes)}
              />

              <div className={styles.Field}>
                <span>Размер шрифта</span>
                <CssLengthInput
                  label="Размер шрифта"
                  allowNegative={false}
                  value={String(textCur.style?.fontSize ?? '12px')}
                  onChange={(fontSize) => {
                    const style = { ...textCur.style, fontSize };

                    updateText(textCur.id, { style });
                  }}
                />
              </div>

              <details>
                <summary>Стили текста</summary>

                <StyleEditor
                  layer="shadow"
                  colorProperty="color"
                  colorLabel="Цвет текста (color)"
                  additionalColorProperty="backgroundColor"
                  defaultZIndex={1}
                  value={getStyleForItem('text', textCur.id, textCur.style)}
                  styleFilters={textCur.styleFilters}
                  controller={{
                    preview: (style) => updateSideStylePreview(effect.id, 'text', textCur.id, style),
                    commit: flushStylePreviews,
                    commitFilters: (filters) => commitItemFilters('text', textCur.id, filters),
                  }}
                />
              </details>

              <AnimationSettings
                animation={textCur.animation}
                playState={previewFor(textCur.id).playState}
                onPlaybackChange={(playState) => updateSideItemPreview(effect.id, textCur.id, { playState })}
                presets={textPresets}
                defaultDuration={60000}
                onChange={(animation) => updateText(textCur.id, { animation })}
              />

              <Button
                variant="danger"
                onClick={() => updateOptions({ texts: texts.filter((cur) => cur.id !== textCur.id) })}
              >
                Удалить текст
              </Button>
            </div>
          );
        })}

        <Button variant="success" onClick={addText}>Добавить текст</Button>
      </details>

      <details className={styles.Section}>
        <summary>Кастомный компонент</summary>

        <Select value={componentId} onChange={handleComponentChange}>
          <option value="">Не использовать</option>

          {definitions.map((definitionCur) => {
            return (
              <option key={definitionCur.id} value={definitionCur.id}>
                {definitionCur.title}
              </option>
            );
          })}
        </Select>
      </details>

      <div className={styles.Actions}>
        <Button type="button" onClick={onDuplicate}>Дублировать эффект</Button>
        <Button variant="danger" onClick={onDelete}>Удалить эффект</Button>
      </div>
    </div>
  );
};
