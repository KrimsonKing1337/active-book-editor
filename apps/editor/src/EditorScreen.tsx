import { useState } from 'react';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { App, PageWrapper } from 'activeBook-core/components';
import type { Config } from 'activeBook-core/@types';

import 'activeBook-core/styles/styles.scss';

import { CoreComponentNode } from './CoreComponentNode';

const config: Config = {
  id: 'editor-preview',
  authorComments: 0,
  pages: 0,
  defaultTheme: 'light',
};

const initialContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Новая активная книга' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Этот текст можно менять прямо внутри PageWrapper.' }],
    },
  ],
};

export function EditorScreen() {
  const [buildState, setBuildState] = useState<'idle' | 'building' | 'success' | 'error'>('idle');

  const editor = useEditor({
    extensions: [
      StarterKit,
      CoreComponentNode,
    ],
    content: initialContent,
  });

  const insertCounter = () => {
    editor?.chain().focus().insertContent({
      type: 'coreComponent',
      attrs: { name: 'Counter' },
    }).run();
  };

  const buildBook = async () => {
    if (!editor) return;

    setBuildState('building');

    try {
      const response = await fetch('/__active-book/build', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ document: editor.getJSON() }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setBuildState('success');
    } catch (error) {
      console.error(error);
      setBuildState('error');
    }
  };

  return (
    <div className="editor-shell">
      <header className="editor-toolbar">
        <strong>Active Book Editor</strong>
        <div className="editor-actions">
          <button type="button" onClick={insertCounter}>Добавить Counter</button>
          <button type="button" onClick={buildBook} disabled={!editor || buildState === 'building'}>
            {buildState === 'building' ? 'Сборка…' : 'Собрать книгу'}
          </button>
        </div>
      </header>

      <div className="build-status" data-state={buildState}>
        {buildState === 'success' && 'Готово: результат в dist-book/'}
        {buildState === 'error' && 'Сборка завершилась с ошибкой. Смотри консоль dev-сервера.'}
      </div>

      <main className="editor-canvas">
        <App config={config} tableOfContents={[]} rangeEffects={[]}>
          <PageWrapper withoutToolbar>
            <EditorContent editor={editor} />
          </PageWrapper>
        </App>
      </main>
    </div>
  );
}
