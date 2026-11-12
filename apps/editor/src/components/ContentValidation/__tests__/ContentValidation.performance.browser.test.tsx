import { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import { cleanup, render } from '@testing-library/react';
import {
  expect,
  inject,
  test,
} from 'vitest';
import { userEvent } from 'vitest/browser';

import { createLongDocument } from '@root/tests/fixtures/long-content';

import { editorExtensions } from '../../EditorScreen/utils';

declare module 'vitest' {
  interface ProvidedContext {
    contentBenchmark: boolean;
  }

  interface TaskMeta {
    contentValidation?: unknown[];
  }
}

const summarize = (samples: number[]) => {
  const sorted = [...samples].sort((left, right) => left - right);
  const percentile = (fraction: number) => sorted[Math.floor((sorted.length - 1) * fraction)];

  return {
    count: samples.length,
    p50Ms: percentile(0.5),
    p95Ms: percentile(0.95),
    totalMs: samples.reduce((total, duration) => total + duration, 0),
  };
};

test.skipIf(!inject('contentBenchmark'))('measures validation in mounted long-page editing', async (context) => {
  const reports: unknown[] = [];

  context.task.meta.contentValidation = reports;

  for (const paragraphs of [1000, 5000, 10000]) {
    const editor = new Editor({ extensions: editorExtensions, content: createLongDocument(paragraphs) });
    const validationTimes: number[] = [];
    const dispatchTimes: number[] = [];
    const validators = editor.state.plugins.filter((plugin) => Boolean(plugin.spec.filterTransaction));

    expect(validators).toHaveLength(1);
    const plugin = validators[0];
    const originalFilter = plugin.spec.filterTransaction;

    if (!originalFilter) {
      throw new Error('Expected the content validation filter');
    }

    plugin.spec.filterTransaction = (transaction, state) => {
      const start = performance.now();
      const accepted = originalFilter.call(plugin, transaction, state);

      if (transaction.docChanged) {
        validationTimes.push(performance.now() - start);
      }

      return accepted;
    };

    const originalDispatch = editor.view.dispatch.bind(editor.view);

    editor.view.dispatch = (transaction) => {
      const start = performance.now();

      originalDispatch(transaction);

      if (transaction.docChanged) {
        dispatchTimes.push(performance.now() - start);
      }
    };

    const measurements: Record<string, unknown> = {};
    const record = (scenario: string) => {
      measurements[scenario] = {
        validation: summarize(validationTimes),
        dispatch: summarize(dispatchTimes),
      };
      validationTimes.length = 0;
      dispatchTimes.length = 0;
    };

    try {
      render(<EditorContent editor={editor} />);
      editor.commands.selectCarouselSlide(0, 0);
      editor.commands.focus();
      await userEvent.keyboard('warmup');
      validationTimes.length = 0;
      dispatchTimes.length = 0;

      await userEvent.keyboard('x'.repeat(100));
      expect(validationTimes).toHaveLength(100);
      record('typing');

      for (let index = 0; index < 20; index += 1) {
        const clipboardData = new DataTransfer();

        clipboardData.setData('text/html', '<p>Pasted first</p><h2>Pasted heading</h2><p>Last</p>');
        editor.view.dom.dispatchEvent(new ClipboardEvent('paste', {
          clipboardData,
          bubbles: true,
          cancelable: true,
        }));
      }

      expect(validationTimes).toHaveLength(20);
      record('paste');

      for (let revision = 1; revision <= 10; revision += 1) {
        editor.commands.setContent(createLongDocument(paragraphs, revision));
      }

      expect(validationTimes).toHaveLength(10);
      record('bulkReplacement');

      const jsonBytes = new TextEncoder().encode(JSON.stringify(editor.getJSON())).length;

      const report = {
        userAgent: navigator.userAgent,
        hardwareConcurrency: navigator.hardwareConcurrency,
        paragraphs,
        carousels: 10,
        slidesPerCarousel: 2,
        blocksPerSlide: 10,
        jsonBytes,
        measurements,
      };

      reports.push(report);
    } finally {
      cleanup();
      editor.destroy();
    }
  }
}, 180000);
