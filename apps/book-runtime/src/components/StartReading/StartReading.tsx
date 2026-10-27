import { useGoToPage } from 'activeBook-core/hooks/control/useGoToPage';

import { Action } from 'activeBook-core/components';

import styles from './StartReading.module.scss';

export const StartReading = () => {
  const { goToPage } = useGoToPage();

  const handleStart = () => {
    goToPage(1);
  };

  // Native button activation (mouse, touch, keyboard) also triggers Page0's audio-unlock listener.
  return (
    <button className={styles.StartReading} type="button" onClick={handleStart}>
      <Action fullWidth withSpaces={false} style={{ fontSize: '1.375em' }}>
        Начать читать
      </Action>
    </button>
  );
};
