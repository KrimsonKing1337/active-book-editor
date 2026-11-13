import type { BookMediaAttributes } from '@active-book/types';

type MediaDimensionsProps = {
  attrs: BookMediaAttributes;
  onChange: (attributes: Record<string, unknown>) => void;
};

export const MediaDimensions = ({ attrs, onChange }: MediaDimensionsProps) => {
  const unit = attrs.width?.unit ?? '%';
  let maximum: number | undefined;

  if (unit === '%') {
    maximum = 100;
  }

  const changeWidth = (literal: string) => {
    if (!literal) {
      onChange({ width: null });

      return;
    }

    const value = Number(literal);

    if (Number.isFinite(value) && value > 0 && (unit !== '%' || value <= 100)) {
      onChange({ width: { value, unit } });
    }
  };

  const changeHeight = (literal: string) => {
    if (!literal) {
      onChange({ height: null });

      return;
    }

    const value = Number(literal);

    if (Number.isFinite(value) && value > 0) {
      onChange({ height: { value, unit: 'px' } });
    }
  };

  const changeUnit = (unit: string) => {
    if (unit !== 'px' && unit !== '%') {
      return;
    }

    let value = attrs.width?.value ?? 100;

    if (unit === '%') {
      value = Math.min(value, 100);
    }

    onChange({ width: { value, unit } });
  };

  return (
    <>
      <label>
        Ширина
        <input
          type="number"
          min={0.01}
          max={maximum}
          step="any"
          value={attrs.width?.value ?? ''}
          placeholder="100"
          onChange={(event) => changeWidth(event.target.value)}
        />
      </label>

      <label>
        Единица ширины
        <select value={unit} onChange={(event) => changeUnit(event.target.value)}>
          <option value="%">
            % области содержимого
          </option>

          <option value="px">
            Пиксели
          </option>
        </select>
      </label>

      <label>
        Высота (пиксели)
        <input
          type="number"
          min={0.01}
          step="any"
          value={attrs.height?.value ?? ''}
          placeholder="Автоматически"
          onChange={(event) => changeHeight(event.target.value)}
        />
      </label>
    </>
  );
};
