import type { ChangeEvent, CSSProperties } from 'react';

import { useState } from 'react';

import { isValidCssRule, normalizePropertyName } from '../../utils';

import { StyleRule } from '../StyleRule';

import styles from '../../StyleEditor.module.scss';

type AdvancedStylesProps = {
  style: CSSProperties;
  onPreview: (style: CSSProperties) => void;
  onCommit: () => void;
};

type StyleValue = string | number | undefined;

export const AdvancedStyles = ({ style, onPreview, onCommit }: AdvancedStylesProps) => {
  const [newProperty, setNewProperty] = useState('');
  const [newValue, setNewValue] = useState('');
  const [propertyError, setPropertyError] = useState('');

  const previewRuleValue = (name: string, value: string) => {
    const updatedStyle = {
      ...style,
      [name]: value,
    };

    onPreview(updatedStyle);
  };

  const updateRule = (name: string, nextName: string, nextValue: string): string | null => {
    if (name !== nextName && Object.hasOwn(style, nextName)) {
      return 'Такое CSS-свойство уже существует';
    }

    const updated: Record<string, StyleValue> = {
      ...style,
    };

    delete updated[name];

    updated[nextName] = nextValue;

    onPreview(updated as CSSProperties);
    onCommit();

    return null;
  };

  const deleteRule = (name: string) => {
    const updated: Record<string, StyleValue> = {
      ...style,
    };

    delete updated[name];

    onPreview(updated as CSSProperties);
    onCommit();
  };

  const addProperty = () => {
    const name = normalizePropertyName(newProperty);
    const value = newValue.trim();

    if (Object.hasOwn(style, name)) {
      setPropertyError('Такое CSS-свойство уже существует');

      return;
    }

    if (!isValidCssRule(name, value)) {
      setPropertyError('Некорректное CSS-свойство или значение');

      return;
    }

    const updatedStyle = {
      ...style,
      [name]: value,
    };

    onPreview(updatedStyle);
    onCommit();

    setNewProperty('');
    setNewValue('');
    setPropertyError('');
  };

  const handleNewPropertyChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewProperty(e.target.value);
  };

  const handleNewValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewValue(e.target.value);
  };

  const rules = Object.entries(style);

  return (
    <details className={styles.Advanced}>
      <summary>
        Дополнительные CSS-свойства
      </summary>

      {rules.map(([property, ruleValue]) => {
        return (
          <StyleRule
            key={property}
            name={property}
            value={ruleValue as string | number}

            onUpdate={updateRule}
            onPreview={previewRuleValue}
            onDelete={deleteRule}
          />
        );
      })}

      <div className={styles.Rule}>
        <input
          aria-label="Новое CSS-свойство"
          value={newProperty}
          placeholder="opacity"
          onChange={handleNewPropertyChange}
        />

        <input
          aria-label="Значение нового свойства"
          value={newValue}
          placeholder="0.8"
          onChange={handleNewValueChange}
        />

        <button type="button" onClick={addProperty}>
          +
        </button>
      </div>

      {propertyError && (
        <span className={styles.Error} role="alert">
          {propertyError}
        </span>
      )}
    </details>
  );
};
