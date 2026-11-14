import type { BookImageNode, BookVideoNode } from '@active-book/types';

import { Video } from '@active-book/core/components/Video';

import { contentAssetUrl, getMediaStyle } from './layout';

import styles from './ContentMedia.module.scss';

type ContentMediaProps = {
  node: BookImageNode | BookVideoNode;
  id: string;
};

export const ContentMedia = ({ node, id }: ContentMediaProps) => {
  const { attrs } = node;

  const src = contentAssetUrl(attrs.src);
  const style = getMediaStyle(attrs);

  if (node.type === 'image') {
    return (
      <img
        className={styles.Media}
        data-book-media="image"
        src={src}
        alt={node.attrs.alt ?? ''}
        style={style}
      />
    );
  }

  const {
    controls = true,
    autoPlay = false,
    muted = true,
    loop = false,
    poster,
  } = node.attrs;
  let posterUrl: string | undefined;

  if (poster) {
    posterUrl = contentAssetUrl(poster);
  }

  return (
    <Video
      id={id}
      className={styles.Media}
      data-book-media="video"
      src={src}
      poster={posterUrl}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      style={style}
    />
  );
};
