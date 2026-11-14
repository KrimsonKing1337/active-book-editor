import type { BrowserComponentDefinition } from '@active-book/book-builder/components/custom/browser';

export type LibraryControlsProps = {
  definitions: BrowserComponentDefinition[];
  disabled: boolean;

  onImport: () => void;
  onInsertComponent: (packageName: string, name: string) => void;
};

export const LibraryControls = ({
  definitions,
  disabled,
  onImport,
  onInsertComponent,
}: LibraryControlsProps) => {
  return (
    <>
      <button type="button" disabled={disabled} onClick={() => void onImport()}>
        Импортировать .tgz
      </button>

      {definitions.map((componentCur) => {
        const {
          id,
          description,
          packageName,
          name,
          title,
        } = componentCur;

        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            title={description}
            onClick={() => onInsertComponent(packageName, name)}
          >
            Добавить {title}
          </button>
        );
      })}
    </>
  );
};
