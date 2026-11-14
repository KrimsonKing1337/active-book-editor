import { useEffect, useState } from 'react';

import { isContentAssetPath, contentMediaFormat } from '@root/packages/book-builder/src/content';

type MediaPosterProps = {
  value: string | null | undefined;
  onChange: (attrs: Record<string, unknown>) => void;
};

export const MediaPoster = ({ value, onChange }: MediaPosterProps) => {
  const [draft, setDraft] = useState(value ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(value ?? '');
    setError('');
  }, [value]);

  const commit = () => {
    const pathIsRight = isContentAssetPath(draft);
    const formatIsRight = contentMediaFormat(draft, 'image');

    if (draft && !pathIsRight) {
      setError('Укажите путь к постеру внутри assets/');

      return;
    }

    if (draft && !formatIsRight) {
      setError('Укажите путь к изображению');

      return;
    }

    setError('');

    const poster = draft || null;

    if (poster !== (value ?? null)) {
      onChange({ poster });
    }
  };

  return (
    <label>
      <span>
        Постер (путь в assets/)
      </span>

      <input
        value={draft}
        placeholder="assets/poster.png"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
      />

      {error && (
        <span role="alert">
          {error}
        </span>
      )}
    </label>
  );
};
