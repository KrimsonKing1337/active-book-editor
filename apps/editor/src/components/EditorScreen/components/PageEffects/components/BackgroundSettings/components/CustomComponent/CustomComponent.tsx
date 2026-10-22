import { useCustomComponents } from '@project/customComponentRegistry';

import type { BackgroundOptions } from '@components/EditorScreen/components/PageEffects/@types';

import styles from '../../BackgroundSettings.module.scss';

type ComponentReference = BackgroundOptions['component'];

type CustomComponentProps = {
  component: ComponentReference;
  onChange: (component: ComponentReference) => void;
};

export const CustomComponent = ({ component, onChange }: CustomComponentProps) => {
  const { definitions } = useCustomComponents();

  let componentId = '';

  if (component) {
    componentId = component.package + '/' + component.name;
  }

  const updateComponent = (id: string) => {
    if (!id) {
      onChange(undefined);

      return;
    }

    const definition = definitions.find((item) => item.id === id);

    if (definition) {
      onChange({
        package: definition.packageName,
        name: definition.name,
      });
    }
  };

  return (
    <details className={styles.Section}>
      <summary>Кастомный компонент</summary>

      <select value={componentId} onChange={(event) => updateComponent(event.target.value)}>
        <option value="">Не использовать</option>

        {definitions.map((definition) => {
          return (
            <option key={definition.id} value={definition.id}>{definition.title}</option>
          );
        })}
      </select>
    </details>
  );
};
