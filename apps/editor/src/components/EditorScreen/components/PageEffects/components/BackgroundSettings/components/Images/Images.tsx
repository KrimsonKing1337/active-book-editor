import type { CSSProperties } from 'react';

import type { BackgroundOptions } from '../../../../@types';

import { StyleEditor } from '../../../StyleEditor';

import styles from '../../BackgroundSettings.module.scss';

type BackgroundImages = NonNullable<BackgroundOptions['images']>;

export type BackgroundImagesProps = {
  images: BackgroundImages;
  onChange: (images: BackgroundImages) => void;
  onImportAsset: (file: File) => Promise<string | null>;
};

export const Images = ({ images, onChange, onImportAsset }: BackgroundImagesProps) => {
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

  const handleFileChange = async (index: number, files: FileList | null) => {
    const file = files?.[0];

    if (!file) {
      return;
    }

    const path = await onImportAsset(file);

    if (path) {
      updateImage(index, { src: path });
    }
  };

  const handleStyleChange = (index: number, style: CSSProperties) => {
    updateImage(index, { style });
  };

  const handleDelete = (index: number) => {
    const remaining = images.filter((_, itemIndex) => itemIndex !== index);

    onChange(remaining);
  };

  const handleAdd = () => {
    onChange([...images, { src: '' }]);
  };

  return (
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
                  onChange={(e) => handlePathChange(index, e.target.value)}
                />
              </label>

              <label className={styles.Field}>
                <span>
                  Или выбрать файл
                </span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleFileChange(index, e.target.files)}
                />
              </label>
              <details>
                <summary>
                  Стили изображения
                </summary>

                <StyleEditor
                  value={imageCur.style ?? {}}
                  onChange={(val) => handleStyleChange(index, val)}
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
      </section>
  );
};
