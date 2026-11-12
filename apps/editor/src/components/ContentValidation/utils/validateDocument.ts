import { type Node, Fragment } from '@tiptap/pm/model';

import { assertContentDocument } from '@active-book/book-builder/content';

export const createDocumentValidator = () => {
  // Only accepted document identities are trusted. No node/JSON copies are cached.
  const checked = new WeakSet<Node>();

  return (doc: Node, previous?: Node): void => {
    let candidate = doc;

    if (previous && checked.has(previous)) {
      const start = previous.content.findDiffStart(doc.content);
      const changed: Node[] = [];

      if (start !== null) {
        const end = previous.content.findDiffEnd(doc.content);

        const endPoint = Math.max(start + 1, end?.b ?? start);
        const to = Math.min(doc.content.size, endPoint);

        // Include whole top-level blocks, even when a diff begins inside text.
        doc.nodesBetween(start, to, (node) => {
          changed.push(node);

          return false;
        });
      }

      // A complete replacement needs the original full validation, without a projection.
      if (changed.length < doc.childCount) {
        if (!doc.type.validContent(doc.content)) {
          doc.check();
        }

        let content = Fragment.from(changed);

        // Keep root type/attrs/marks checks on document-only attribute changes.
        if (changed.length === 0 && doc.firstChild) {
          content = Fragment.from(doc.firstChild);
        }

        // This is only a validation projection of changed blocks, not a new
        // authoritative document. On errors, validate the original doc in full.
        candidate = doc.copy(content);
      }
    }

    try {
      candidate.check();
      assertContentDocument(candidate.toJSON());
    } catch (error) {
      if (candidate === doc) {
        throw error;
      }

      // Fall back to the complete document for original diagnostic paths and any
      // schema constraint that needs the full sequence of top-level children.
      doc.check();
      assertContentDocument(doc.toJSON());
    }

    // Rejected transactions must never become a trusted diff base.
    checked.add(doc);
  };
};
