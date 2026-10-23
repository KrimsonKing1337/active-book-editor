import { useEffect, useState, type KeyboardEvent } from 'react';

import { isValidCssRule, normalizePropertyName } from '../../utils';

import styles from '../../StyleEditor.module.scss';

export type StyleRuleProps = {
  name: string;
  value: string | number;
  onUpdate: (name: string, nextName: string, nextValue: string) => string | null;
  onPreview: (name: string, nextValue: string) => void;
  onDelete: (name: string) => void;
};

export const StyleRule = ({ name, value, onUpdate, onPreview, onDelete }: StyleRuleProps) => {
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

    if (!nextValue || !isValidCssRule(nextName, nextValue)) {
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

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  };

  return (
    <div className={styles.RuleContainer}>
      <div className={styles.Rule}>
        <input
          aria-label="Имя свойства"
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value)}
          onBlur={applyRule}
          onKeyDown={handleKeyDown}
        />

        <input
          aria-label="Значение свойства"
          value={valueDraft}
          onChange={(event) => handleValueChange(event.target.value)}
          onBlur={applyRule}
          onKeyDown={handleKeyDown}
        />

        <button type="button" aria-label="Удалить свойство" onClick={() => onDelete(name)}>
          ×
        </button>
      </div>

      {error && <span className={styles.Error} role="alert">{error}</span>}
    </div>
  );
};


