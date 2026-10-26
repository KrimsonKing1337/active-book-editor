import type { ChangeEvent, RefObject } from 'react';

import { Button } from '../Button';
import { TextInput } from '../TextInput';

import styles from './FileChooser.module.scss';

type FileChooserProps = {
  value: string;
  inputId?: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  accept?: string;
  placeholder?: string;
  disabled?: boolean;
  buttonLabel?: string;

  onChange: (val: string) => void;
  onChoose: () => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export const FileChooser = ({
  value,
  inputId,
  fileInputRef,
  accept,
  placeholder,
  disabled = false,
  buttonLabel = 'Выбрать файл',

  onChange,
  onChoose,
  onFileChange,
}: FileChooserProps) => {
  const handlePathChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={styles.FileChooser}>
      <TextInput
        id={inputId}
        className={styles.FilePath}
        value={value}
        maxLength={1024}
        placeholder={placeholder}
        spellCheck={false}
        onChange={handlePathChange}
      />

      <Button
        className={styles.ChooseButton}
        disabled={disabled}
        onClick={onChoose}
      >
        {buttonLabel}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        hidden
        onChange={onFileChange}
      />
    </div>
  );
};
