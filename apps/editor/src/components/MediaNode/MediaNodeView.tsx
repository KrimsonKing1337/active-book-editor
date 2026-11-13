import { useState } from 'react';

import type { NodeViewProps } from '@tiptap/react';

import { NodeViewWrapper } from '@tiptap/react';

import { assertContentNode } from '@active-book/book-builder/content';

import { getMediaStyle } from '@root/apps/book-runtime/src/components/ContentMedia/layout';
import mediaStyles from '@root/apps/book-runtime/src/components/ContentMedia/ContentMedia.module.scss';

import { useProjectAssetUrls } from '@project/ProjectAssets';

import { MediaSettings } from './MediaSettings';

import styles from './MediaNode.module.scss';

export const MediaNodeView = ({
  node,
  selected,
  updateAttributes,
}: NodeViewProps) => {
  const content: unknown = node.toJSON();
  assertContentNode(content);

  if (content.type !== 'image' && content.type !== 'video') {
    throw new Error('MediaNodeView requires an image or video node');
  }
  const { attrs, type } = content;
  const paths = [attrs.src];

  if (type === 'video' && content.attrs.poster) {
    paths.push(content.attrs.poster);
  }

  const { urls, errors } = useProjectAssetUrls(paths);
  const [failed, setFailed] = useState<string | null>(null);
  const src = urls.get(attrs.src);
  let error = errors.get(attrs.src);
  let poster: string | undefined;
  let alt = '';

  if (content.type === 'image') {
    alt = content.attrs.alt ?? '';
  } else if (content.attrs.poster) {
    poster = urls.get(content.attrs.poster);
    error ??= errors.get(content.attrs.poster);
  }

  if (src && failed === src) {
    error = `Не удалось прочитать медиа ${attrs.src}. Проверьте формат файла`;
  }

  const style = getMediaStyle(attrs);
  const handleError = () => setFailed(src ?? null);
  let preview;

  if (src && failed !== src) {
    if (content.type === 'image') {
      preview = <img
        className={mediaStyles.Media}
        src={src}
        alt={alt}
        style={style}
        onError={handleError}
      />;
    } else {
      preview = (
        <video
          className={mediaStyles.Media}
          src={src}
          poster={poster}
          style={style}
          preload="metadata"
          autoPlay={false}
          controls={false}
          muted
          onError={handleError}
        />
      );
    }
  }

  return (
    <NodeViewWrapper
      className={styles.Node}
      data-editor-media={type}
      data-selected={selected}
      contentEditable={false}
    >
      {preview}

      {!src && !error && (
        <span>
          Загрузка медиа...
        </span>
      )}

      {error && (
        <div role="alert">
          {error}
        </div>
      )}

      {selected && (
        <MediaSettings node={content} onChange={updateAttributes} />
      )}
    </NodeViewWrapper>
  );
};
