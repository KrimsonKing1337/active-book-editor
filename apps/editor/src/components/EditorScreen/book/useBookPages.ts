import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { Editor } from '@tiptap/core';

import { useDispatch, useSelector } from '@active-book/core/store';
import { mainActions, mainSelectors } from '@active-book/core/store/main';

import { useGoToPage } from '@active-book/core/hooks/control';

import type { BookDocument } from '@active-book/book-builder/book';

import {
  createEmptyBook,
  createPage,
  replaceEditorDocument,
} from './documents';

import {
  type PageAudioChange,
  belongsToPage,
  getPageAudio,
  toPageAudio,
} from './pageAudio';

type BookPagesOptions = {
  editor: Editor | null;
  flushStyles: () => boolean;
  onError: (message: string) => void;
};

export const useBookPages = ({
  editor,
  flushStyles,
  onError,
}: BookPagesOptions) => {
  const dispatch = useDispatch();

  const [book, setBook] = useState(createEmptyBook);
  const [revision, setRevision] = useState(0);
  const [session, setSession] = useState(0);

  const bookRef = useRef(book);
  const revisionRef = useRef(0);
  const activeIdRef = useRef<string | null>(null);

  const position = useSelector(mainSelectors.page);

  const { goToPage } = useGoToPage();

  const navigateRef = useRef(goToPage);
  navigateRef.current = goToPage;

  const publish = useCallback((next: BookDocument) => {
    bookRef.current = next;

    setBook(next);

    revisionRef.current += 1;

    setRevision(revisionRef.current);
  }, []);

  const readPageAudio = useCallback((pageId: string) => {
    const audioEffects = bookRef.current.audioEffects ?? [];

    return getPageAudio(audioEffects, pageId);
  }, []);

  const writePageAudio = useCallback((change: PageAudioChange) => {
    const { pageId, effects } = change;

    const current = bookRef.current;

    const theSamePage = current.pages.some((pageCur) => {
      return pageCur.id === pageId;
    });

    if (!theSamePage) {
      return;
    }

    const previous = readPageAudio(pageId);

    if (JSON.stringify(previous) === JSON.stringify(effects)) {
      return;
    }

    const retainedAudioEffects = current.audioEffects ?? [];

    const retained = retainedAudioEffects.filter((effectCur) => {
      return !belongsToPage(effectCur, pageId);
    });

    const audioInPage = toPageAudio(change);
    const audioEffects = [...retained, ...audioInPage];

    publish({
      ...current,
      audioEffects,
    });
  }, [publish, readPageAudio]);

  const captureCurrentPage = useCallback(() => {
    if (!editor || !activeIdRef.current) {
      return;
    }

    const document = editor.getJSON();
    const previous = bookRef.current;

    const active = previous.pages.find((pageCur) => {
      return pageCur.id === activeIdRef.current;
    });

    if (!active || JSON.stringify(active.document) === JSON.stringify(document)) {
      return;
    }

    const pages = previous.pages.map((pageCur) => {
      if (pageCur.id === activeIdRef.current) {
        return {
          ...pageCur,
          document,
        };
      }

      return pageCur;
    });

    publish({
      ...previous,
      pages,
    });
  }, [editor, publish]);

  const getSnapshot = useCallback(() => {
    if (!flushStyles()) {
      throw new Error('Не удалось зафиксировать изменения стилей страницы');
    }

    captureCurrentPage();

    return bookRef.current;
  }, [flushStyles, captureCurrentPage]);

  const replaceBook = useCallback((next: BookDocument) => {
    if (!editor) {
      return;
    }

    flushStyles();

    replaceEditorDocument(editor, next.pages[0].document);

    setSession((previousSession) => previousSession + 1);

    activeIdRef.current = next.pages[0].id;

    const pages = next.pages.map((pageCur, index) => {
      if (index === 0) {
        const document = editor.getJSON();

        return {
          ...pageCur,
          document,
        };
      }

      return pageCur;
    });

    publish({
      ...next,
      pages,
    });

    dispatch(mainActions.setStoryPages(pages.map((cur) => cur.id)));

    navigateRef.current(1);
  }, [
    editor,
    flushStyles,
    dispatch,
    publish,
  ]);

  const activePosition = Math.min(Math.max(position, 1), book.pages.length);
  const activePage = book.pages[activePosition - 1];

  const pageAudio = useMemo(() => {
    const descriptions = book.audioEffects ?? [];

    const effects = getPageAudio(descriptions, activePage.id);
    const ids = descriptions.map(({ id }) => id);

    return {
      effects,
      ids,
      read: readPageAudio,
      write: writePageAudio,
    };
  }, [
    book.audioEffects,
    activePage.id,
    readPageAudio,
    writePageAudio,
  ]);

  useLayoutEffect(() => {
    if (!editor) {
      return;
    }

    let cancelled = false;

    if (activeIdRef.current !== activePage.id) {
      const targetId = activePage.id;
      // TipTap's React node views may flush React synchronously. Run outside its commit phase.
      queueMicrotask(() => {
        if (cancelled || editor.isDestroyed) {
          return;
        }

        const target = bookRef.current.pages.find((pageCur) => {
          return pageCur.id === targetId;
        });

        if (!target || !flushStyles()) {
          return;
        }

        captureCurrentPage();

        activeIdRef.current = targetId;

        replaceEditorDocument(editor, target.document);
      });
    }

    dispatch(mainActions.setStoryPages(book.pages.map((cur) => cur.id)));

    if (position !== activePosition) {
      navigateRef.current(activePosition);
    }

    return () => {
      cancelled = true;
    };
  }, [
    editor,
    activePage.id,
    activePosition,
    position,
    book.pages.length,
    flushStyles,
    captureCurrentPage,
    dispatch,
  ]);

  useLayoutEffect(() => {
    if (!editor) {
      return;
    }

    editor.on('update', captureCurrentPage);

    return () => {
      editor.off('update', captureCurrentPage);
    };
  }, [editor, captureCurrentPage]);

  const selectPage = useCallback((id: string) => {
    const current = getSnapshot();

    const index = current.pages.findIndex((pageCur) => pageCur.id === id);

    if (index >= 0) {
      navigateRef.current(id);
    }
  }, [getSnapshot]);

  const addPage = useCallback(() => {
    const current = getSnapshot();
    const newPage = createPage();

    const pages = [...current.pages, newPage];

    const next = {
      ...current,
      pages,
    };

    publish(next);

    dispatch(mainActions.setStoryPages(next.pages.map((cur) => cur.id)));

    navigateRef.current(next.pages.length);
  }, [
    getSnapshot,
    publish,
    dispatch,
  ]);

  const deletePage = useCallback((id: string) => {
    const current = getSnapshot();

    if (current.pages.length === 1) {
      return;
    }

    const index = current.pages.findIndex((pageCur) => pageCur.id === id);

    if (index < 0) {
      return;
    }

    const pages = current.pages.filter((pageCur) => pageCur.id !== id);

    const audioEffectsSafe = current.audioEffects ?? [];

    const audioEffects = audioEffectsSafe.filter((effectCur) => {
      return !belongsToPage(effectCur, id);
    });

    const hasOutOfBoundsAudio = audioEffects.some(({ lifetime }) => {
      if (lifetime.type !== 'range') {
        return false;
      }

      return lifetime.range.some((rangeCur) => {
        return rangeCur.to > pages.length;
      });
    });

    if (hasOutOfBoundsAudio) {
      onError('Удаление страницы нарушит границы диапазона аудиоэффекта');

      return;
    }

    const selected = pages.findIndex((pageCur) => pageCur.id === activeIdRef.current);
    const nextPosition = selected >= 0 ? selected + 1 : Math.min(index + 1, pages.length);

    publish({
      ...current,
      pages,
      audioEffects,
    });

    const pagesIds = pages.map((cur) => cur.id);

    dispatch(mainActions.setStoryPages(pagesIds));

    navigateRef.current(nextPosition);
  }, [
    getSnapshot,
    publish,
    dispatch,
    onError,
  ]);

  const movePage = useCallback((id: string, direction: -1 | 1) => {
    const current = getSnapshot();

    const index = current.pages.findIndex((pageCur) => pageCur.id === id);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= current.pages.length) {
      return;
    }

    const pages = [...current.pages];

    [pages[index], pages[target]] = [pages[target], pages[index]];

    publish({
      ...current,
      pages,
    });

    const selected = pages.findIndex((pageCur) => {
      return pageCur.id === activeIdRef.current;
    });

    const pagesIds = pages.map((cur) => cur.id);

    dispatch(mainActions.setStoryPages(pagesIds));

    navigateRef.current(pages[selected].id);
  }, [
    getSnapshot,
    publish,
    dispatch,
  ]);

  const getRevision = useCallback(() => {
    return revisionRef.current;
  }, []);

  return {
    book,
    session,
    revision,
    activePage,
    activePosition,
    pageAudio,
    getSnapshot,
    getRevision,
    replaceBook,
    selectPage,
    addPage,
    deletePage,
    movePage,
  };
};
