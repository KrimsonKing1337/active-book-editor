import React from 'react';

import { Counter, H1, H2, P } from 'activeBook-core/components';

const renderText = (node) => {
  let result = node.text ?? '';

  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') result = <strong>{result}</strong>;
    if (mark.type === 'italic') result = <em>{result}</em>;
    if (mark.type === 'strike') result = <s>{result}</s>;
    if (mark.type === 'code') result = <code>{result}</code>;
  }

  return result;
};

export const renderNode = (node, key) => {
  if (node.type === 'text') {
    return <React.Fragment key={key}>{renderText(node)}</React.Fragment>;
  }

  const children = (node.content ?? []).map((child, index) => renderNode(child, index));

  if (node.type === 'activeBookH1') return <H1 key={key}>{children}</H1>;
  if (node.type === 'activeBookH2') return <H2 key={key}>{children}</H2>;
  if (node.type === 'activeBookP') return <P key={key}>{children}</P>;

  // Backward compatibility with standard TipTap nodes.
  if (node.type === 'heading') {
    return node.attrs?.level === 1
      ? <H1 key={key}>{children}</H1>
      : <H2 key={key}>{children}</H2>;
  }

  if (node.type === 'paragraph') return <P key={key}>{children}</P>;

  if (node.type === 'coreComponent' && node.attrs?.name === 'Counter') {
    return <Counter key={key} />;
  }

  return <React.Fragment key={key}>{children}</React.Fragment>;
};
