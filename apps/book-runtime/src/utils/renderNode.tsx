import { type Key, type ReactNode, Fragment } from 'react';

import { Counter, H1, H2, P } from 'activeBook-core/components';
import { customComponents } from 'virtual:active-book-custom-components';

import type { BookNode } from '@types';

const renderText = (node: BookNode): ReactNode => {
  const marks = node.marks ?? [];

  let result: ReactNode = node.text ?? '';

  for (const markCur of marks) {
    if (markCur.type === 'bold') result = <strong>{result}</strong>;
    if (markCur.type === 'italic') result = <em>{result}</em>;
    if (markCur.type === 'strike') result = <s>{result}</s>;
    if (markCur.type === 'code') result = <code>{result}</code>;
  }

  return result;
};

export const renderNode = (node: BookNode, key: Key): ReactNode => {
  if (node.type === 'text') {
    return (
      <Fragment key={key}>
        {renderText(node)}
      </Fragment>
    );
  }

  if (node.type === 'hardBreak') {
    return <br key={key} />;
  }

  const content = node.content ?? [];

  const children = content.map((child, index) => {
    return renderNode(child, index);
  });

  if (node.type === 'activeBookH1') return <H1 key={key}>{children}</H1>;
  if (node.type === 'activeBookH2') return <H2 key={key}>{children}</H2>;
  if (node.type === 'activeBookP') return <P key={key} data-active-book-node="P">{children}</P>;

  if (node.type === 'heading') {
    return node.attrs?.level === 1
      ? <H1 key={key}>{children}</H1>
      : <H2 key={key}>{children}</H2>;
  }

  if (node.type === 'paragraph') return <P key={key} data-active-book-node="P">{children}</P>;

  if (node.type === 'coreComponent' && typeof node.attrs?.package === 'string') {
    const componentId = `${node.attrs.package}/${node.attrs.name}`;
    const CustomComponent = customComponents[componentId];

    return CustomComponent
      ? <CustomComponent key={key} />
      : <span key={key}>Unknown custom component: {componentId}</span>;
  }

  if (node.type === 'coreComponent' && node.attrs?.name === 'Counter') {
    return <Counter key={key} />;
  }

  return (
    <Fragment key={key}>
      {children}
    </Fragment>
  );
};
