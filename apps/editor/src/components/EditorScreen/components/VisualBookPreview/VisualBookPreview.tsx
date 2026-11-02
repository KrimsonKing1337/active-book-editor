import type { PropsWithChildren, ReactNode } from 'react';

import type { VisualEffectDefinition } from '@active-book/types';

import type { Config } from 'activeBook-core/@types';

import { AppWrapper } from 'activeBook-core/components';

import type { BookDocument } from '@active-book/book-builder/book';
import {
  compileVisualEffects,
  draftToVisual,
  pageVisualEffects,
  visualCategory,
} from '@active-book/book-builder/visualEffects';

import type { BookProject } from '@project/@types';

import { useBackgroundStylePreviews, usePageEffects } from '../PageEffects/context';
import { resolveFramePreview } from './resolveFramePreview';
import { resolveBackgroundPreview } from './resolveBackgroundPreview';

import { useVisualAssets } from './useVisualAssets';

type VisualBookPreviewProps = PropsWithChildren<{
  book: BookDocument;
  pageId: string;
  session: number;
  config: Config;
  definitions: VisualEffectDefinition[];
  project: BookProject | null;
  showBackgrounds: boolean;
  showFrameEffects: boolean;
  editorTools: ReactNode;
}>;

export const VisualBookPreview = ({
  book,
  pageId,
  session,
  config,
  definitions,
  project,
  showBackgrounds,
  showFrameEffects,
  editorTools,
  children,
}: VisualBookPreviewProps) => {
  const { effects, frameItemPreviews, frameStylePreviews } = usePageEffects();
  const backgroundStyles = useBackgroundStylePreviews();
  const page = book.pages.find((cur) => cur.id === pageId);
  const previous = page ? pageVisualEffects(page.document) : [];
  const visuals = effects.filter((cur) => cur.type === 'background' || cur.type === 'frame').map((draftCur) => {
    let draft = draftCur;
    if (draftCur.type === 'frame') {
      const options = resolveFramePreview({
        effect: draftCur,
        previews: frameItemPreviews,
        stylePreviews: frameStylePreviews,
      });
      draft = {
        ...draftCur,
        options,
      };
    } else {
      draft = {
        ...draftCur,
        options: resolveBackgroundPreview({ effect: draftCur, stylePreviews: backgroundStyles }),
      };
    }
    return draftToVisual({
      draft,
      pageId,
      previous: previous.find((cur) => cur.effect.id === draft.id),
    });
  });
  const previewPages = book.pages.map((pageCur) => {
    if (pageCur.id !== pageId) {
      return pageCur;
    }
    const attrs = {
      ...pageCur.document.attrs,
      visualEffects: visuals,
    };
    const document = {
      ...pageCur.document,
      attrs,
    };

    return {
      ...pageCur,
      document,
    };
  });
  const previewBook = {
    ...book,
    pages: previewPages,
  };
  const registrations = useVisualAssets({
    registrations: compileVisualEffects(previewBook),
    project,
    session,
  });
  const hidden = registrations.filter((cur) => visualCategory(cur.effect.definitionId) === 'background'
    ? !showBackgrounds : !showFrameEffects).map((cur) => cur.effect.id);

  return (
    <AppWrapper
      bookKey={session}
      config={config}
      tableOfContents={[]}
      rangeEffects={[]}
      registrations={registrations}
      definitions={definitions}
      hiddenVisualEffects={hidden}
      editorTools={editorTools}
    >
      {children}
    </AppWrapper>
  );
};
