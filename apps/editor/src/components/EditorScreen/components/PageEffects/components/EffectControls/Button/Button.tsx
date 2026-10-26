import type { ComponentPropsWithRef } from 'react';

import classNames from 'classnames';

import styles from './Button.module.scss';

export type ButtonVariant = 'default' | 'success' | 'danger';

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: ButtonVariant;
};

export const Button = ({
  variant = 'default',
  className,
  type = 'button',
  children,
  ref,
  ...props
}: ButtonProps) => {
  const buttonClassNames = classNames({
    [styles.Button]: true,
    [styles.Success]: variant === 'success',
    [styles.Danger]: variant === 'danger',
  }, className);

  return (
    <button
      {...props}
      ref={ref}
      className={buttonClassNames}
      type={type}
    >
      {children}
    </button>
  );
};
