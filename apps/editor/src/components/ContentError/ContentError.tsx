import { useEffect, useState } from 'react';

import type { Editor } from '@tiptap/core';

export type ContentErrorProps = {
  editor: Editor | null;
};

type HandleErrorArgs = {
  error: Error;
};

export const ContentError = ({ editor }: ContentErrorProps) => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleError = ({ error }: HandleErrorArgs) => {
      setMessage(error.message);
    };

    const handleUpdate = () => {
      setMessage('');
    };

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
