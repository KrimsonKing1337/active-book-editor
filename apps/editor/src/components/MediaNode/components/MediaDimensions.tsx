import type { BookMediaAttributes } from '@active-book/types';

type MediaDimensionsProps = {
  attrs: BookMediaAttributes;
  onChange: (attributes: Record<string, unknown>) => void;
};

export const MediaDimensions = ({ attrs, onChange }: MediaDimensionsProps) => {
  const getMaximum = (unit: string): number | undefined => {
    if (unit === '%') {
      return 100;
    }

    return undefined;
  };

  const isValidDimension = (value: number, maximum?: number): boolean => {
    if (!Number.isFinite(value) || value <= 0) {
      return false;
    }

    return !(maximum !== undefined && value > maximum);
  };

  const unit = attrs.width?.unit ?? '%';
  const maximum = getMaximum(unit);

  const changeWidth = (literal: string) => {
    if (!literal) {
      onChange({ width: null });

      return;
    }

    const value = Number(literal);

    if (!isValidDimension(value, maximum)) {
      return;
    }

    onChange({ width: { value, unit } });
  };

  const changeHeight = (literal: string) => {
    if (!literal) {
      onChange({ height: null });

      return;
    }

    const value = Number(literal);

    if (!isValidDimension(value)) {
      return;
    }

    onChange({ height: { value, unit: 'px' } });
  };

  const changeUnit = (nextUnit: string) => {
    if (nextUnit !== 'px' && nextUnit !== '%') {
      return;
    }

    let value = attrs.width?.value ?? 100;

    const nextMaximum = getMaximum(nextUnit);

    if (nextMaximum !== undefined) {
      value = Math.min(value, nextMaximum);
    }

    onChange({ width: { value, unit: nextUnit } });
  };

  const widthValue = attrs.width?.value ?? '';
  const heightValue = attrs.height?.value ?? '';

  return (
    <>
      <label>
        <span>
          Ширина
        </span>

        <input
          type="number"
          min={0.01}
          max={maximum}
          step="any"
          value={widthValue}
          placeholder="100"
          onChange={(e) => changeWidth(e.target.value)}
        />
      </label>

      <label>
        <span>
          Единица ширины
        </span>

        <select value={unit} onChange={(e) => changeUnit(e.target.value)}>
          <option value="%">
            % области содержимого
          </option>

          <option value="px">
            Пиксели
          </option>
        </select>
      </label>

      <label>
        <span>
          Высота (пиксели)
        </span>

        <input
          type="number"
          min={0.01}
          step="any"
          value={heightValue}
          placeholder="Автоматически"
          onChange={(e) => changeHeight(e.target.value)}
        />
      </label>
    </>
  );
};
