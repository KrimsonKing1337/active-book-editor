import type { EditorEffectDraft } from '@components/EditorScreen/components/PageEffects/@types';

import { getEffectTileContent } from './utils';

import styles from '../../EffectsModal.module.scss';

export type EffectTileProps = {
  effect: EditorEffectDraft;
  path?: string;
  onSelect: (id: string) => void;
};

export const EffectTile = ({ effect, path, onSelect }: EffectTileProps) => {
  const effectSlug = effect.slug.trim() || 'Без названия';

  const { effectType, effectDetails } = getEffectTileContent(effect);

  const handleSelect = () => {
    onSelect(effect.id);
  };

  const effectTypeLabel = path ?? effectType;

  return (
    <button className={styles.Tile} type="button" onClick={handleSelect}>
      <span className={styles.Kind}>
        {effectTypeLabel}
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
