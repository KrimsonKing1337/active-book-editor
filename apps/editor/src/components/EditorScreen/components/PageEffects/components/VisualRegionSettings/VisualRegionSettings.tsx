import type { VisualDepth, VisualPlacement } from '@active-book/types';

import { Select, Button } from '../EffectControls';

import { PlacementNumber } from './components/PlacementNumber';

import styles from './VisualRegionSettings.module.scss';

const regions = {
  application: 'Всё приложение',
  story: 'Произведение',
  storyViewport: 'Поверхность произведения',
  narrativeFrame: 'Нарратив с рамкой',
  frame: 'Только стороны рамки',
  narrativeViewport: 'Видимая область текста',
  narrativeContent: 'Прокручиваемое содержимое',
} as const;
const anchors = {
  'top-left': 'Слева сверху',
  top: 'Сверху',
  'top-right': 'Справа сверху',
  left: 'Слева',
  center: 'В центре',
  right: 'Справа',
  'bottom-left': 'Слева снизу',
  bottom: 'Снизу',
  'bottom-right': 'Справа снизу',
} as const;
const planes = {
  background: 'Фон',
  belowNarrative: 'Под текстом',
  aboveNarrative: 'Поверх текста',
  aboveStoryControls: 'Поверх кнопок произведения',
} as const;

type VisualRegionSettingsProps = {
  placement?: VisualPlacement;
  depth?: VisualDepth;
  defaultPlane: VisualDepth['plane'];
  onChange: (placement: VisualPlacement, depth: VisualDepth) => void;
};

export const VisualRegionSettings = ({
  placement = { region: 'storyViewport' },
  depth,
  defaultPlane,
  onChange,
}: VisualRegionSettingsProps) => {
  const currentDepth = depth ?? { plane: defaultPlane };
  const updatePlacement = (patch: Partial<VisualPlacement>) => onChange({
    ...placement,
    ...patch,
  }, currentDepth);
  const offset = placement.offset ?? {
    x: {
      value: 0,
      unit: 'px',
    },
    y: {
      value: 0,
      unit: 'px',
    },
  };
  const size = placement.size ?? {
    width: {
      value: 100,
      unit: '%',
    },
    height: {
      value: 100,
      unit: '%',
    },
  };

  return (
    <fieldset className={styles.Settings}>
      <legend>
        Размещение эффекта
      </legend>

      <label className={styles.Field}>
        <span>
          Область размещения эффекта
        </span>

        <Select
          value={placement.region}
          onChange={(event) => {
            updatePlacement({ region: event.target.value as VisualPlacement['region'] });
          }}
        >
          {Object.entries(regions).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </label>

      <label className={styles.Field}>
        <span>
          Слой эффекта
        </span>

        <Select
          value={currentDepth.plane}
          onChange={(event) => {
            onChange(placement, {
              ...currentDepth,
              plane: event.target.value as VisualDepth['plane'],
            });
          }}
        >
          {Object.entries(planes).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </label>

      {(['anchor', 'origin'] as const).map((property) => (
        <label key={property} className={styles.Field}>
          <span>
            {property === 'anchor' ? 'Якорь поверхности' : 'Точка поверхности у якоря'}
          </span>

          <Select
            value={placement[property] ?? (property === 'origin' ? placement.anchor : undefined) ?? 'top-left'}
            onChange={(event) => updatePlacement({ [property]: event.target.value })}
          >
            {Object.entries(anchors).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
      ))}

      <div className={styles.Grid}>
        {(['x', 'y'] as const).map((axis) => (
          <div key={axis} className={styles.Field}>
            <PlacementNumber
              label={`Смещение ${axis.toUpperCase()}`}
              value={offset[axis].value}
              onChange={(value) => updatePlacement({
                offset: {
                  ...offset,
                  [axis]: {
                    ...offset[axis],
                    value,
                  },
                },
              })}
            />

            <Select
              aria-label={`Единица смещения ${axis.toUpperCase()}`}
              value={offset[axis].unit}
              onChange={(event) => updatePlacement({
                offset: {
                  ...offset,
                  [axis]: {
                    ...offset[axis],
                    unit: event.target.value,
                  },
                },
              })}
            >
              <option value="px">
                px
              </option>

              <option value="%">
                %
              </option>
            </Select>
          </div>
        ))}

        {(['width', 'height'] as const).map((axis) => (
          <div key={axis} className={styles.Field}>
            <PlacementNumber
              label={axis === 'width' ? 'Ширина поверхности' : 'Высота поверхности'}
              value={size[axis].value}
              min={0}
              onChange={(value) => updatePlacement({
                size: {
                  ...size,
                  [axis]: {
                    ...size[axis],
                    value,
                  },
                },
              })}
            />

            <Select
              aria-label={axis === 'width' ? 'Единица ширины' : 'Единица высоты'}
              value={size[axis].unit}
              onChange={(event) => updatePlacement({
                size: {
                  ...size,
                  [axis]: {
                    ...size[axis],
                    unit: event.target.value,
                  },
                },
              })}
            >
              <option value="px">
                px
              </option>

              <option value="%">
                %
              </option>
            </Select>
          </div>
        ))}

        <PlacementNumber
          label="Масштаб поверхности"
          value={placement.scale ?? 1}
          onChange={(scale) => updatePlacement({ scale })}
        />

        <PlacementNumber
          label="Поворот поверхности"
          value={placement.rotate ?? 0}
          onChange={(rotate) => updatePlacement({ rotate })}
        />

        <PlacementNumber
          label="Порядок в слое"
          value={currentDepth.order ?? 0}
          integer
          onChange={(order) => onChange(placement, {
            ...currentDepth,
            order,
          })}
        />
      </div>

      <Button onClick={() => onChange({ region: placement.region }, currentDepth)}>
        Заполнить область
      </Button>
    </fieldset>
  );
};
