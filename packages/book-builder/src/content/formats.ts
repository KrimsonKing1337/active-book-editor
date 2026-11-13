const image = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/avif': ['.avif'],
  'image/svg+xml': ['.svg'],
  'image/bmp': ['.bmp'],
};
const video = {
  'video/mp4': ['.mp4', '.m4v'],
  'video/webm': ['.webm'],
  'video/ogg': ['.ogv'],
};

export const contentMediaFormats = { image, video };

export const contentMediaFormat = (filename: string, kind: 'image' | 'video') => {
  const extension = /\.[^.]+$/u.exec(filename)?.[0].toLowerCase();

  return Object.entries(contentMediaFormats[kind]).find(([, extensions]) => {
    return extension && extensions.includes(extension);
  });
};
