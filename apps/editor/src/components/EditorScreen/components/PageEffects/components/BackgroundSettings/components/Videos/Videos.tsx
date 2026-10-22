import type { CSSProperties } from 'react';

import type { BackgroundOptions } from '../../../../@types';

import { StyleEditor } from '../../../StyleEditor';

import styles from '../../BackgroundSettings.module.scss';

type BackgroundVideos = NonNullable<BackgroundOptions['videos']>;

export type BackgroundVideosProps = {
  videos: BackgroundVideos;
  onChange: (videos: BackgroundVideos) => void;
  onImportAsset: (file: File) => Promise<string | null>;
};

export const Videos = ({ videos, onChange, onImportAsset }: BackgroundVideosProps) => {
  const updateVideo = (index: number, changes: Partial<BackgroundVideos[number]>) => {
    const updated = videos.map((videoCur, currentIndex) => {
      if (currentIndex !== index) {
        return videoCur;
      }

      return {
        ...videoCur,
        ...changes,
      };
    });

    onChange(updated);
  };

  const handlePathChange = (index: number, path: string) => {
    updateVideo(index, { src: path });
  };

  const handleFileChange = async (index: number, files: FileList | null) => {
    const file = files?.[0];

    if (!file) {
      return;
    }

    const path = await onImportAsset(file);

    if (path) {
      updateVideo(index, { src: path });
    }
  };

  const handleStyleChange = (index: number, style: CSSProperties) => {
    updateVideo(index, { style });
  };

  const handleDelete = (index: number) => {
    const remaining = videos.filter((_, itemIndex) => itemIndex !== index);

    onChange(remaining);
  };

  const handleLoopChange = (index: number, loop: boolean) => {
    updateVideo(index, { loop });
  };

  const handleAutoPlayChange = (index: number, autoPlay: boolean) => {
    updateVideo(index, { autoPlay });
  };

  const handleMutedChange = (index: number, muted: boolean) => {
    updateVideo(index, { muted });
  };

  const handleAdd = () => {
    onChange([...videos, { id: crypto.randomUUID(), src: '' }]);
  };

  return (
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
                  onChange={(e) => handlePathChange(index, e.target.value)}
                />
              </label>

              <label className={styles.Field}>
                <span>
                  Или выбрать видеофайл
                </span>

                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => void handleFileChange(index, e.target.files)}
                />
              </label>

              <div className={styles.Checkboxes}>
                <label>
                  <input
                    type="checkbox"
                    checked={videoCur.loop ?? true}
                    onChange={(e) => handleLoopChange(index, e.target.checked)}
                  />
                  Зациклить
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={videoCur.autoPlay ?? true}
                    onChange={(e) => handleAutoPlayChange(index, e.target.checked)}
                  />
                  Автозапуск
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={videoCur.muted ?? true}
                    onChange={(e) => handleMutedChange(index, e.target.checked)}
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
                  onChange={(val) => handleStyleChange(index, val)}
                />
              </details>

              <button type="button" onClick={() => handleDelete(index)}>
                Удалить видео
              </button>
            </div>
          );
        })}

        <button type="button" onClick={handleAdd}>
          Добавить видео
        </button>
      </section>
  );
};
