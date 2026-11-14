import { useEffect, useRef } from 'react';

import { getHasPendingProjectChanges } from '@project/pendingOperations';

export const useBeforeUnload = (isDirty: boolean): void => {
  const isDirtyRef = useRef(isDirty);

  isDirtyRef.current = isDirty;

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const hasPendingProjectChanges = getHasPendingProjectChanges();

      if (isDirtyRef.current || hasPendingProjectChanges) {
        event.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
};
