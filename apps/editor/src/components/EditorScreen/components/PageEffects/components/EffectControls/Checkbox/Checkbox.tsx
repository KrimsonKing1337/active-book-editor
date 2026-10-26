import type { InputHTMLAttributes, ReactNode } from 'react';

import classNames from 'classnames';

import styles from './Checkbox.module.scss';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> & {
  children: ReactNode;
};

export const Checkbox = ({ children, className, ...props }: CheckboxProps) => {
  const checkboxClassNames = classNames(styles.Checkbox, className);

  return (
    <label className={checkboxClassNames}>
      <input {...props} type="checkbox" />

      <span>
        {children}
      </span>
    </label>
  );
};
