import { useState } from 'react';

import styles from './Counter.module.scss';

export const Counter = () => {
  const [count, setCount] = useState(0);

  const minusClickHandler = () => {
    setCount((value) => value - 1);
  };

  const plusClickHandler = () => {
    setCount((value) => value + 1);
  };

  return (
    <div className={styles.Counter}>
      <button type="button" onClick={minusClickHandler}>
        -
      </button>

      <div>
        {count}
      </div>

      <button type="button" onClick={plusClickHandler}>
        +
      </button>
    </div>
  );
};
