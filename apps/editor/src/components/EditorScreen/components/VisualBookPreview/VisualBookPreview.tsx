import type { PropsWithChildren, ReactNode } from 'react';

import type { VisualEffectDefinition } from '@active-book/types';

import type { Config } from 'activeBook-core/@types';

import { AppWrapper } from 'activeBook-core/components';

import type { BookDocument } from '@active-book/book-builder/book';

import {
  type VisualDraft,
  compileVisualEffects,
  draftToVisual,
  pageVisualEffects,
  getVisualCategory,
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
  const {
    effects,
    frameItemPreviews,
    frameStylePreviews,
    selectedVisualEffectId,
  } = usePageEffects();
  const backgroundStyles = useBackgroundStylePreviews();

  const page = book.pages.find((cur) => cur.id === pageId);
  const previous = page ? pageVisualEffects(page.document) : [];

  const visualEffects = effects.filter((effectCur) => {
    return effectCur.type === 'background' || effectCur.type === 'frame';
  });

  const visuals = visualEffects.map((effectCur) => {
    let options;

    if (effectCur.type === 'frame') {
      options = resolveFramePreview({
        effect: effectCur,
        previews: frameItemPreviews,
        stylePreviews: frameStylePreviews,
      });
    } else {
      options = resolveBackgroundPreview({
        effect: effectCur,
        stylePreviews: backgroundStyles,
      });
    }

    const draft = {
      ...effectCur,
      options,
    };

    const previousRegistration = previous.find((registrationCur) => {
      return registrationCur.effect.id === draft.id;
    });

    return draftToVisual({
      draft: draft as VisualDraft,
      pageId,
      previous: previousRegistration,
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

  const hiddenRegistrations = registrations.filter((registrationCur) => {
    const category = getVisualCategory(registrationCur.effect.definitionId);

    if (category === 'background') {
      return !showBackgrounds;
    }

    return !showFrameEffects;
  });

  const hidden = hiddenRegistrations.map((registrationCur) => {
    return registrationCur.effect.id;
  });

  return (
    <AppWrapper
      bookKey={session}
      config={config}
      tableOfContents={[]}
      rangeEffects={[]}
      registrations={registrations}
      definitions={definitions}
      hiddenVisualEffects={hidden}
      selectedVisualEffectId={selectedVisualEffectId}
      editorTools={editorTools}
    >
      {children}
    </AppWrapper>
  );
};
