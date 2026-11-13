import { useEffect, useState } from 'react';

import { isContentAssetPath, contentMediaFormat } from '@active-book/book-builder/content';

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
    if (draft && (!isContentAssetPath(draft) || !contentMediaFormat(draft, 'image'))) {
      setError('Укажите путь к постеру внутри assets/');

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
      Постер (путь в assets/)
      <input
        value={draft}
        placeholder="assets/poster.png"
        onChange={(event) => setDraft(event.target.value)}
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
