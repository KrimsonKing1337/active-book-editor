import type { EditorEffectDraft } from '../../../../@types';

import styles from '../../EffectsModal.module.scss';

type EffectTileProps = {
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
  } else {
    effectType = 'Flashlight';
    effectDetails = `${effect.options.duration} мс · sideShadow: ${effect.options.withSideShadow ? 'да' : 'нет'}`;
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
