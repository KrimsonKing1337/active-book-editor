import type { ProjectFileHandle } from '@project/@types/fileSystemAccess';

import type { BackgroundOptions } from '@components/EditorScreen/components/PageEffects/@types';

import { StyleEditor } from '../../../StyleEditor';
import { MediaSource } from '../MediaSource';

import styles from '../../BackgroundSettings.module.scss';

type BackgroundImage = NonNullable<BackgroundOptions['image']>;

export type ImageProps = {
  image: BackgroundImage;
  canImport: boolean;
  onChange: (image: BackgroundImage) => void;
  onImportAsset: (file: File, fileHandle?: ProjectFileHandle) => Promise<string>;
};

export const Image = ({
  image,
  canImport,
  onChange,
  onImportAsset,
}: ImageProps) => {
  const {
    id,
    src,
    style,
    styleFilters,
  } = image;

  const handlePathChange = (path: string) => {
    onChange({
      ...image,
      src: path,
    });
  };

  return (
    <div className={styles.Media}>
      <MediaSource
        kind="image"
        src={src}
        canImport={canImport}
        onChange={handlePathChange}
        onImportAsset={onImportAsset}
      />

      <details>
        <summary>
          Стили изображения
        </summary>

        <StyleEditor
          value={style ?? {}}
          styleFilters={styleFilters}
          layer="image"
          mediaId={id}
        />
      </details>
    </div>
  );
};
