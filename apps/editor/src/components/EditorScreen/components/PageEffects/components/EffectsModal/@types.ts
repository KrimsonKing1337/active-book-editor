import type { BookProject } from '@project/@types';

import type { EditorEffectDraft } from '../../@types';

export type EffectsModalProps = {
  effects: EditorEffectDraft[];
  project: BookProject | null;
  selectedEffect: EditorEffectDraft | null;

  onClose: () => void;
  onBack: () => void;
  onAddAudio: () => void;
  onAddVibration: () => void;
  onAddFlashlight: () => void;
  onAddBackground: () => void;
  onAddSide: () => void;
  onSelectEffect: (id: string) => void;
  onUpdateEffect: (previousId: string, effect: EditorEffectDraft) => void;
  onDuplicateEffect: () => void;
  onDeleteEffect: () => void;
  onBeforeCollapse: () => Promise<boolean>;
  isSavingStyles: boolean;
  styleSaveError: string;
};
