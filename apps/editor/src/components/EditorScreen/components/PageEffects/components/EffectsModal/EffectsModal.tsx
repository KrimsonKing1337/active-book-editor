import { useCallback, useState } from 'react';

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
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const handleLoadingChange = useCallback((loading: boolean, message?: string) => {
    setLoadingMessage(loading ? message ?? 'Загружаем файл...' : null);
  }, []);

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
    onLoadingChange: handleLoadingChange,
  });

  const handleToggleCollapsed = () => {
    void onBeforeCollapse().then((saved) => {
      if (saved) {
        toggleCollapsed();
      }
    });
  };

  const showBackButton = Boolean(selectedEffect) && !isCollapsed;
  const activeLoadingMessage = isSavingStyles
    ? 'Подождите, пока изменения сохраняются...'
    : !isCollapsed ? loadingMessage : null;

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
          isLoading={Boolean(activeLoadingMessage)}
        />
      )}

      {styleSaveError && (
        <p className={styles.SaveError} role="alert">
          {styleSaveError}
        </p>
      )}

      {activeLoadingMessage && (
        <div className={styles.LoadingOverlay} role="status" aria-live="polite">
          <span className={styles.LoadingSpinner} aria-hidden="true" />

          {activeLoadingMessage}
        </div>
      )}
    </Rnd>,
    document.body,
  );
};
