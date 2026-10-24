import type { ChangeEvent, FocusEvent } from 'react';

import type { SideOptions } from '@active-book/book-builder/effects';

import type { SideEffectDraft } from '../../@types';

import { useCustomComponents } from '@project/customComponentRegistry';

import { AnimationSettings } from './components/AnimationSettings';

import styles from './SideSettings.module.scss';

type ShadowItem = NonNullable<SideOptions['shadows']>[number];
type TextItem = NonNullable<SideOptions['texts']>[number];
type ItemLayout = Pick<ShadowItem, 'position' | 'offsetX' | 'offsetY' | 'scale' | 'style' | 'hidden'>;

type SideSettingsProps = {
  effect: SideEffectDraft;
  onUpdate: (previousId: string, effect: SideEffectDraft) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

type LayoutSettingsProps = {
  item: ItemLayout;
  onChange: (changes: Partial<ItemLayout>) => void;
  defaultColor?: string;
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

const shadowPresets = [
  { value: 'none' as const, label: 'Без анимации' },
  { value: 'pulse' as const, label: 'Пульсация' },
  { value: 'police' as const, label: 'Полиция' },
  { value: 'caramel' as const, label: 'Caramelldansen' },
];

const textPresets = [
  { value: 'scroll' as const, label: 'Прокрутка' },
  { value: 'none' as const, label: 'Без анимации' },
];

const LayoutSettings = ({ item, onChange, defaultColor = '#ff0000' }: LayoutSettingsProps) => {
  const handlePositionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange({ position: e.target.value as ItemLayout['position'] });
  };

  const handleOffsetXChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ offsetX: e.target.value });
  };

  const handleOffsetYChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ offsetY: e.target.value });
  };

  const handleScaleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const scale = Number(e.target.value);

    if (Number.isFinite(scale) && scale > 0) {
      onChange({ scale });
    }
  };

  const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    const style = {
      ...item.style,
      color: e.target.value,
    };

    onChange({ style });
  };

  const handleHiddenChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ hidden: e.target.checked });
  };

  const color = typeof item.style?.color === 'string' && /^#[0-9a-f]{6}$/i.test(item.style.color)
    ? item.style.color
    : defaultColor;

  return (
    <>
      <div className={styles.Layout}>
        <label className={styles.Field}>
          Точка привязки
          <select value={item.position ?? 'top-left'} onChange={handlePositionChange}>
            {positions.map((positionCur) => {
              return (
                <option key={positionCur.value} value={positionCur.value}>
                  {positionCur.label}
                </option>
              );
            })}
          </select>
        </label>

        <label className={styles.Field}>
          Масштаб
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={item.scale ?? 1}
            onChange={handleScaleChange}
          />
        </label>

        <label className={styles.Field}>
          Смещение X
          <input value={item.offsetX ?? '0px'} onChange={handleOffsetXChange} />
        </label>

        <label className={styles.Field}>
          Смещение Y
          <input value={item.offsetY ?? '0px'} onChange={handleOffsetYChange} />
        </label>
      </div>

      <div className={styles.Controls}>
        <label>
          Цвет
          <input type="color" value={color} onChange={handleColorChange} />
        </label>

        <label>
          <input type="checkbox" checked={item.hidden ?? false} onChange={handleHiddenChange} />
          Скрыть элемент
        </label>
      </div>
    </>
  );
};

export const SideSettings = ({ effect, onUpdate, onDuplicate, onDelete }: SideSettingsProps) => {
  const { definitions } = useCustomComponents();

  const { shadows = [], texts = [], component } = effect.options;

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
      style: { color: '#ff0000' },
      animation: { preset: 'pulse', duration: 1000, iterations: 'infinite' },
    };

    updateOptions({ shadows: [...shadows, shadow] });
  };

  const addText = () => {
    const text: TextItem = {
      id: crypto.randomUUID(),
      leftText: 'Левая сторона',
      rightText: 'Правая сторона',
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
        Название
        <input value={effect.slug} onChange={handleNameChange} />
      </label>

      <label className={styles.Field}>
        ID эффекта
        <input defaultValue={effect.id} onBlur={handleIdChange} />
      </label>

      <section className={styles.Section}>
        <h3>Боковые тени ({shadows.length})</h3>

        {shadows.map((shadowCur, index) => {
          return (
            <div key={shadowCur.id} className={styles.Element}>
              <strong>Тень {index + 1}</strong>

              <LayoutSettings
                item={shadowCur}
                onChange={(changes) => updateShadow(shadowCur.id, changes)}
              />

              <AnimationSettings
                animation={shadowCur.animation}
                presets={shadowPresets}
                defaultDuration={1000}
                onChange={(animation) => updateShadow(shadowCur.id, { animation })}
              />

              <button
                type="button"
                onClick={() => updateOptions({ shadows: shadows.filter((cur) => cur.id !== shadowCur.id) })}
              >
                Удалить тень
              </button>
            </div>
          );
        })}

        <button type="button" onClick={addShadow}>Добавить тень</button>
      </section>

      <section className={styles.Section}>
        <h3>Боковой текст ({texts.length})</h3>

        {texts.map((textCur, index) => {
          return (
            <div key={textCur.id} className={styles.Element}>
              <strong>Текст {index + 1}</strong>

              <label className={styles.Field}>
                Текст слева
                <input
                  value={textCur.leftText}
                  onChange={(e) => updateText(textCur.id, { leftText: e.target.value })}
                />
              </label>

              <label className={styles.Field}>
                Текст справа
                <input
                  value={textCur.rightText}
                  onChange={(e) => updateText(textCur.id, { rightText: e.target.value })}
                />
              </label>

              <LayoutSettings
                item={textCur}
                defaultColor="#a3a3a3"
                onChange={(changes) => updateText(textCur.id, changes)}
              />

              <AnimationSettings
                animation={textCur.animation}
                presets={textPresets}
                defaultDuration={60000}
                onChange={(animation) => updateText(textCur.id, { animation })}
              />

              <button
                type="button"
                onClick={() => updateOptions({ texts: texts.filter((cur) => cur.id !== textCur.id) })}
              >
                Удалить текст
              </button>
            </div>
          );
        })}

        <button type="button" onClick={addText}>Добавить текст</button>
      </section>

      <section className={styles.Section}>
        <h3>Кастомный компонент</h3>

        <select value={componentId} onChange={handleComponentChange}>
          <option value="">Не использовать</option>

          {definitions.map((definitionCur) => {
            return (
              <option key={definitionCur.id} value={definitionCur.id}>
                {definitionCur.title}
              </option>
            );
          })}
        </select>
      </section>

      <div className={styles.Controls}>
        <button type="button" onClick={onDuplicate}>Дублировать эффект</button>
        <button type="button" onClick={onDelete}>Удалить эффект</button>
      </div>
    </div>
  );
};
