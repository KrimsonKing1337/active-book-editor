import type { EditorEffectDraft } from '@components/EditorScreen/components/PageEffects/@types';

import styles from '../../EffectsModal.module.scss';

export type EffectTileProps = {
  effect: EditorEffectDraft;
  onSelect: (id: string) => void;
};

export const EffectTile = ({ effect, onSelect }: EffectTileProps) => {
  const effectSlug = effect.slug.trim() || 'Без названия';

  let effectType = 'Vibration';
  let effectDetails = '';

  if (effect.type === 'audio') {
    effectType = `Audio · ${effect.options.type}`;
    effectDetails = effect.options.src || 'Файл не выбран';
  } else if (effect.type === 'vibration') {
    effectDetails = `${effect.options.duration} мс`;
  } else if (effect.type === 'background') {
    if (effect.kind === 'background') {
      effectType = 'Фон';
      effectDetails = 'Цвет и стили фона';
    } else if (effect.kind === 'image') {
      effectType = 'Изображение';
      effectDetails = effect.options.image?.src || 'Файл не выбран';
    } else if (effect.kind === 'video') {
      effectType = 'Видео';
      effectDetails = effect.options.video?.src || 'Файл не выбран';
    } else if (effect.kind === 'shadow') {
      effectType = 'Затемнение';
      effectDetails = 'Слой затемнения и фильтры';
    } else if (effect.kind === 'component') {
      effectType = 'Фоновый компонент';
      effectDetails = effect.options.component?.name ?? 'Компонент не выбран';
    }
  } else if (effect.type === 'side') {
    if (effect.kind === 'shadow') {
      effectType = 'Боковая тень';
      effectDetails = effect.options.shadow?.animation?.preset ?? 'Без анимации';
    } else if (effect.kind === 'text') {
      effectType = 'Боковой текст';
      effectDetails = effect.options.text?.leftText ?? '';
    } else if (effect.kind === 'component') {
      effectType = 'Боковой компонент';
      effectDetails = effect.options.component?.name ?? 'Компонент не выбран';
    }
  } else {
    effectType = 'Flashlight';

    const sideShadowLabel = effect.options.withSideShadow ? 'да' : 'нет';

    effectDetails = `${effect.options.duration} мс · sideShadow: ${sideShadowLabel}`;
  }

  const handleSelect = () => {
    onSelect(effect.id);
  };

  return (
    <button className={styles.Tile} type="button" onClick={handleSelect}>
      <span className={styles.Kind}>
        {effectType}
      </span>

      <strong>
        {effectSlug}
      </strong>

      <span className={styles.Source}>
        {effectDetails}
      </span>

      <code>
        {effect.id}
      </code>
    </button>
  );
};
