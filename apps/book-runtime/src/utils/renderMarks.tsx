import type { ReactNode } from 'react';

import type { BookTextMark } from '@active-book/types';

const linkRel = (value: string | null | undefined): string => {
  const tokens = (value ?? '').split(/\s+/);
  const safeTokens = tokens.filter((cur) => cur && cur.toLowerCase() !== 'opener');
  const relations = new Set(safeTokens);

  relations.add('noopener');
  relations.add('noreferrer');

  return [...relations].join(' ');
};

export const renderMarks = (content: ReactNode, marks: BookTextMark[]): ReactNode => {
  let result = content;

  // ProseMirror serializes the first mark as the outermost wrapper.
  for (let index = marks.length - 1; index >= 0; index -= 1) {
    const mark = marks[index];

    switch (mark.type) {
      case 'bold':
        result = <strong>{result}</strong>;

        break;
      case 'italic':
        result = <em>{result}</em>;

        break;
      case 'strike':
        result = <s>{result}</s>;

        break;
      case 'underline':
        result = <u>{result}</u>;

        break;
      case 'code':
        result = <code>{result}</code>;

        break;
      case 'link': {
        const { attrs } = mark;
        const { href, rel } = attrs;

        const target = attrs.target ?? undefined;
        const className = attrs.class ?? undefined;
        const linkedRel = linkRel(rel);

        result = (
          <a
            href={href}
            target={target}
            rel={linkedRel}
            className={className}
          >
            {result}
          </a>
        );

        break;
      }
      default: {
        const jsonString = JSON.stringify(mark);

        throw new Error(`Unsupported reader mark: ${jsonString}`);
      }
    }
  }

  return result;
};
