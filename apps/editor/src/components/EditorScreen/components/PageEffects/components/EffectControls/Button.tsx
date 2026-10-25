import type { ButtonHTMLAttributes } from 'react';

import { forwardRef } from 'react';

import styles from './EffectControls.module.scss';

export type ButtonVariant = 'default' | 'success' | 'danger';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((
  { variant = 'default', className, type = 'button', children, ...props },
  ref,
) => {
  let variantClass = '';

  if (variant === 'success') {
    variantClass = styles.Success;
  } else if (variant === 'danger') {
    variantClass = styles.Danger;
  }

  const classes = [styles.Button, variantClass, className].filter(Boolean).join(' ');

  return (
    <button
      {...props}
      ref={ref}
      className={classes}
      type={type}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
