import type { ComponentType } from 'react';

import { useMemo } from 'react';


import type { BookComponentProps } from '@active-book/types';

import { Side } from 'activeBook-core/components/ProxyHooks';

import { createBookRuntime } from '@active-book/book-builder/components/custom/runtime';

import { useCustomComponents } from '@project/customComponentRegistry';

import type { SideEffectDraft } from '../../@types';
import type { SideItemPreviews, SideStylePreviews } from '../../context';





import { usePageEffects } from '../../context';

import { resolveSideInstanceOptions } from './utils';

const bookRuntime = createBookRuntime('editor');

type SideInstanceProps = {
  effect: SideEffectDraft;
  components: Record<string, ComponentType>;
  previews: SideItemPreviews;
  stylePreviews: SideStylePreviews;
};

const SideInstance = ({
  effect,
  components,
  previews,
  stylePreviews,
}: SideInstanceProps) => {
  const { component } = effect.options;

  const componentId = component ? `${component.package}/${component.name}` : '';
  const CustomComponent = components[componentId] as ComponentType<BookComponentProps> | undefined;

  const componentElement = useMemo(() => {
    return CustomComponent ? <CustomComponent book={bookRuntime} /> : null;
  }, [CustomComponent]);

  const options = resolveSideInstanceOptions({
    effect,
    previews,
    stylePreviews,
  });

  return (
    <Side
      id={effect.id}
      kind={effect.kind}
      shadow={options.shadow}
      text={options.text}
      frameMask={options.frameMask}
      style={options.style}
      Component={componentElement}
    />
  );
};

export const SideInstances = () => {
  const { effects, sideItemPreviews, sideStylePreviews } = usePageEffects();
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
            previews={sideItemPreviews}
            stylePreviews={sideStylePreviews}
          />
        );
      })}
    </>
  );
};
