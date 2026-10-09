import type { AudioEffectDraft } from '../../../../@types';

import styles from '../../EffectsModal.module.scss';

type EffectTileProps = {
  effect: AudioEffectDraft;
  onSelect: (id: string) => void;
};

export const EffectTile = ({ effect, onSelect }: EffectTileProps) => {
  const effectType = `Audio · ${effect.options.type}`;
  const effectSlug = effect.slug.trim() || 'Без названия';
  const effectSource = effect.options.src || 'Файл не выбран';

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
        {effectSource}
      </span>

      <code>
        {effect.id}
      </code>
    </button>
  );
};
