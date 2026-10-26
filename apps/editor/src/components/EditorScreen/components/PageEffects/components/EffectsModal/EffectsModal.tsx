import type { EffectsModalProps } from './@types';
import type { EffectCategory, GroupingMode } from './catalog';

import { useCallback, useState } from 'react';

import { createPortal } from 'react-dom';

import { Rnd } from 'react-rnd';

import { getCategoryDefinition } from './catalog';

import { getModalContent } from './content';
import { usePanelGeometry } from './hooks';

import { Header, PanelBody } from './components';
import { EffectsBrowser } from './components/EffectsBrowser';

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
  onAddSide,
  onSelectEffect,
  onUpdateEffect,
  onDuplicateEffect,
  onDeleteEffect,
  onBeforeCollapse,
  isSavingStyles,
  styleSaveError,
}: EffectsModalProps) => {
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [category, setCategory] = useState<EffectCategory | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [grouping, setGrouping] = useState<GroupingMode>(() => {
    return localStorage.getItem('activeBook-editor:effectsGrouping') === 'type' ? 'type' : 'none';
  });

  const handleCategoryChange = (nextCategory: EffectCategory) => {
    setCategory(nextCategory);
    setGroup(null);
    setSearch('');
  };

  const handleGroupChange = (nextGroup: string) => {
    setGroup(nextGroup);
    setSearch('');
  };

  const handleGroupingChange = (nextGrouping: GroupingMode) => {
    setGrouping(nextGrouping);
    setGroup(null);
    setSearch('');

    localStorage.setItem('activeBook-editor:effectsGrouping', nextGrouping);
  };

  const handleBack = () => {
    if (selectedEffect) {
      onBack();

      return;
    }

    if (group) {
      setGroup(null);
    } else {
      setCategory(null);
    }

    setSearch('');
  };

  const handleLoadingChange = useCallback((loading: boolean, message?: string) => {
    const loadingMessage = message ?? 'Загружаем файл...';

    setLoadingMessage(loading ? loadingMessage : null);
  }, []);

  const {
    isCollapsed,
    rndOptions,
    toggleCollapsed,
    handleDragStop,
    handleResizeStop,
  } = usePanelGeometry();

  const browserContent = (
    <EffectsBrowser
      effects={effects}
      category={category}
      group={group}
      grouping={grouping}
      search={search}
      onAddAudio={onAddAudio}
      onAddVibration={onAddVibration}
      onAddFlashlight={onAddFlashlight}
      onAddBackground={onAddBackground}
      onAddSide={onAddSide}
      onSelectEffect={onSelectEffect}
      onCategoryChange={handleCategoryChange}
      onGroupChange={handleGroupChange}
      onGroupingChange={handleGroupingChange}
      onSearchChange={setSearch}
    />
  );

  const {
    title: settingsTitle,
    description: settingsDescription,
    notice,
    content,
  } = getModalContent({
    effects,
    project,
    selectedEffect,

    onUpdateEffect,
    onDuplicateEffect,
    onDeleteEffect,
    onLoadingChange: handleLoadingChange,
    browserContent,
  });

  const categoryDefinition = category ? getCategoryDefinition(category) : null;
  const groupDefinition = categoryDefinition?.groups.find((current) => current.value === group);
  const browserTitle = groupDefinition?.label ?? categoryDefinition?.label ?? 'Эффекты страницы';

  const browserDescription = groupDefinition
    ? `Эффекты типа ${groupDefinition.label} в категории ${categoryDefinition?.label}`
    : categoryDefinition?.description ?? 'Эффекты текущей страницы';

  const title = selectedEffect ? settingsTitle : browserTitle;
  const description = selectedEffect ? settingsDescription : browserDescription;

  const handleToggleCollapsed = () => {
    void onBeforeCollapse().then((saved) => {
      if (saved) {
        toggleCollapsed();
      }
    });
  };

  const showBackButton = Boolean(selectedEffect || category) && !isCollapsed;
  let activeLoadingMessage: string | null = null;

  if (isSavingStyles) {
    activeLoadingMessage = 'Подождите, пока изменения сохраняются...';
  } else if (!isCollapsed) {
    activeLoadingMessage = loadingMessage;
  }

  return createPortal(
    <Rnd
      className={styles.Dialog}
      role="dialog"
      aria-label="Эффекты страницы"
      aria-modal={false}
      data-active-book-effects-ui
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

        onBack={handleBack}
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
