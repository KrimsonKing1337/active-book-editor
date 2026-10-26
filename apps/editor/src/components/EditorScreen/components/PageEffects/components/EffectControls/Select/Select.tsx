import type { ComponentPropsWithRef } from 'react';

import classNames from 'classnames';

import sharedStyles from '../EffectControls.module.scss';
import styles from './Select.module.scss';

export const Select = ({ className, children, ref, ...props }: ComponentPropsWithRef<'select'>) => {
  const selectClassNames = classNames(sharedStyles.Control, styles.Select, className);

  return (
    <select {...props} ref={ref} className={selectClassNames}>
      {children}
    </select>
  );
};
