import type { ProjectFileHandle } from '@project/fileSystemAccess';

import type { BackgroundOptions } from '@components/EditorScreen/components/PageEffects/@types';

import { StyleEditor } from '../../../StyleEditor';

import { MediaSource } from '../MediaSource';

import styles from '../../BackgroundSettings.module.scss';

type BackgroundImages = NonNullable<BackgroundOptions['images']>;

export type BackgroundImagesProps = {
  images: BackgroundImages;
  onChange: (images: BackgroundImages) => void;
  canImport: boolean;
  onImportAsset: (file: File, fileHandle?: ProjectFileHandle) => Promise<string>;
};

export const Images = ({
  images,
  canImport,
  onChange,
  onImportAsset,
}: BackgroundImagesProps) => {
  const updateImage = (index: number, changes: Partial<BackgroundImages[number]>) => {
    const updated = images.map((imageCur, currentIndex) => {
      if (currentIndex !== index) {
        return imageCur;
      }

      return {
        ...imageCur,
        ...changes,
      };
    });

    onChange(updated);
  };

  const handlePathChange = (index: number, path: string) => {
    updateImage(index, { src: path });
  };

  const handleDelete = (index: number) => {
    const remaining = images.filter((_, imageCurIndex) => {
      return imageCurIndex !== index;
    });

    onChange(remaining);
  };

  const handleAdd = () => {
    onChange([...images, {
      id: crypto.randomUUID(),
      src: '',
    }]);
  };

  return (
    <details className={styles.Section}>
      <summary>
        Изображения
      </summary>

      {images.map((imageCur, index) => {
        const { id, src, style } = imageCur;

        return (
          <div key={id} className={styles.Media}>
            <MediaSource
              kind="image"
              src={src}
              canImport={canImport}
              onChange={(path) => handlePathChange(index, path)}
              onImportAsset={onImportAsset}
            />

            <details>
              <summary>
                Стили изображения
              </summary>

              <StyleEditor
                defaultZIndex={1}
                value={style ?? {}}
                layer="image"
                mediaId={id}
              />
            </details>

            <button type="button" onClick={() => handleDelete(index)}>
              Удалить изображение
            </button>
          </div>
        );
      })}

      <button type="button" onClick={handleAdd}>
        Добавить изображение
      </button>
    </details>
  );
};
