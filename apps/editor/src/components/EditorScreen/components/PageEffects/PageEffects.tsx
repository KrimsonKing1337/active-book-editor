import { useState } from 'react';

import type { AudioEffectDraft } from './@types';

import { EffectsModal } from './components';

import styles from './PageEffects.module.scss';

const createAudioEffect = (): AudioEffectDraft => ({
  id: crypto.randomUUID(),
  title: 'Новый звук',
  options: {
    src: '',
    type: 'sfx',
    loop: false,
    playOnLoad: false,
    stopBy: 0,
    delay: 0,
    relativeVolume: 100,
    screamer: false,
    fadeOutWhenUnload: true,
  },
});

export const PageEffects = () => {
  // Пока это только UI-прототип: эффекты не сохраняются в проекте и не воспроизводятся.
  const [effects, setEffects] = useState<AudioEffectDraft[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);

  const selectedEffect = effects.find((effect) => effect.id === selectedEffectId) ?? null;

  const openEffects = () => {
    setIsOpen(true);
  };

  const closeEffects = () => {
    setIsOpen(false);
    setSelectedEffectId(null);
  };

  const addAudio = () => {
    const effect = createAudioEffect();

    setEffects((current) => [...current, effect]);
    setSelectedEffectId(effect.id);
  };

  const updateEffect = (updatedEffect: AudioEffectDraft) => {
    setEffects((current) => current.map((effect) => (
      effect.id === updatedEffect.id ? updatedEffect : effect
    )));
  };

  const duplicateEffect = () => {
    if (!selectedEffect) {
      return;
    }

    const duplicate: AudioEffectDraft = {
      ...selectedEffect,
      id: crypto.randomUUID(),
      title: `${selectedEffect.title} (копия)`,
      options: { ...selectedEffect.options },
    };

    setEffects((current) => [...current, duplicate]);
    setSelectedEffectId(duplicate.id);
  };

  const deleteEffect = () => {
    if (!selectedEffect || !window.confirm(`Удалить эффект «${selectedEffect.title}»?`)) {
      return;
    }

    setEffects((current) => current.filter((effect) => effect.id !== selectedEffect.id));
    setSelectedEffectId(null);
  };

  return (
    <>
      <button
        className={styles.Trigger}
        type="button"
        title="Эффекты страницы"
        aria-label="Эффекты страницы"
        aria-haspopup="dialog"
        onClick={openEffects}
      >
        <span className={styles.Icon} aria-hidden="true">⚙</span>
        <span>Эффекты</span>
        <span className={styles.Count}>{effects.length}</span>
      </button>

      {isOpen && (
        <EffectsModal
          effects={effects}
          selectedEffect={selectedEffect}
          onClose={closeEffects}
          onBack={() => setSelectedEffectId(null)}
          onAddAudio={addAudio}
          onSelectEffect={setSelectedEffectId}
          onUpdateEffect={updateEffect}
          onDuplicateEffect={duplicateEffect}
          onDeleteEffect={deleteEffect}
        />
      )}
    </>
  );
};
