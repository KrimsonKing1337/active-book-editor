type ProjectControlsProps = {
  disabled: boolean;
  isProjectBusy: boolean;

  onNewProject: () => Promise<void>;
  onOpenProject: () => Promise<void>;
  onSaveProject: () => Promise<void>;
};

export const ProjectControls = ({
  disabled,
  isProjectBusy,

  onNewProject,
  onOpenProject,
  onSaveProject,
}: ProjectControlsProps) => {
  let saveLabel = 'Сохранить';

  if (isProjectBusy) {
    saveLabel = 'Подождите...';
  }

  return (
    <>
      <button type="button" disabled={disabled} onClick={() => void onNewProject()}>
        Новый проект
      </button>

      <button type="button" disabled={disabled} onClick={() => void onOpenProject()}>
        Открыть проект
      </button>

      <button type="button" disabled={disabled} onClick={() => void onSaveProject()}>
        {saveLabel}
      </button>
    </>
  );
};
