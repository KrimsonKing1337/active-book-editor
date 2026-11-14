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
} from '@active-book/types';

import {
  Carousel,
  Counter,
  H1,
  H2,
  P,
} from '@active-book/core/components';

import { assertContentNode } from '@active-book/book-builder/content';

import { ContentMedia } from '@components/ContentMedia';

import { renderMarks } from './renderMarks';

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
    const marks = node.marks ?? [];

    return (
      <Fragment key={key}>
        {renderMarks(node.text, marks)}
      </Fragment>
    );
  }

  if (node.type === 'hardBreak') {
    const marks = node.marks ?? [];

    return (
      <Fragment key={key}>
        {renderMarks(<br />, marks)}
      </Fragment>
    );
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

  if (node.type === 'image' || node.type === 'video') {
    return <ContentMedia key={key} node={node} id={`media:${path}`} />;
  }

  const content = node.content ?? [];

  const children = content.map((childCur, index) => {
    const childPath = `${path}.content[${index}]`;

    return renderValidatedNode({
      node: childCur,
      key: index,
      customComponents,
      bookRuntime,
      path: childPath,
    });
  });

  if (node.type === 'carousel') {
    return <Carousel key={key} slides={children} />;
  }

  if (node.type === 'carouselSlide') {
    return (
      <Fragment key={key}>
        {children}
      </Fragment>
    );
  }

  if (node.type === 'paragraph') {
    return (
      <P key={key} data-active-book-node="paragraph">
        {children}
      </P>
    );
  }

  if (node.attrs.level === 1) {
    return (
      <H1 key={key}>
        {children}
      </H1>
    );
  }

  return (
    <H2 key={key}>
      {children}
    </H2>
  );
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
