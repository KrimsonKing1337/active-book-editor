import { useState } from 'react';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';

import { App, PageWrapper } from 'activeBook-core/components';
import type { Config } from 'activeBook-core/@types';

import 'activeBook-core/styles/styles.scss';

import { CoreComponentNode } from './CoreComponentNode';
import { PNode, H1Node, H2Node } from './EditableComponentNode';

export const ActiveBookDocument = Document.extend({
  content: '(activeBookP | activeBookH1 | activeBookH2 | coreComponent)+',
});

const config: Config = {
  id: 'editor-preview',
  authorComments: 0,
  pages: 0,
  defaultTheme: 'dark',
  disableThemes: false,
};

export function EditorScreen() {
  const [buildState, setBuildState] = useState<'idle' | 'building' | 'success' | 'error'>('idle');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        document: false,
        paragraph: false,
        heading: false,
        blockquote: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),

      ActiveBookDocument,

      CoreComponentNode,
      PNode,
      H1Node,
      H2Node,
    ],
  });

  const insertComponent = (name: string) => {
    editor?.chain().focus().insertContent({
      type: 'coreComponent',
      attrs: { name },
    }).run();
  };

  const insertTextComponent = (name: 'P' | 'H1' | 'H2') => {
    const typeMap = {
      P: 'activeBookP',
      H1: 'activeBookH1',
      H2: 'activeBookH2',
    } as const;

    editor
      ?.chain()
      .focus()
      .insertContent({
        type: typeMap[name],
      })
      .run();
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
          <button type="button" onClick={() => insertComponent('Counter')}>
            Добавить Counter
          </button>

          <button type="button" onClick={() => insertTextComponent('P')}>
            Добавить параграф
          </button>

          <button type="button" onClick={() => insertTextComponent('H1')}>
            Добавить заголовок 1
          </button>

          <button type="button" onClick={() => insertTextComponent('H2')}>
            Добавить заголовок 2
          </button>

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
          <PageWrapper>
            <EditorContent editor={editor} />
          </PageWrapper>
        </App>
      </main>
    </div>
  );
}
