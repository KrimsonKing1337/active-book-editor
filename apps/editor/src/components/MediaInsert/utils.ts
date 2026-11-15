import { contentMediaFormats, contentMediaFormat } from '@active-book/book-builder/content';

import type { FilePickerWindow } from '@project/@types/fileSystemAccess';

import type { MediaKind } from '../MediaNode/utils';

export const mediaFormats = contentMediaFormats;

export const hasFilePicker = (target: Window): target is FilePickerWindow => {
  return 'showOpenFilePicker' in target && typeof target.showOpenFilePicker === 'function';
};

export const assertMediaFile = (file: File, kind: MediaKind): void => {
  const format = contentMediaFormat(file.name, kind);
  const hasMatchingMime = !file.type || file.type.toLowerCase() === format?.[0];

  if (!format || !hasMatchingMime || !file.size) {
    throw new Error('Выберите непустой медиафайл поддерживаемого формата');
  }

  if (kind === 'video' && !document.createElement('video').canPlayType(format[0])) {
    throw new Error('Этот браузер не поддерживает выбранный формат видео');
  }
};
