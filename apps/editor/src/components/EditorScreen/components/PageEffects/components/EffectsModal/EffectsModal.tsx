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
  onBeforeCollapse,
  isSavingStyles,
  styleSaveError,
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

  const handleToggleCollapsed = () => {
    void onBeforeCollapse().then((saved) => {
      if (saved) {
        toggleCollapsed();
      }
    });
  };

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
        onToggleCollapsed={handleToggleCollapsed}
        onClose={onClose}
      />

      {!isCollapsed && (
        <PanelBody
          content={content}
          notice={notice}
          isLoading={isLoading}
        />
      )}

      {styleSaveError && (
        <p className={styles.SaveError} role="alert">
          {styleSaveError}
        </p>
      )}

      {isSavingStyles && (
        <div className={styles.LoadingOverlay} role="status" aria-live="polite">
          <span className={styles.LoadingSpinner} aria-hidden="true" />

          Подождите, пока изменения сохраняются...
        </div>
      )}

      {isAudioLoading && !isSavingStyles && (
        <div className={styles.LoadingOverlay} role="status" aria-live="polite">
          <span className={styles.LoadingSpinner} aria-hidden="true" />

          Подготавливаем аудио...
        </div>
      )}
    </Rnd>,
    document.body,
  );
};
