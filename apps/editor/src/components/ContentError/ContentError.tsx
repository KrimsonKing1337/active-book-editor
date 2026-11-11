import { useEffect, useState } from 'react';

import type { Editor } from '@tiptap/core';

export const ContentError = ({ editor }: { editor: Editor | null }) => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleError = ({ error }: { error: Error }) => setMessage(error.message);
    const handleUpdate = () => setMessage('');

    editor.on('contentError', handleError);
    editor.on('update', handleUpdate);

    return () => {
      editor.off('contentError', handleError);
      editor.off('update', handleUpdate);
    };
  }, [editor]);

  if (!message) {
    return null;
  }

  return (
    <div role="alert">
      Содержимое не изменено: {message}
    </div>
  );
};
