export type ViewControlsProps = {
  showStructure: boolean;
  showNarrative: boolean;
  showBackgrounds: boolean;
  showFrameEffects: boolean;
  structureButtonIsDisabled: boolean;

  onToggleStructure: () => void;
  onToggleNarrative: () => void;
  onToggleBackgrounds: () => void;
  onToggleFrameEffects: () => void;
};

export const ViewControls = ({
  showStructure,
  showNarrative,
  showBackgrounds,
  showFrameEffects,
  structureButtonIsDisabled,

  onToggleStructure,
  onToggleNarrative,
  onToggleBackgrounds,
  onToggleFrameEffects,
}: ViewControlsProps) => {
  let structureLabel = 'Показать структуру';
  let narrativeLabel = 'Показать нарратив';
  let backgroundLabel = 'Показать фон';
  let frameEffectsLabel = 'Показать рамочные эффекты';

  if (showStructure) {
    structureLabel = 'Скрыть структуру';
  }

  if (showNarrative) {
    narrativeLabel = 'Скрыть нарратив';
  }

  if (showBackgrounds) {
    backgroundLabel = 'Скрыть фон';
  }

  if (showFrameEffects) {
    frameEffectsLabel = 'Скрыть рамочные эффекты';
  }

  return (
    <>
      <button
        type="button"
        disabled={structureButtonIsDisabled}
        aria-pressed={showStructure}
        onClick={onToggleStructure}
      >
        {structureLabel}
      </button>

      <button type="button" aria-pressed={showNarrative} onClick={onToggleNarrative}>
        {narrativeLabel}
      </button>

      <button type="button" aria-pressed={showBackgrounds} onClick={onToggleBackgrounds}>
        {backgroundLabel}
      </button>

      <button type="button" aria-pressed={showFrameEffects} onClick={onToggleFrameEffects}>
        {frameEffectsLabel}
      </button>
    </>
  );
};
