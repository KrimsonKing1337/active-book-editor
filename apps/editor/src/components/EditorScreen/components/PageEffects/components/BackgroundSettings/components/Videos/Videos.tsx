import type { CSSProperties } from 'react';

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
  onBlurPreview: (mediaId: string, blur: number | null) => void;
};

export const Videos = ({ videos, canImport, onChange, onImportAsset, onBlurPreview }: BackgroundVideosProps) => {
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
    onChange([...videos, {
      id: crypto.randomUUID(),
      src: '',
    }]);
  };

  return (
    <details className={styles.Section}>
      <summary>
        Видео
      </summary>

      {videos.map((videoCur, index) => {
        const { autoPlay, id, loop, muted, src, style } = videoCur;

        return (
          <div key={id} className={styles.Media}>
            <MediaSource
              kind="video"
              src={src}
              canImport={canImport}
              onChange={(path) => handlePathChange(index, path)}
              onImportAsset={onImportAsset}
            />

            <div className={styles.Checkboxes}>
              <label>
                <input
                  type="checkbox"
                  checked={loop ?? true}
                  onChange={(e) => handleLoopChange(index, e.target.checked)}
                />
                Зациклить
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={autoPlay ?? true}
                  onChange={(e) => handleAutoPlayChange(index, e.target.checked)}
                />
                Автозапуск
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={muted ?? true}
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
                defaultZIndex={1}
                value={style ?? {}}
                onChange={(val) => handleStyleChange(index, val)}
                onBlurPreview={(blur) => onBlurPreview(id, blur)}
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
    </details>
  );
};
