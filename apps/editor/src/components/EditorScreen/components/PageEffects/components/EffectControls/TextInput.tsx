import type { InputHTMLAttributes } from 'react';

import { forwardRef } from 'react';

import styles from './EffectControls.module.scss';

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((
  { className, type = 'text', ...props },
  ref,
) => {
  const classes = [styles.Input, className].filter(Boolean).join(' ');

  return <input {...props} ref={ref} type={type} className={classes} />;
});

TextInput.displayName = 'TextInput';
