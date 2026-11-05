import { useEffect, useState } from 'react';

import { TextInput } from '../../../EffectControls';

type PlacementNumberProps = {
  label: string;
  value: number;
  min?: number;
  integer?: boolean;
  onChange: (value: number) => void;
};

export const PlacementNumber = ({
  label,
  value,
  min,
  integer,
  onChange,
}: PlacementNumberProps) => {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <label>
      <span>
        {label}
      </span>

      <TextInput
        type="number"
        aria-label={label}
        value={text}
        min={min}
        step={integer ? 1 : 'any'}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          const number = Number(next);
          const valid = next !== '' && Number.isFinite(number)
            && (min === undefined || number >= min) && (!integer || Number.isInteger(number));
          if (valid) {
            onChange(number);
          }
        }}
        onBlur={() => setText(String(value))}
      />
    </label>
  );
};
