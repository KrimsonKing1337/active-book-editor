import type { ReactNode } from 'react';

import type { BackgroundEffectDraft } from '../../@types';

import type { EffectsModalProps } from './@types';

import {
  AudioSettings,
  VibrationSettings,
  FlashlightSettings,
  BackgroundSettings,
} from '../';

import { EffectTile } from './components';

import styles from './EffectsModal.module.scss';

type ContentParams = Pick<
  EffectsModalProps,
  | 'effects'
  | 'project'
  | 'selectedEffect'

  | 'onAddAudio'
  | 'onAddVibration'
  | 'onAddFlashlight'
  | 'onAddBackground'
  | 'onSelectEffect'
  | 'onUpdateEffect'
  | 'onDuplicateEffect'
  | 'onDeleteEffect'
> & {
  onLoadingChange: (loading: boolean, message?: string) => void;
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

  onAddAudio,
  onAddVibration,
  onAddFlashlight,
  onAddBackground,
  onSelectEffect,
  onUpdateEffect,
  onDuplicateEffect,
  onDeleteEffect,
  onLoadingChange,
}: ContentParams): ModalContent => {
  const existingIds = effects.map((cur) => cur.id);

  const isEffectsEmpty = effects.length === 0;

  const buttons = [
    {
      id: 'audio',
      label: 'Добавить Audio',
      onClick: onAddAudio,
    },
    {
      id: 'vibration',
      label: 'Добавить Vibration',
      onClick: onAddVibration,
    },
    {
      id: 'flashlight',
      label: 'Добавить Flashlight',
      onClick: onAddFlashlight,
    },
    {
      id: 'background',
      label: 'Добавить Background',
      onClick: onAddBackground,
    },
  ];

  let modalTitle = 'Эффекты страницы';
  let modalDescription = 'Эффекты, которые относятся к странице';
  let notice = 'Эффекты с автозапуском срабатывают при чтении собранной книги';

  let modalContent: ReactNode = (
    <>
      {isEffectsEmpty && (
        <div className={styles.Empty}>
          Пока нет эффектов
        </div>
      )}

      <div className={styles.Tiles}>
        {effects.map((effectCur) => {
          return (
            <EffectTile
              key={effectCur.id}
              effect={effectCur}
              onSelect={onSelectEffect}
            />
          );
        })}

        {buttons.map((buttonCur) => {
          const { id, label, onClick } = buttonCur;

          return (
            <button
              key={id}
              className={styles.AddTile}
              type="button"
              onClick={onClick}
            >
              <span className={styles.AddIcon} aria-hidden="true">
                +
              </span>

              {label}
            </button>
          );
        })}
      </div>
    </>
  );

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
    modalDescription = 'Вспышка доступна на поддерживаемых устройствах; sideShadow имитирует её на экране';
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

    modalTitle = 'Настройки Background';
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

  return {
    title: modalTitle,
    description: modalDescription,
    notice,
    content: modalContent,
  };
};
