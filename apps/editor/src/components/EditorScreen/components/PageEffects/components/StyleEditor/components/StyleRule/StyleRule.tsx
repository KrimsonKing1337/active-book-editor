import type { ChangeEvent, KeyboardEvent } from 'react';

import { useEffect, useState } from 'react';

import { isValidCssRule, normalizePropertyName } from '../../utils';

import styles from '../../StyleEditor.module.scss';

export type StyleRuleProps = {
  name: string;
  value: string | number;

  onUpdate: (name: string, nextName: string, nextValue: string) => string | null;
  onPreview: (name: string, nextValue: string) => void;
  onDelete: (name: string) => void;
};

export const StyleRule = ({
  name,
  value,
  onUpdate,
  onPreview,
  onDelete,
}: StyleRuleProps) => {
  const [nameDraft, setNameDraft] = useState(name);
  const [valueDraft, setValueDraft] = useState(String(value));
  const [error, setError] = useState('');

  useEffect(() => {
    setNameDraft(name);
    setValueDraft(String(value));
  }, [name, value]);

  const applyRule = () => {
    const nextName = normalizePropertyName(nameDraft);
    const nextValue = valueDraft.trim();

    const cssRuleIsValid = isValidCssRule(nextName, nextValue);

    if (!nextValue || !cssRuleIsValid) {
      setError('Некорректное CSS-свойство или значение');

      return;
    }

    const updateError = onUpdate(name, nextName, nextValue);

    setError(updateError ?? '');
  };

  const handleValueChange = (nextValue: string) => {
    setValueDraft(nextValue);

    if (isValidCssRule(name, nextValue.trim())) {
      onPreview(name, nextValue.trim());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNameDraft(e.target.value);
  };

  const handleValueInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleValueChange(e.target.value);
  };

  const handleDelete = () => {
    onDelete(name);
  };

  return (
    <div className={styles.RuleContainer}>
      <div className={styles.Rule}>
        <input
          aria-label="Имя свойства"
          value={nameDraft}

          onChange={handleNameChange}
          onBlur={applyRule}
          onKeyDown={handleKeyDown}
        />

        <input
          aria-label="Значение свойства"
          value={valueDraft}

          onChange={handleValueInputChange}
          onBlur={applyRule}
          onKeyDown={handleKeyDown}
        />

        <button type="button" aria-label="Удалить свойство" onClick={handleDelete}>
          ×
        </button>
      </div>

      {error && (
        <span className={styles.Error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};


