import type { SelectHTMLAttributes } from 'react';

import { forwardRef } from 'react';

import styles from './EffectControls.module.scss';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>((
  { className, children, ...props },
  ref,
) => {
  const classes = [styles.Select, className].filter(Boolean).join(' ');

  return <select {...props} ref={ref} className={classes}>{children}</select>;
});

Select.displayName = 'Select';
