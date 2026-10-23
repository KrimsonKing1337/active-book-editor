import type { CSSProperties } from 'react';

export type PanelGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Position = {
  x: number;
  y: number;
};

export const PANEL_GEOMETRY_KEY = 'activeBook-editor:effectsPanelGeometry';

const getMinimumWidth = () => {
  const width = window.innerWidth - 32;

  return Math.min(320, Math.max(240, width));
};

const getDefaultGeometry = (): PanelGeometry => {
  const innerWidth = window.innerWidth - 32;

  const width = Math.min(500, Math.max(240, innerWidth));
  const availableHeight = window.innerHeight - 32;
  const height = Math.min(680, Math.max(240, availableHeight));

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

export const getSavedGeometry = (): PanelGeometry => {
  const fallback = getDefaultGeometry();

  try {
    const raw = localStorage.getItem(PANEL_GEOMETRY_KEY);

    if (!raw) {
      return fallback;
    }

    const value = JSON.parse(raw) as Partial<PanelGeometry>;

    const geometryValues = [
      value.x,
      value.y,
      value.width,
      value.height,
    ];

    const hasValidGeometry = geometryValues.every((valueCur) => {
      return typeof valueCur === 'number' && Number.isFinite(valueCur);
    });

    if (!hasValidGeometry) {
      return fallback;
    }

    const innerWidth = window.innerWidth - 32;

    const width = Math.min(Math.max(getMinimumWidth(), value.width!), innerWidth);
    const availableHeight = window.innerHeight - 32;
    const height = Math.min(Math.max(240, value.height!), Math.max(240, availableHeight));

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

export const getRndOptions = (geometry: PanelGeometry, isCollapsed: boolean) => {
  const panelDragCancelSelectors = [
    'button',
    'input',
    'textarea',
    'select',
    'summary',
    'label',
  ];

  const panelHeight = isCollapsed ? 60 : geometry.height;

  const panelSize = {
    width: geometry.width,
    height: panelHeight,
  };

  const panelPosition = {
    x: geometry.x,
    y: geometry.y,
  };

  const panelMinWidth = getMinimumWidth();
  const panelMinHeight = isCollapsed ? 60 : 240;
  const panelMaxWidth = Math.max(240, window.innerWidth - 32);
  const panelMaxHeight = Math.max(240, window.innerHeight - 32);

  const panelStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 1000,
  };

  return {
    cancel: panelDragCancelSelectors.join(','),
    size: panelSize,
    position: panelPosition,
    minWidth: panelMinWidth,
    minHeight: panelMinHeight,
    maxWidth: panelMaxWidth,
    maxHeight: panelMaxHeight,
    enableResizing: !isCollapsed,
    style: panelStyle,
  };
};
