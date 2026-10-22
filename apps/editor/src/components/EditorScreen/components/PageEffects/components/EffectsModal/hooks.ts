import { useState } from 'react';

import { getSavedGeometry, getRndOptions, PANEL_GEOMETRY_KEY } from './utils';

import type { PanelGeometry, Position } from './utils';

export const usePanelGeometry = () => {
  const [geometry, setGeometry] = useState(getSavedGeometry);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const saveGeometry = (next: PanelGeometry) => {
    setGeometry(next);

    localStorage.setItem(PANEL_GEOMETRY_KEY, JSON.stringify(next));
  };

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

  const toggleCollapsed = () => {
    setIsCollapsed((current) => !current);
  };

  const rndOptions = getRndOptions(geometry, isCollapsed);

  return {
    isCollapsed,
    rndOptions,
    toggleCollapsed,
    handleDragStop,
    handleResizeStop,
  };
};
