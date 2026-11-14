import { StrictMode } from 'react';

import type { JSONContent } from '@tiptap/core';

import { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import { render } from '@testing-library/react';

import { createProject } from '@root/tests/editor-effects/project';

import { openLocalProject } from '@project/projectService';
import { ProjectAssetsProvider } from '@project/assets';

import { ContentError } from '../../ContentError';
import { editorExtensions } from '../../EditorScreen/utils';

export const imageMarkup = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="300">'
  + '<rect width="120" height="300" fill="green"/></svg>';

export const openMediaEditor = async (content?: JSONContent, strict = false) => {
  const project = await createProject();
  const opened = await openLocalProject();
  const src = await opened.project.storage.importAssetFile(new File([imageMarkup], 'portrait.svg', {
    type: 'image/svg+xml',
  }));
  const editor = new Editor({
    extensions: editorExtensions,
    content: content ?? { type: 'doc', content: [{ type: 'image', attrs: { src, alt: 'Portrait' } }] },
    onContentError: () => {},
  });
  let tree = (
    <ProjectAssetsProvider project={opened.project}>
      <ContentError editor={editor} />
      <EditorContent editor={editor} />
    </ProjectAssetsProvider>
  );

  if (strict) {
    tree = <StrictMode>{tree}</StrictMode>;
  }

  const view = render(tree);

  const dispose = async () => {
    view.unmount();
    editor.destroy();
    await project.dispose();
  };

  return {
    editor,
    project,
    storage: opened.project.storage,
    src,
    dispose,
  };
};
