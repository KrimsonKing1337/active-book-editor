import type { ChangeEvent } from 'react';

import type { ProjectFileHandle } from '@project/fileSystemAccess';

import type { BackgroundOptions } from '@components/EditorScreen/components/PageEffects/@types';

import { StyleEditor } from '../../../StyleEditor';
import { MediaSource } from '../MediaSource';

import { Checkbox } from '../../../EffectControls';

import styles from '../../BackgroundSettings.module.scss';

type BackgroundVideo = NonNullable<BackgroundOptions['video']>;

export type VideoProps = {
  video: BackgroundVideo;
  canImport: boolean;
  onChange: (video: BackgroundVideo) => void;
  onImportAsset: (file: File, fileHandle?: ProjectFileHandle) => Promise<string>;
};

export const Video = ({ video, canImport, onChange, onImportAsset }: VideoProps) => {
  const { id, src, style, styleFilters, loop, autoPlay, muted } = video;

  const handlePathChange = (path: string) => {
    onChange({ ...video, src: path });
  };

  const handleLoopChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...video, loop: e.target.checked });
  };

  const handleAutoPlayChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...video, autoPlay: e.target.checked });
  };

  const handleMutedChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...video, muted: e.target.checked });
  };

  return (
    <div className={styles.Media}>
      <MediaSource
        kind="video"
        src={src}
        canImport={canImport}
        onChange={handlePathChange}
        onImportAsset={onImportAsset}
      />

      <div className={styles.Checkboxes}>
        <Checkbox checked={loop ?? true} onChange={handleLoopChange}>
          Зациклить
        </Checkbox>

        <Checkbox checked={autoPlay ?? true} onChange={handleAutoPlayChange}>
          Автозапуск
        </Checkbox>

        <Checkbox checked={muted ?? true} onChange={handleMutedChange}>
          Без звука
        </Checkbox>
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
    </div>
  );
};
