let pendingWrites = 0;
let hasPendingStyles = false;
let hasUncommittedStylePreviews = false;

export const beginProjectWrite = (): (() => void) => {
  pendingWrites += 1;

  let finished = false;

  return () => {
    if (finished) {
      return;
    }

    finished = true;
    pendingWrites -= 1;
  };
};

export const trackProjectWrite = async <T>(operation: () => Promise<T>): Promise<T> => {
  const finish = beginProjectWrite();

  try {
    return await operation();
  } finally {
    finish();
  }
};

export const setHasPendingStyles = (hasChanges: boolean): void => {
  hasPendingStyles = hasChanges;
  hasUncommittedStylePreviews = hasChanges;
};

export const markStylePreviewsCommitted = (): void => {
  hasUncommittedStylePreviews = false;
};

export const markProjectStylesSaved = (): void => {
  if (!hasUncommittedStylePreviews) {
    hasPendingStyles = false;
  }
};

export const hasPendingProjectChanges = (): boolean => {
  return hasPendingStyles || pendingWrites > 0;
};
