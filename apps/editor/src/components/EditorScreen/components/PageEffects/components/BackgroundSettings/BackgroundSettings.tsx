import { useState, type ChangeEvent, type CSSProperties } from 'react';

import { useCustomComponents } from '@project/customComponentRegistry';
import type { BookProject } from '@project/@types';

import type { BackgroundEffectDraft, BackgroundOptions } from '../../@types';

import { StyleEditor } from '../StyleEditor';

import styles from './BackgroundSettings.module.scss';

type BackgroundSettingsProps = {
  effect: BackgroundEffectDraft;
  effects: BackgroundEffectDraft[];
  project: BookProject | null;

  onUpdate: (previousId: string, effect: BackgroundEffectDraft) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

const shadowDefaultOptions = {
  show: false,
  style: undefined,
};

export const BackgroundSettings = ({
  effect,
  effects,
  project,

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
  const shadow = options.shadow ?? shadowDefaultOptions;

  const updateOptions = (updates: Partial<BackgroundOptions>) => {
    const newOptions = {
      ...options,
      ...updates,
    };

    onUpdate(effect.id, {
      ...effect,
      options: newOptions,
    });
  };

  const updateStyle = (value: CSSProperties) => {
    updateOptions({
      style: value,
    });
  };

  const updateZIndex = (value: number) => {
    if (Number.isFinite(value)) {
      updateStyle({
        ...style,
        zIndex: value,
      });
    }
  };

  const otherEffects = effects.filter((cur) => cur.id !== effect.id);

  const otherZIndexes = otherEffects.map((effectCur) => {
    return Number(effectCur.options.style?.zIndex ?? 0);
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
      const filteredNextZIndexes = otherZIndexes.filter((cur) => cur > zIndex);

      const next = filteredNextZIndexes.sort((a, b) => a - b);

      let nextSafe = zIndex + 1;

      if (next[0]) {
        nextSafe = next[0] + 1;
      }

      updateZIndex(nextSafe);

      return;
    }

    const filteredPrevZIndexes = otherZIndexes.filter((cur) => cur < zIndex);

    const prev = filteredPrevZIndexes.sort((a, b) => b - a);

    let prevSafe = zIndex + 1;

    if (prev[0]) {
      prevSafe = prev[0] - 1;
    }

    updateZIndex(prevSafe);
  };

  const updateId = () => {
    const normalized = idDraft.trim();

    const alreadyExists = effects.some((effectCur) => {
      return effectCur.id === normalized && effectCur.id !== effect.id;
    });

    if (!normalized || alreadyExists) {
      return;
    }

    onUpdate(effect.id, {
      ...effect,
      id: normalized,
    });
  };

  const updateImage = (index: number, changes: Partial<(typeof images)[number]>) => {
    const next = images.map((imageCur, imageCurIndex) => {
      if (imageCurIndex === index) {
        return {
          ...imageCur,
          ...changes,
        };
      }

      return imageCur;
    });

    updateOptions({
      images: next,
    });
  };

  const updateVideo = (index: number, changes: Partial<(typeof videos)[number]>) => {
    const next = videos.map((videoCur, videoCurIndex) => {
      if (videoCurIndex === index) {
        return {
          ...videoCur,
          ...changes,
        };
      }

      return videoCur;
    });

    updateOptions({
      videos: next,
    });
  };

  const importAsset = async (file: File, updateSource: (src: string) => void) => {
    if (!project) {
      window.alert('Сначала сохрани проект, чтобы добавить файл в assets/');

      return;
    }

    try {
      const path = await project.storage.importAssetFile(file);

      updateSource(path);
    } catch (error) {
      console.error('[background] Failed to import media asset', error);

      window.alert(error instanceof Error ? error.message : 'Не удалось импортировать файл');
    }
  };

  const handleZIndexChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateZIndex(Number(event.target.value));
  };

  const updateComponent = (id: string) => {
    if (!id) {
      updateOptions({ component: undefined });

      return;
    }

    const definition = definitions.find((cur) => cur.id === id);

    if (definition) {
      const component = {
        package: definition.packageName,
        name: definition.name,
      };

      updateOptions({
        component,
      });
    }
  };

  let componentId = '';

  if (options.component) {
    componentId = `${options.component.package}/${options.component.name}`;
  }

  const effectNameChangeHandler = (val: string) => {
    onUpdate(effect.id, {
      ...effect,
      slug: val,
    });
  };

  const imagePathChangeHandler = (index: number, val: string) => {
    updateImage(index, {
      src: val,
    });
  };

  const imageFileChangeHandler = (index: number, files: FileList | null) => {
    const file = files?.[0];

    if (file) {
      void importAsset(file, (src) => {
        updateImage(index, {
          src,
        });
      });
    }
  };

  const imageStyleEditorChangeHandler = (index: number, val: CSSProperties) => {
    updateImage(index, {
      style: val,
    });
  };

  const imageDeleteButtonClickHandler = (index: number) => {
    const filteredImages = images.filter((_, imageIndex) => imageIndex !== index);

    updateOptions({
      images: filteredImages,
    });
  };

  const imageAddButtonClickHandler = () => {
    const newImages = [...images, {
      src: '',
    }];

    updateOptions({
      images: newImages,
    });
  };

  const videoPathChangeHandler = (index: number, val: string) => {
    updateVideo(index, {
      src: val,
    });
  };

  const videoFileChangeHandler = (index: number, files: FileList | null) => {
    const file = files?.[0];

    if (file) {
      void importAsset(file, (src) => {
        updateVideo(index, {
          src,
        });
      });
    }
  };

  const videoOptionLoopChangeHandler = (index: number, val: boolean) => {
    updateVideo(index, {
      loop: val,
    });
  };

  const videoOptionAutoplayChangeHandler = (index: number, val: boolean) => {
    updateVideo(index, {
      autoPlay: val,
    });
  };

  const videoOptionMutedChangeHandler = (index: number, val: boolean) => {
    updateVideo(index, {
      muted: val,
    });
  };

  const videoStyleEditorChangeHandler = (index: number, val: CSSProperties) => {
    updateVideo(index, {
      style: val,
    });
  };

  const videoDeleteButtonClickHandler = (index: number) => {
    const filteredVideos = videos.filter((_, videoIndex) => videoIndex !== index);

    updateOptions({
      videos: filteredVideos,
    });
  };

  const videoAddButtonClickHandler = () => {
    const newVideos = [...videos, {
      id: crypto.randomUUID(),
      src: '',
    }];

    updateOptions({
      videos: newVideos,
    });
  };

  const shadowOptionShowChangeHandler = (val: boolean) => {
    const newShadow = {
      ...shadow,
      show: val,
    };

    updateOptions({
      shadow: newShadow,
    });
  };

  const shadowStyleEditorChangeHandler = (val: CSSProperties) => {
    const newShadow = {
      ...shadow,
      style: val,
    };

    updateOptions({
      shadow: newShadow,
    });
  };

  const customComponentOptions = definitions.map((definitionCur) => {
    const { id, title } = definitionCur;

    return (
      <option key={id} value={id}>
        {title}
      </option>
    );
  });

  return (
    <div className={styles.Settings}>
      <label className={styles.Field}>
        <span>
          Название эффекта
        </span>

        <input
          type="text"
          value={effect.slug}
          onChange={(e) => effectNameChangeHandler(e.target.value)}
        />
      </label>

      <div className={styles.Field}>
        <span>
          ID эффекта
        </span>

        <div className={styles.Row}>
          <input value={idDraft} onChange={(e) => setIdDraft(e.target.value)} />

          <button type="button" onClick={updateId}>
            Применить
          </button>
        </div>
      </div>

      <section className={styles.Section}>
        <h3>
          Слой
        </h3>

        <div className={styles.Row}>
          <button type="button" title="В самый низ" onClick={() => moveLayer('bottom')}>
            ⇤
          </button>

          <button type="button" title="На один слой назад" onClick={() => moveLayer('backward')}>
            ←
          </button>

          <input
            type="number"
            aria-label="z-index"
            value={zIndex}
            onChange={handleZIndexChange}
          />

          <button type="button" title="На один слой вперёд" onClick={() => moveLayer('forward')}>
            →
          </button>

          <button type="button" title="На самый верх" onClick={() => moveLayer('top')}>
            ⇥
          </button>
        </div>

        <StyleEditor value={style} onChange={updateStyle} />
      </section>

      <section className={styles.Section}>
        <h3>
          Изображения
        </h3>

        {images.map((imageCur, index) => {
          return (
            <div key={index} className={styles.Media}>
              <label className={styles.Field}>
                <span>
                  Путь к изображению
                </span>

                <input
                  value={imageCur.src}
                  placeholder="assets/forest.webp"
                  onChange={(e) => imagePathChangeHandler(index, e.target.value)}
                />
              </label>

              <label className={styles.Field}>
                <span>
                  Или выбрать файл
                </span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => imageFileChangeHandler(index, e.target.files)}
                />
              </label>
              <details>
                <summary>
                  Стили изображения
                </summary>

                <StyleEditor
                  value={imageCur.style ?? {}}
                  onChange={(val) => imageStyleEditorChangeHandler(index, val)}
                />
              </details>

              <button type="button" onClick={() => imageDeleteButtonClickHandler(index)}>
                Удалить изображение
              </button>
            </div>
          );
        })}

        <button type="button" onClick={imageAddButtonClickHandler}>
          Добавить изображение
        </button>
      </section>

      <section className={styles.Section}>
        <h3>
          Видео
        </h3>

        {videos.map((videoCur, index) => {
          return (
            <div key={videoCur.id} className={styles.Media}>
              <label className={styles.Field}>
                <span>
                  Путь к видео
                </span>

                <input
                  value={videoCur.src}
                  placeholder="assets/fog.webm"
                  onChange={(e) => videoPathChangeHandler(index, e.target.value)}
                />
              </label>

              <label className={styles.Field}>
                <span>
                  Или выбрать видеофайл
                </span>

                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => videoFileChangeHandler(index, e.target.files)}
                />
              </label>

              <div className={styles.Checkboxes}>
                <label>
                  <input
                    type="checkbox"
                    checked={videoCur.loop ?? true}
                    onChange={(e) => videoOptionLoopChangeHandler(index, e.target.checked)}
                  />
                  Зациклить
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={videoCur.autoPlay ?? true}
                    onChange={(e) => videoOptionAutoplayChangeHandler(index, e.target.checked)}
                  />
                  Автозапуск
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={videoCur.muted ?? true}
                    onChange={(e) => videoOptionMutedChangeHandler(index, e.target.checked)}
                  />
                  Без звука
                </label>
              </div>

              <details>
                <summary>
                  Стили видео
                </summary>

                <StyleEditor
                  value={videoCur.style ?? {}}
                  onChange={(val) => videoStyleEditorChangeHandler(index, val)}
                />
              </details>

              <button type="button" onClick={() => videoDeleteButtonClickHandler(index)}>
                Удалить видео
              </button>
            </div>
          );
        })}

        <button type="button" onClick={videoAddButtonClickHandler}>
          Добавить видео
        </button>
      </section>

      <section className={styles.Section}>
        <h3>
          Затемнение и фильтры
        </h3>

        <label>
          <input
            type="checkbox"
            checked={shadow.show ?? false}
            onChange={(e) => shadowOptionShowChangeHandler(e.target.checked)}
          />
          Показывать слой
        </label>

        <StyleEditor
          value={shadow.style ?? {}}
          onChange={(val) => shadowStyleEditorChangeHandler(val)}
        />
      </section>

      <section className={styles.Section}>
        <h3>
          Кастомный компонент
        </h3>

        <select value={componentId} onChange={(e) => updateComponent(e.target.value)}>
          <option value="">
            Не использовать
          </option>

          {customComponentOptions}
        </select>
      </section>

      <div className={styles.Actions}>
        <button type="button" onClick={onDuplicate}>
          Дублировать
        </button>

        <button type="button" onClick={onDelete}>
          Удалить эффект
        </button>
      </div>
    </div>
  );
};
