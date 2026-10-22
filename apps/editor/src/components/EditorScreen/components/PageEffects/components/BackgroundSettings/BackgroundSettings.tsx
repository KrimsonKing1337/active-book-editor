import { useState, type ChangeEvent, type CSSProperties } from 'react';

import { useCustomComponents } from '@project/customComponentRegistry';

import type { BackgroundEffectDraft, BackgroundOptions } from '../../@types';

import { StyleEditor } from '../StyleEditor';

import styles from './BackgroundSettings.module.scss';

type BackgroundSettingsProps = {
  effect: BackgroundEffectDraft;
  effects: BackgroundEffectDraft[];
  onUpdate: (previousId: string, effect: BackgroundEffectDraft) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export const BackgroundSettings = ({
  effect,
  effects,
  onUpdate,
  onDuplicate,
  onDelete,
}: BackgroundSettingsProps) => {
  const { definitions } = useCustomComponents();
  const [idDraft, setIdDraft] = useState(effect.id);

  const options = effect.options;
  const images = options.images ?? [];
  const videos = options.videos ?? [];
  const style = options.style ?? {};
  const shadow = options.shadow ?? { show: false };

  const updateOptions = (updates: Partial<BackgroundOptions>) => {
    onUpdate(effect.id, {
      ...effect,
      options: { ...options, ...updates },
    });
  };

  const updateStyle = (value: CSSProperties) => {
    updateOptions({ style: value });
  };

  const updateZIndex = (value: number) => {
    if (Number.isFinite(value)) {
      updateStyle({ ...style, zIndex: value });
    }
  };

  const otherZIndexes = effects.filter((current) => current.id !== effect.id).map((current) => {
    return Number(current.options.style?.zIndex ?? 0);
  });

  const zIndex = Number(style.zIndex ?? 0);

  const moveLayer = (direction: 'forward' | 'backward' | 'top' | 'bottom') => {
    if (direction === 'top') {
      updateZIndex(Math.max(zIndex, ...otherZIndexes, 0) + 1);
      return;
    }

    if (direction === 'bottom') {
      updateZIndex(Math.min(zIndex, ...otherZIndexes, 0) - 1);
      return;
    }

    if (direction === 'forward') {
      const next = otherZIndexes.filter((current) => current > zIndex).sort((a, b) => a - b)[0];
      updateZIndex(next === undefined ? zIndex + 1 : next + 1);
      return;
    }

    const previous = otherZIndexes.filter((current) => current < zIndex).sort((a, b) => b - a)[0];
    updateZIndex(previous === undefined ? zIndex - 1 : previous - 1);
  };

  const updateId = () => {
    const normalized = idDraft.trim();
    const alreadyExists = effects.some((current) => current.id === normalized && current.id !== effect.id);

    if (!normalized || alreadyExists) {
      return;
    }

    onUpdate(effect.id, { ...effect, id: normalized });
  };

  const updateImage = (index: number, changes: Partial<(typeof images)[number]>) => {
    const next = images.map((image, currentIndex) => {
      return currentIndex === index ? { ...image, ...changes } : image;
    });

    updateOptions({ images: next });
  };

  const updateVideo = (index: number, changes: Partial<(typeof videos)[number]>) => {
    const next = videos.map((video, currentIndex) => {
      return currentIndex === index ? { ...video, ...changes } : video;
    });

    updateOptions({ videos: next });
  };

  const handleZIndexChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateZIndex(Number(event.target.value));
  };

  const updateComponent = (id: string) => {
    if (!id) {
      updateOptions({ component: undefined });
      return;
    }

    const definition = definitions.find((item) => item.id === id);

    if (definition) {
      updateOptions({ component: { package: definition.packageName, name: definition.name } });
    }
  };

  const componentId = options.component ? `${options.component.package}/${options.component.name}` : '';

  return (
    <div className={styles.Settings}>
      <label className={styles.Field}>
        <span>Название эффекта</span>
        <input
          type="text"
          value={effect.slug}
          onChange={(event) => onUpdate(effect.id, { ...effect, slug: event.target.value })}
        />
      </label>

      <div className={styles.Field}>
        <span>ID эффекта</span>
        <div className={styles.Row}>
          <input value={idDraft} onChange={(event) => setIdDraft(event.target.value)} />
          <button type="button" onClick={updateId}>Применить</button>
        </div>
      </div>

      <section className={styles.Section}>
        <h3>Слой</h3>
        <div className={styles.Row}>
          <button type="button" title="В самый низ" onClick={() => moveLayer('bottom')}>⇤</button>
          <button type="button" title="На один слой назад" onClick={() => moveLayer('backward')}>←</button>
          <input type="number" aria-label="z-index" value={zIndex} onChange={handleZIndexChange} />
          <button type="button" title="На один слой вперёд" onClick={() => moveLayer('forward')}>→</button>
          <button type="button" title="На самый верх" onClick={() => moveLayer('top')}>⇥</button>
        </div>
        <StyleEditor value={style} onChange={updateStyle} />
      </section>

      <section className={styles.Section}>
        <h3>Изображения</h3>
        {images.map((image, index) => {
          return (
            <div key={index} className={styles.Media}>
              <label className={styles.Field}>
                <span>Путь к изображению</span>
                <input
                  value={image.src}
                  placeholder="assets/forest.webp"
                  onChange={(event) => updateImage(index, { src: event.target.value })}
                />
              </label>
              <details>
                <summary>Стили изображения</summary>
                <StyleEditor
                  value={image.style ?? {}}
                  onChange={(value) => updateImage(index, { style: value })}
                />
              </details>
              <button type="button" onClick={() => updateOptions({ images: images.filter((_, i) => i !== index) })}>
                Удалить изображение
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => updateOptions({ images: [...images, { src: '' }] })}
        >
          Добавить изображение
        </button>
      </section>

      <section className={styles.Section}>
        <h3>Видео</h3>
        {videos.map((video, index) => {
          return (
            <div key={video.id} className={styles.Media}>
              <label className={styles.Field}>
                <span>Путь к видео</span>
                <input
                  value={video.src}
                  placeholder="assets/fog.webm"
                  onChange={(event) => updateVideo(index, { src: event.target.value })}
                />
              </label>
              <div className={styles.Checkboxes}>
                <label>
                  <input
                    type="checkbox"
                    checked={video.loop ?? true}
                    onChange={(event) => updateVideo(index, { loop: event.target.checked })}
                  />
                  Зациклить
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={video.autoPlay ?? true}
                    onChange={(event) => updateVideo(index, { autoPlay: event.target.checked })}
                  />
                  Автозапуск
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={video.muted ?? true}
                    onChange={(event) => updateVideo(index, { muted: event.target.checked })}
                  />
                  Без звука
                </label>
              </div>
              <details>
                <summary>Стили видео</summary>
                <StyleEditor
                  value={video.style ?? {}}
                  onChange={(value) => updateVideo(index, { style: value })}
                />
              </details>
              <button type="button" onClick={() => updateOptions({ videos: videos.filter((_, i) => i !== index) })}>
                Удалить видео
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => updateOptions({ videos: [...videos, { id: crypto.randomUUID(), src: '' }] })}
        >
          Добавить видео
        </button>
      </section>

      <section className={styles.Section}>
        <h3>Затемнение и фильтры</h3>
        <label>
          <input
            type="checkbox"
            checked={shadow.show ?? false}
            onChange={(event) => updateOptions({ shadow: { ...shadow, show: event.target.checked } })}
          />
          Показывать слой
        </label>
        <StyleEditor
          value={shadow.style ?? {}}
          onChange={(value) => updateOptions({ shadow: { ...shadow, style: value } })}
        />
      </section>

      <section className={styles.Section}>
        <h3>Кастомный компонент</h3>
        <select value={componentId} onChange={(event) => updateComponent(event.target.value)}>
          <option value="">Не использовать</option>
          {definitions.map((definition) => {
            return <option key={definition.id} value={definition.id}>{definition.title}</option>;
          })}
        </select>
      </section>

      <div className={styles.Actions}>
        <button type="button" onClick={onDuplicate}>Дублировать</button>
        <button type="button" onClick={onDelete}>Удалить эффект</button>
      </div>
    </div>
  );
};
