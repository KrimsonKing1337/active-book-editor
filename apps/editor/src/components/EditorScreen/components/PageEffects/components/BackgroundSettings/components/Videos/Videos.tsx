import type { ChangeEvent } from 'react';

import type { ProjectFileHandle } from '@project/fileSystemAccess';

import type { BackgroundOptions } from '@components/EditorScreen/components/PageEffects/@types';

import { StyleEditor } from '../../../StyleEditor';

import { MediaSource } from '../MediaSource';

import styles from '../../BackgroundSettings.module.scss';

type BackgroundVideos = NonNullable<BackgroundOptions['videos']>;

export type BackgroundVideosProps = {
  videos: BackgroundVideos;

  onChange: (videos: BackgroundVideos) => void;
  canImport: boolean;
  onImportAsset: (file: File, fileHandle?: ProjectFileHandle) => Promise<string>;
};

export const Videos = ({
  videos,

  canImport,
  onChange,
  onImportAsset,
}: BackgroundVideosProps) => {
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
    const video = {
      id: crypto.randomUUID(),
      src: '',
    };

    onChange([...videos, video]);
  };

  return (
    <details className={styles.Section}>
      <summary>
        Видео
      </summary>

      {videos.map((videoCur, index) => {
        const {
          autoPlay,
          id,
          loop,
          muted,
          src,
          style,
          styleFilters,
        } = videoCur;

        const handlePathChangeForVideo = (val: string) => {
          handlePathChange(index, val);
        };

        const handleLoopChangeForVideo = (e: ChangeEvent<HTMLInputElement>) => {
          handleLoopChange(index, e.target.checked);
        };

        const handleAutoPlayChangeForVideo = (e: ChangeEvent<HTMLInputElement>) => {
          handleAutoPlayChange(index, e.target.checked);
        };

        const handleMutedChangeForVideo = (e: ChangeEvent<HTMLInputElement>) => {
          handleMutedChange(index, e.target.checked);
        };

        const handleDeleteVideo = () => {
          handleDelete(index);
        };

        return (
          <div key={id} className={styles.Media}>
            <MediaSource
              kind="video"
              src={src}
              canImport={canImport}
              onChange={handlePathChangeForVideo}
              onImportAsset={onImportAsset}
            />

            <div className={styles.Checkboxes}>
              <label>
                <input
                  type="checkbox"
                  checked={loop ?? true}
                  onChange={handleLoopChangeForVideo}
                />
                Зациклить
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={autoPlay ?? true}
                  onChange={handleAutoPlayChangeForVideo}
                />
                Автозапуск
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={muted ?? true}
                  onChange={handleMutedChangeForVideo}
                />
                Без звука
              </label>
            </div>

            <details>
              <summary>
                Стили видео
              </summary>

              <StyleEditor
                defaultZIndex={1}
                value={style ?? {}}
                styleFilters={styleFilters}
                layer="video"
                mediaId={id}
              />
            </details>

            <button type="button" onClick={handleDeleteVideo}>
              Удалить видео
            </button>
          </div>
        );
      })}

      <button type="button" onClick={handleAdd}>
        Добавить видео
      </button>
    </details>
  );
};
