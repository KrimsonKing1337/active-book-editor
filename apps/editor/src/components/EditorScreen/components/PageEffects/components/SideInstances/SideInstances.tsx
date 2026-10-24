import type { ComponentType } from 'react';

import { useMemo } from 'react';

import { Side } from 'activeBook-core/components/ProxyHooks';

import type { BookComponentProps } from '@active-book/types';

import { createBookRuntime } from '@active-book/book-builder/components/custom/runtime';

import { useCustomComponents } from '@project/customComponentRegistry';

import type { SideEffectDraft } from '../../@types';

import { usePageEffects } from '../../PageEffectsContext';

const bookRuntime = createBookRuntime('editor');

type SideInstanceProps = {
  effect: SideEffectDraft;
  components: Record<string, ComponentType>;
};

const SideInstance = ({ effect, components }: SideInstanceProps) => {
  const { component, shadows, texts } = effect.options;

  const componentId = component ? `${component.package}/${component.name}` : null;
  const CustomComponent = componentId ? components[componentId] as ComponentType<BookComponentProps> : undefined;

  const componentElement = useMemo(() => {
    if (!CustomComponent) {
      return null;
    }

    return <CustomComponent book={bookRuntime} />;
  }, [CustomComponent]);

  return (
    <Side
      id={effect.id}
      shadows={shadows}
      texts={texts}
      Component={componentElement}
    />
  );
};

export const SideInstances = () => {
  const { effects } = usePageEffects();
  const { components } = useCustomComponents();

  const sideEffects = effects.filter((effectCur): effectCur is SideEffectDraft => {
    return effectCur.type === 'side';
  });

  return (
    <>
      {sideEffects.map((effectCur) => {
        return (
          <SideInstance
            key={effectCur.id}
            effect={effectCur}
            components={components}
          />
        );
      })}
    </>
  );
};
