import type { ChangeEvent, CSSProperties, FocusEvent } from 'react';

import type { FilterOperation, SideOptions } from '@active-book/book-builder/effects';

import { useCustomComponents } from '@project/customComponentRegistry';

import type { SideEffectDraft } from '../../@types';

import { getSidePreviewKey, getSideStylePreviewKey, usePageEffects } from '../../PageEffectsContext';

import { StyleEditor } from '../StyleEditor';
import { IntegerInput } from '../IntegerInput';
import { CssLengthInput } from '../CssLengthInput';
import { TextInput, Select, Checkbox, Button } from '../EffectControls';

import { AnimationSettings } from './components/AnimationSettings';

import { positions, shadowPresets, textPresets } from './constants';

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
  onChange: (changes: Partial<ItemLayout>) => void;
  hidden: boolean;
  onHiddenChange: (hidden: boolean) => void;
};

const LayoutSettings = ({ item, onChange, hidden, onHiddenChange }: LayoutSettingsProps) => {
  const handlePositionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange({ position: e.target.value as ItemLayout['position'] });
  };

  return (
    <>
      <div className={styles.Layout}>
        <label className={styles.Field}>
          <span>
            Точка привязки
          </span>

          <Select value={item.position ?? 'top-left'} onChange={handlePositionChange}>
            {positions.map((current) => {
              return <option key={current.value} value={current.value}>{current.label}</option>;
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
            onChange={(offsetX) => onChange({ offsetX })}
          />
        </div>

        <div className={styles.Field}>
          <span>
            Смещение Y
          </span>

          <CssLengthInput
            label="Смещение Y"
            value={item.offsetY ?? '0px'}
            onChange={(offsetY) => onChange({ offsetY })}
          />
        </div>
      </div>

      <div className={styles.Controls}>
        <Checkbox checked={hidden} onChange={(e) => onHiddenChange(e.target.checked)}>
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
  const item = effect.kind === 'shadow' ? shadow : text;
  const previewKey = item ? getSidePreviewKey(effect.id, item.id) : '';
  const preview = sideItemPreviews[previewKey] ?? {};
  const previewIsHidden = preview.hidden ?? item?.hidden ?? false;

  const updateOptions = (updates: Partial<SideOptions>) => {
    onUpdate(effect.id, {
      ...effect,
      options: {
        ...effect.options,
        ...updates,
      },
    });
  };

  const updateShadow = (changes: Partial<ShadowItem>) => {
    if (shadow) {
      updateOptions({ shadow: { ...shadow, ...changes } });
    }
  };

  const updateText = (changes: Partial<TextItem>) => {
    if (text) {
      updateOptions({ text: { ...text, ...changes } });
    }
  };

  const getItemStyle = (kind: 'shadow' | 'text', id: string, style?: CSSProperties) => {
    const key = getSideStylePreviewKey(effect.id, kind, id);

    return sideStylePreviews[key] ?? style ?? {};
  };

  const handleStylePreview = (kind: 'shadow' | 'text', itemId: string, style: CSSProperties) => {
    updateSideStylePreview({
      effectId: effect.id,
      kind,
      itemId,
      style,
    });
  };

  const commitItemFilters = (kind: 'shadow' | 'text', styleFilters: FilterOperation[]) => {
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
    }

    onUpdate(effect.id, { ...currentEffect, options });
  };

  const handlePlaybackChange = (state: NonNullable<SideAnimation['playState']>) => {
    if (item) {
      updateSideItemPreview(effect.id, item.id, { playState: state });
    }
  };

  const handleHiddenChange = (hidden: boolean) => {
    if (item) {
      updateSideItemPreview(effect.id, item.id, { hidden });
    }
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    onUpdate(effect.id, { ...effect, slug: e.target.value });
  };

  const handleIdChange = (e: FocusEvent<HTMLInputElement>) => {
    onUpdate(effect.id, { ...effect, id: e.target.value });
  };

  const handleComponentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const definition = definitions.find((current) => current.id === e.target.value);

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

  let colorDisabledReason: string | undefined;

  if (shadow) {
    const selectedPreset = shadowPresets.find((current) => {
      return current.value === (shadow.animation?.preset ?? 'none');
    });

    if (selectedPreset?.canChangeColor === false) {
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

          <label className={styles.Field}>
            <span>
              Толщина тени (px)
            </span>

            <IntegerInput
              min={0}
              max={999}
              value={shadow.thickness ?? 30}
              onValueChange={(thickness) => updateShadow({ thickness })}
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
              controller={{
                preview: (style) => handleStylePreview('shadow', shadow.id, style),
                commit: flushStylePreviews,
                commitFilters: (filters) => commitItemFilters('shadow', filters),
              }}
            />
          </details>

          <AnimationSettings
            animation={shadow.animation}
            playState={preview.playState}
            presets={shadowPresets}
            defaultDuration={1000}
            onPlaybackChange={handlePlaybackChange}
            onChange={(animation) => updateShadow({ animation })}
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
              onChange={(e) => updateText({ leftText: e.target.value })}
            />
          </label>

          <label className={styles.Field}>
            <span>
              Текст справа
            </span>

            <TextInput
              maxLength={500}
              value={text.rightText}
              onChange={(e) => updateText({ rightText: e.target.value })}
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
              onChange={(fontSize) => updateText({ style: { ...text.style, fontSize } })}
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
              controller={{
                preview: (style) => handleStylePreview('text', text.id, style),
                commit: flushStylePreviews,
                commitFilters: (filters) => commitItemFilters('text', filters),
              }}
            />
          </details>

          <AnimationSettings
            animation={text.animation}
            playState={preview.playState}
            presets={textPresets}
            defaultDuration={60000}
            onPlaybackChange={handlePlaybackChange}
            onChange={(animation) => updateText({ animation })}
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

            {definitions.map((definition) => {
              return (
                <option key={definition.id} value={definition.id}>
                  {definition.title}
                </option>
              );
            })}
          </Select>
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
