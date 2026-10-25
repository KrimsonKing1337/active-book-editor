import type { ChangeEvent, RefObject } from 'react';

import { Button } from './Button';
import { TextInput } from './TextInput';

import styles from './EffectControls.module.scss';

type FileChooserProps = {
  value: string;
  onChange: (value: string) => void;
  onChoose: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  accept?: string;
  placeholder?: string;
  disabled?: boolean;
  buttonLabel?: string;
};

export const FileChooser = ({
  value,
  onChange,
  onChoose,
  onFileChange,
  fileInputRef,
  accept,
  placeholder,
  disabled = false,
  buttonLabel = 'Выбрать файл',
}: FileChooserProps) => {
  const handlePathChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={styles.FileChooser}>
      <TextInput
        className={styles.FilePath}
        value={value}
        maxLength={1024}
        placeholder={placeholder}
        spellCheck={false}
        onChange={handlePathChange}
      />

      <Button className={styles.ChooseButton} disabled={disabled} onClick={onChoose}>
        {buttonLabel}
      </Button>

      <input ref={fileInputRef} type="file" accept={accept} onChange={onFileChange} hidden />
    </div>
  );
};
