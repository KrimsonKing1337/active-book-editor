import { type ReactNode, type CSSProperties, useState } from 'react';

import { createPortal } from 'react-dom';

import { Rnd } from 'react-rnd';

import type { BookProject } from '@project/@types';

import type { EditorEffectDraft, BackgroundEffectDraft } from '../../@types';

import {
  AudioSettings,
  VibrationSettings,
  FlashlightSettings,
  BackgroundSettings,
} from '../';

import { EffectTile } from './components';

import styles from './EffectsModal.module.scss';

type EffectsModalProps = {
  effects: EditorEffectDraft[];
  project: BookProject | null;
  selectedEffect: EditorEffectDraft | null;

  onClose: () => void;
  onBack: () => void;
  onAddAudio: () => void;
  onAddVibration: () => void;
  onAddFlashlight: () => void;
  onAddBackground: () => void;
  onSelectEffect: (id: string) => void;
  onUpdateEffect: (previousId: string, effect: EditorEffectDraft) => void;
  onDuplicateEffect: () => void;
  onDeleteEffect: () => void;
};

type PanelGeometry = {
  x: number;
  y: number;
  width: number;
  height: number,
};

type Position = {
  x: number;
  y: number;
};

const PANEL_GEOMETRY_KEY = 'activeBook-editor:effectsPanelGeometry';

const getMinimumWidth = () => {
  const width = window.innerWidth - 32;

  return Math.min(320, Math.max(240, width));
};

const getDefaultGeometry = (): PanelGeometry => {
  const innerWidth = window.innerWidth - 32;

  const width = Math.min(500, Math.max(240, innerWidth));
  const height = Math.min(680, Math.max(240, innerWidth));

  const pageBounds = document.querySelector('#main-content-wrapper')?.getBoundingClientRect();

  const preferredX = pageBounds ? pageBounds.right + 20 : window.innerWidth - width - 20;
  const x = Math.max(16, Math.min(window.innerWidth - width - 16, preferredX));

  return {
    x,
    y: 32,
    width,
    height,
  };
};

const getSavedGeometry = (): PanelGeometry => {
  const fallback = getDefaultGeometry();

  try {
    const raw = localStorage.getItem(PANEL_GEOMETRY_KEY);

    if (!raw) {
      return fallback;
    }

    const value = JSON.parse(raw) as Partial<PanelGeometry>;

    const geometryAsArray = [
      value.x,
      value.y,
      value.width,
      value.height,
    ];

    const valid = geometryAsArray.every((itemCur) => {
      return typeof itemCur === 'number' && Number.isFinite(itemCur);
    });

    if (!valid) {
      return fallback;
    }

    const innerWidth = window.innerWidth - 32;

    const width = Math.min(Math.max(getMinimumWidth(), value.width!), innerWidth);
    const height = Math.min(Math.max(240, value.height!), Math.max(240, innerWidth));

    const x = Math.max(16, Math.min(value.x!, window.innerWidth - width - 16));
    const y = Math.max(16, Math.min(value.y!, window.innerHeight - 60));

    return {
      x,
      y,
      width,
      height,
    };
  } catch {
    return fallback;
  }
};

export const EffectsModal = ({
  effects,
  project,
  selectedEffect,

  onClose,
  onBack,
  onAddAudio,
  onAddVibration,
  onAddFlashlight,
  onAddBackground,
  onSelectEffect,
  onUpdateEffect,
  onDuplicateEffect,
  onDeleteEffect,
}: EffectsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [geometry, setGeometry] = useState(getSavedGeometry);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const saveGeometry = (next: PanelGeometry) => {
    setGeometry(next);

    localStorage.setItem(PANEL_GEOMETRY_KEY, JSON.stringify(next));
  };

  const isSettingsOpen = Boolean(selectedEffect);
  const isEffectsEmpty = effects.length === 0;
  const existingIds = effects.map((cur) => cur.id);

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
        onLoadingChange={setIsLoading}
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
        onUpdate={onUpdateEffect}
        onDuplicate={onDuplicateEffect}
        onDelete={onDeleteEffect}
      />
    );
  }

  const handleDragStop = (_event: unknown, position: Position) => {
    saveGeometry({
      ...geometry,
      x: position.x,
      y: position.y,
    });
  };

  const handleResizeStop = (
    _event: unknown,
    _direction: unknown,
    element: HTMLElement,
    _delta: unknown,
    position: Position,
  ) => {
    saveGeometry({
      x: position.x,
      y: position.y,
      width: element.offsetWidth,
      height: element.offsetHeight,
    });
  };

  const dialogRndCancelOptions = [
    'button',
    'input',
    'textarea',
    'select',
    'summary',
    'label',
  ];

  const dialogRndHeight = isCollapsed ? 60 : geometry.height;

  const dialogRndSize = {
    width: geometry.width,
    height: dialogRndHeight,
  };

  const dialogRndPosition = {
    x: geometry.x,
    y: geometry.y,
  };

  const dialogRndMinWidth = getMinimumWidth();
  const dialogRndMinHeight = isCollapsed ? 60 : 240;

  const dialogRndStyle: CSSProperties = {
    position: 'fixed',
    zIndex: 1000,
  };

  const showBackButton = isSettingsOpen && !isCollapsed;
  const windowControlButtonAriaLabel = isCollapsed ? 'Развернуть окно' : 'Свернуть окно';
  const windowControlButtonLabel = isCollapsed ? '▢' : '−';
  const isAudioLoading = isLoading && !isCollapsed;

  return createPortal(
    <Rnd
      className={styles.Dialog}
      role="dialog"
      aria-label="Эффекты страницы"
      aria-modal={false}
      bounds="window"
      dragHandleClassName={styles.Header}
      cancel={dialogRndCancelOptions.join(',')}
      size={dialogRndSize}
      position={dialogRndPosition}
      minWidth={dialogRndMinWidth}
      minHeight={dialogRndMinHeight}
      enableResizing={!isCollapsed}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      style={dialogRndStyle}
    >
      <div className={styles.Header}>
        {showBackButton && (
          <button className={styles.Back} type="button" onClick={onBack}>
            ← Назад
          </button>
        )}

        <div className={styles.Title}>
          <h2>
            {modalTitle}
          </h2>

          {!isCollapsed && (
            <p>
              {modalDescription}
            </p>
          )}
        </div>

        <button
          className={styles.Close}
          type="button"
          aria-label={windowControlButtonAriaLabel}
          onClick={() => setIsCollapsed((cur) => !cur)}
        >
          {windowControlButtonLabel}
        </button>

        <button
          className={styles.Close}
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>

      {!isCollapsed && (
        <div className={styles.PanelBody}>
          <div className={styles.Content} inert={isLoading}>
            {modalContent}
          </div>

          <p className={styles.Notice} inert={isLoading}>
            {notice}
          </p>
        </div>
      )}

      {isAudioLoading && (
        <div className={styles.LoadingOverlay} role="status" aria-live="polite">
          <span className={styles.LoadingSpinner} aria-hidden="true" />

          Подготавливаем аудио...
        </div>
      )}
    </Rnd>,
    document.body,
  );
};
