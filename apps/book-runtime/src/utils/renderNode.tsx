import type {
  ComponentType,
  Key,
  ReactNode,
} from 'react';

import { Fragment } from 'react';

import type {
  BookComponentProps,
  BookContentNode,
  BookRuntime,
  BookTextMark,
} from '@active-book/types';

import {
  Counter,
  H1,
  H2,
  P,
} from '@active-book/core/components';

import { assertContentNode } from '@active-book/book-builder/content';

const linkRel = (value: string | null | undefined): string => {
  const tokens = (value ?? '').split(/\s+/);
  const safeTokens = tokens.filter((token) => token && token.toLowerCase() !== 'opener');
  const relations = new Set(safeTokens);

  relations.add('noopener');
  relations.add('noreferrer');

  return [...relations].join(' ');
};

const renderMarks = (content: ReactNode, marks: BookTextMark[]): ReactNode => {
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
      case 'link':
        result = (
          <a
            href={mark.attrs.href}
            target={mark.attrs.target ?? undefined}
            rel={linkRel(mark.attrs.rel)}
            className={mark.attrs.class ?? undefined}
          >
            {result}
          </a>
        );
        break;
      default: {
        const unsupported: never = mark;

        throw new Error(`Unsupported reader mark: ${JSON.stringify(unsupported)}`);
      }
    }
  }

  return result;
};

type RenderNodeParams = {
  node: unknown;
  key: Key;
  customComponents: Record<string, ComponentType>;
  bookRuntime: BookRuntime;
  path?: string;
};

type ValidatedNodeParams = Omit<RenderNodeParams, 'node' | 'path'> & {
  node: BookContentNode;
  path: string;
};

const renderValidatedNode = ({
  node,
  key,
  customComponents,
  bookRuntime,
  path,
}: ValidatedNodeParams): ReactNode => {
  if (node.type === 'text') {
    return <Fragment key={key}>{renderMarks(node.text, node.marks ?? [])}</Fragment>;
  }

  if (node.type === 'hardBreak') {
    return <Fragment key={key}>{renderMarks(<br />, node.marks ?? [])}</Fragment>;
  }

  if (node.type === 'coreComponent') {
    const { name, package: packageName } = node.attrs;

    if (packageName) {
      const componentId = `${packageName}/${name}`;
      const CustomComponent = customComponents[componentId];

      if (!CustomComponent) {
        throw new Error(`${path}: unknown custom component "${componentId}"`);
      }

      const props: BookComponentProps = { book: bookRuntime };

      return <CustomComponent key={key} {...props} />;
    }

    if (name === 'Counter') {
      return <Counter key={key} />;
    }

    throw new Error(`${path}: unknown core component "${name}"`);
  }

  const children = (node.content ?? []).map((child, index) => {
    return renderValidatedNode({
      node: child,
      key: index,
      customComponents,
      bookRuntime,
      path: `${path}.content[${index}]`,
    });
  });

  if (node.type === 'paragraph') {
    return <P key={key} data-active-book-node="paragraph">{children}</P>;
  }

  if (node.attrs.level === 1) {
    return <H1 key={key}>{children}</H1>;
  }

  return <H2 key={key}>{children}</H2>;
};

export const renderNode = ({
  node,
  path = 'node',
  ...context
}: RenderNodeParams): ReactNode => {
  assertContentNode(node, path);

  return renderValidatedNode({
    node,
    path,
    ...context,
  });
};
