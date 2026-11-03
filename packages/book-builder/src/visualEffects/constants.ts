import type {
  AnchorPoint,
  FrameSide,
  VisualPlane,
  VisualRegion,
} from '@active-book/types';

export const VISUAL_REGIONS = [
  'book',
  'bookViewport',
  'page',
  'frame',
  'narrativeViewport',
  'narrativeContent',
] as const satisfies readonly VisualRegion[];

export const VISUAL_ANCHORS = [
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
] as const satisfies readonly AnchorPoint[];

export const FRAME_SIDES = [
  'top',
  'right',
  'bottom',
  'left',
] as const satisfies readonly FrameSide[];

export const VISUAL_PLANES = [
  'background',
  'scene',
  'aboveNarrative',
  'aboveControls',
] as const satisfies readonly VisualPlane[];
