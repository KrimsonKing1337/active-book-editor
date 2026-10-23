import type { ChangeEvent } from 'react';

import type { BackgroundOptions } from '@components/EditorScreen/components/PageEffects/@types';

import { useCustomComponents } from '@project/customComponentRegistry';

import styles from '../../BackgroundSettings.module.scss';

type ComponentReference = BackgroundOptions['component'];

type CustomComponentProps = {
  component: ComponentReference;
  onChange: (component: ComponentReference) => void;
};

export const CustomComponent = ({ component, onChange }: CustomComponentProps) => {
  const { definitions } = useCustomComponents();

  const componentId = component ? `${component.package}/${component.name}` : '';

  const updateComponent = (id: string) => {
    if (!id) {
      onChange(undefined);

      return;
    }

    const definition = definitions.find((cur) => cur.id === id);

    if (definition) {
      onChange({
        package: definition.packageName,
        name: definition.name,
      });
    }
  };

  const handleComponentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    updateComponent(e.target.value);
  };

  return (
    <details className={styles.Section}>
      <summary>
        Кастомный компонент
      </summary>

      <select value={componentId} onChange={handleComponentChange}>
        <option value="">
          Не использовать
        </option>

        {definitions.map((definitionCur) => {
          return (
            <option key={definitionCur.id} value={definitionCur.id}>
              {definitionCur.title}
            </option>
          );
        })}
      </select>
    </details>
  );
};
