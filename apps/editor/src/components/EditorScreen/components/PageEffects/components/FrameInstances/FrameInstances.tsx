import type { ComponentType } from 'react';

import { useMemo } from 'react';

import type { BookComponentProps } from '@active-book/types';

import { Frame } from 'activeBook-core/components/ProxyHooks';

import { createBookRuntime } from '@active-book/book-builder/components/custom/runtime';

import { useCustomComponents } from '@project/customComponentRegistry';

import type { FrameEffectDraft } from '../../@types';
import type { FrameItemPreviews, FrameStylePreviews } from '../../context';

import { usePageEffects } from '../../context';

import { resolveFrameInstanceOptions } from './utils';

const bookRuntime = createBookRuntime('editor');

type FrameInstanceProps = {
  effect: FrameEffectDraft;
  components: Record<string, ComponentType>;
  previews: FrameItemPreviews;
  stylePreviews: FrameStylePreviews;
};

const FrameInstance = ({
  effect,
  components,
  previews,
  stylePreviews,
}: FrameInstanceProps) => {
  const { component } = effect.options;

  const componentId = component ? `${component.package}/${component.name}` : '';
  const CustomComponent = components[componentId] as ComponentType<BookComponentProps> | undefined;

  const componentElement = useMemo(() => {
    return CustomComponent ? <CustomComponent book={bookRuntime} /> : null;
  }, [CustomComponent]);

  const options = resolveFrameInstanceOptions({
    effect,
    previews,
    stylePreviews,
  });

  return (
    <Frame
      id={effect.id}
      kind={effect.kind}
      layer={options.layer}
      shadow={options.shadow}
      text={options.text}
      frameMask={options.frameMask}
      style={options.style}
      Component={componentElement}
    />
  );
};

export const FrameInstances = () => {
  const { effects, frameItemPreviews, frameStylePreviews } = usePageEffects();
  const { components } = useCustomComponents();

  const frameEffects = effects.filter((effectCur): effectCur is FrameEffectDraft => {
    return effectCur.type === 'frame';
  });

  return (
    <>
      {frameEffects.map((effectCur) => {
        return (
          <FrameInstance
            key={effectCur.id}
            effect={effectCur}
            components={components}
            previews={frameItemPreviews}
            stylePreviews={frameStylePreviews}
          />
        );
      })}
    </>
  );
};
