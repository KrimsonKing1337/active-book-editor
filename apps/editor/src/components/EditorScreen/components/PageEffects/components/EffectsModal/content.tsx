import type { ReactNode } from 'react';

import type { BackgroundEffectDraft } from '../../@types';

import type { EffectsModalProps } from './@types';

import {
  AudioSettings,
  VibrationSettings,
  FlashlightSettings,
  BackgroundSettings,
  FrameSettings,
} from '../';

type ContentParamsEffectsModalPicked = Pick<
  EffectsModalProps,
  | 'effects'
  | 'project'
  | 'selectedEffect'
  | 'onUpdateEffect'
  | 'onDuplicateEffect'
  | 'onDeleteEffect'
>;

type ContentParams = ContentParamsEffectsModalPicked & {
  onLoadingChange: (loading: boolean, message?: string) => void;
  browserContent: ReactNode;
};

type ModalContent = {
  title: string;
  description: string;
  notice: string;
  content: ReactNode;
};

export const getModalContent = ({
  effects,
  project,
  selectedEffect,

  onUpdateEffect,
  onDuplicateEffect,
  onDeleteEffect,
  onLoadingChange,
  browserContent,
}: ContentParams): ModalContent => {
  const existingIds = effects.map((cur) => cur.id);

  let modalTitle = 'Эффекты страницы';
  let modalDescription = 'Эффекты текущей страницы';
  let notice = 'Эффекты с автозапуском срабатывают при чтении собранной книги';
  let modalContent: ReactNode = browserContent;

  if (selectedEffect?.type === 'audio') {
    modalTitle = 'Настройки Audio';
    modalDescription = 'Параметры сохраняются в book.json и применяются в собранной книге';
    notice = 'Звук с playOnLoad запускается только при чтении; в редакторе нажмите «Прослушать»';

    modalContent = (
      <AudioSettings
        key={selectedEffect.id}
        effect={selectedEffect}
        project={project}
        existingIds={existingIds}
        onLoadingChange={onLoadingChange}
        onUpdate={onUpdateEffect}
        onDuplicate={onDuplicateEffect}
        onDelete={onDeleteEffect}
      />
    );
  } else if (selectedEffect?.type === 'vibration') {
    modalTitle = 'Настройки Vibration';
    modalDescription = 'Вибрация запускается при открытии страницы на поддерживаемом устройстве';
    notice = 'Для тестирования вибрации в редакторе нажмите «Проверить»';

    modalContent = (
      <VibrationSettings
        key={selectedEffect.id}
        effect={selectedEffect}
        existingIds={existingIds}
        onUpdate={onUpdateEffect}
        onDuplicate={onDuplicateEffect}
        onDelete={onDeleteEffect}
      />
    );
  } else if (selectedEffect?.type === 'flashlight') {
    modalTitle = 'Настройки Flashlight';
    modalDescription = 'Вспышка доступна на поддерживаемых устройствах; frameShadow имитирует её на экране';
    notice = 'Для тестирования вспышки в редакторе нажмите «Проверить»';

    modalContent = (
      <FlashlightSettings
        key={selectedEffect.id}
        effect={selectedEffect}
        existingIds={existingIds}
        onUpdate={onUpdateEffect}
        onDuplicate={onDuplicateEffect}
        onDelete={onDeleteEffect}
      />
    );
  }

  if (selectedEffect?.type === 'background') {
    const backgrounds = effects.filter((effectCur): effectCur is BackgroundEffectDraft => {
      return effectCur.type === 'background';
    });

    const kindLabel = {
      background: 'фона',
      image: 'изображения',
      video: 'видео',
      shadow: 'затемнения',
      component: 'фонового компонента',
    }[selectedEffect.kind ?? 'background'];

    modalTitle = `Настройки ${kindLabel}`;
    modalDescription = 'Фон отображается прямо на странице книги';
    notice = 'В редакторе можно независимо скрывать фон и нарратив';

    modalContent = (
      <BackgroundSettings
        key={selectedEffect.id}
        effect={selectedEffect}
        effects={backgrounds}
        project={project}
        onLoadingChange={onLoadingChange}
        onUpdate={onUpdateEffect}
        onDuplicate={onDuplicateEffect}
        onDelete={onDeleteEffect}
      />
    );
  }

  if (selectedEffect?.type === 'frame') {
    const kindLabel = {
      shadow: 'боковой тени',
      text: 'бокового текста',
      component: 'бокового компонента',
    }[selectedEffect.kind ?? 'shadow'];

    modalTitle = `Настройки ${kindLabel}`;
    modalDescription = 'Рамочные тени, текст и кастомные компоненты';
    notice = 'Расположение и анимации обновляются сразу на странице';

    modalContent = (
      <FrameSettings
        key={selectedEffect.id}
        effect={selectedEffect}
        onUpdate={onUpdateEffect}
        onDuplicate={onDuplicateEffect}
        onDelete={onDeleteEffect}
      />
    );
  }

  return {
    title: modalTitle,
    description: modalDescription,
    notice,
    content: modalContent,
  };
};
