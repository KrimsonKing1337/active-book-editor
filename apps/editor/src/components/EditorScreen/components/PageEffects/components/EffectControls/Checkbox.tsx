import type { InputHTMLAttributes, ReactNode } from 'react';

import styles from './EffectControls.module.scss';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> & {
  children: ReactNode;
};

export const Checkbox = ({ children, className, ...props }: CheckboxProps) => {
  const classes = [styles.Checkbox, className].filter(Boolean).join(' ');

  return (
    <label className={classes}>
      <input {...props} type="checkbox" />
      <span>{children}</span>
    </label>
  );
};
