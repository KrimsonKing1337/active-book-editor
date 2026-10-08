import {
  type DependencyList,
  useEffect,
} from 'react';

export type AsyncEffect = (signal: AbortSignal) => Promise<void>;

export const useAsyncEffect = (
  effect: AsyncEffect,
  dependencies: DependencyList,
): void => {
  useEffect(() => {
    const controller = new AbortController();

    void effect(controller.signal);

    return () => {
      controller.abort();
    };
  }, dependencies);
};
