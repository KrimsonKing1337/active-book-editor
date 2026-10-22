import { useState } from 'react';

import { createPortal } from 'react-dom';

import { Rnd } from 'react-rnd';

import type { EffectsModalProps } from './@types';

import { getModalContent } from './content';
import { usePanelGeometry } from './hooks';

import { Header, PanelBody } from './components';

import styles from './EffectsModal.module.scss';

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

  const {
    isCollapsed,
    rndOptions,
    toggleCollapsed,
    handleDragStop,
    handleResizeStop,
  } = usePanelGeometry();

  const {
    title,
    description,
    notice,
    content,
  } = getModalContent({
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
    onLoadingChange: setIsLoading,
  });

  const showBackButton = Boolean(selectedEffect) && !isCollapsed;
  const isAudioLoading = isLoading && !isCollapsed;

  return createPortal(
    <Rnd
      className={styles.Dialog}
      role="dialog"
      aria-label="Эффекты страницы"
      aria-modal={false}
      bounds="window"
      dragHandleClassName={styles.Header}
      {...rndOptions}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
    >
      <Header
        title={title}
        description={description}
        isCollapsed={isCollapsed}
        showBackButton={showBackButton}
        onBack={onBack}
        onToggleCollapsed={toggleCollapsed}
        onClose={onClose}
      />

      {!isCollapsed && (
        <PanelBody
          content={content}
          notice={notice}
          isLoading={isLoading}
        />
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
