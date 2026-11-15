import type { ChangeEvent } from 'react';

import { customVisualDefinitionId } from '@active-book/book-builder/visualEffects';

import { useCustomComponents } from '@project/libraries';

import type { BackgroundOptions } from '@components/EditorScreen/components/PageEffects/@types';

import { Select } from '../../../EffectControls';

import styles from '../../BackgroundSettings.module.scss';

type ComponentReference = BackgroundOptions['component'];

export type CustomComponentProps = {
  component: ComponentReference;
  onChange: (component: ComponentReference) => void;
};

export const CustomComponent = ({ component, onChange }: CustomComponentProps) => {
  const { visualDefinitions } = useCustomComponents();

  const definitions = visualDefinitions.filter((definitionCur) => {
    return definitionCur.category === 'background';
  });

  let componentId = '';

  if (component) {
    const newId = `${component.package}/${component.name}`;

    componentId = customVisualDefinitionId('background', newId);
  }

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

      <Select value={componentId} onChange={handleComponentChange}>
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
      </Select>
    </details>
  );
};
