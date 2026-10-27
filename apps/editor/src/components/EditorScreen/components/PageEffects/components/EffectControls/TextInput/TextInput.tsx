import type { ComponentPropsWithRef } from 'react';

import classNames from 'classnames';

import sharedStyles from '../EffectControls.module.scss';
import styles from './TextInput.module.scss';

export const TextInput = ({
  className,
  type = 'text',
  ref,
  ...props
}: ComponentPropsWithRef<'input'>) => {
  const inputClassNames = classNames(sharedStyles.Control, styles.Input, className);

  return <input
    {...props}
    ref={ref}
    type={type}
    className={inputClassNames}
  />;
};
