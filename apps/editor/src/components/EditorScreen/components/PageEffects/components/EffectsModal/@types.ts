import type { AudioOptions, BackgroundEffectKind, FrameEffectKind } from '@active-book/book-builder/effects';

import type { BookProject } from '@project/@types';

import type { EditorEffectDraft } from '../../@types';

export type EffectsModalProps = {
  effects: EditorEffectDraft[];
  project: BookProject | null;
  selectedEffect: EditorEffectDraft | null;

  onClose: () => void;
  onBack: () => void;
  onAddAudio: (type: AudioOptions['type']) => void;
  onAddVibration: () => void;
  onAddFlashlight: () => void;
  onAddBackground: (kind: BackgroundEffectKind) => void;
  onAddSide: (kind: FrameEffectKind) => void;
  onSelectEffect: (id: string) => void;
  onUpdateEffect: (previousId: string, effect: EditorEffectDraft) => void;
  onDuplicateEffect: () => void;
  onDeleteEffect: () => void;
  onBeforeCollapse: () => Promise<boolean>;
  isSavingStyles: boolean;
  styleSaveError: string;
};
