import type { FrameSide, VisualDepth, VisualPlacement, VisualVisibility } from '@active-book/types';

import type { VisualLayout } from '@active-book/book-builder/effects';

import { Select, Button, Checkbox } from '../EffectControls';

import { PlacementNumber } from './components/PlacementNumber';

import styles from './VisualRegionSettings.module.scss';

const regions = {
  application: 'Всё приложение',
  story: 'Произведение',
  storyViewport: 'Весь вьюпорт',
  storyViewportFrame: 'Рамка всего вьюпорта',
  narrativeFrame: 'Нарратив',
  toolbar: 'Toolbar',
  toolbarFrame: 'Рамка Toolbar',
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
  visibility?: VisualVisibility;
  defaultPlane: VisualDepth['plane'];
  onChange: (layout: VisualLayout) => void;
};

export const VisualRegionSettings = ({
  placement = { region: 'storyViewport' },
  depth,
  visibility = {},
  defaultPlane,
  onChange,
}: VisualRegionSettingsProps) => {
  const currentDepth = depth ?? { plane: defaultPlane };
  const updateLayout = (patch: VisualLayout) => onChange({
    placement,
    depth: currentDepth,
    visibility,
    ...patch, 
  });
  const updatePlacement = (patch: Partial<VisualPlacement>) => updateLayout({
    placement: {
      ...placement,
      ...patch, 
    }, 
  });
  const updateVisibility = (patch: Partial<VisualVisibility>) => updateLayout({
    visibility: {
      ...visibility,
      ...patch, 
    }, 
  });
  const allSides: FrameSide[] = ['top', 'right', 'bottom', 'left'];
  const maskEnabled = visibility.sides !== undefined;
  const handleMaskChange = (enabled: boolean) => {
    const next = { ...visibility };
    if (enabled) {
      next.sides = allSides;
    }
    else {
      delete next.sides;
    }
    updateLayout({ visibility: next });
  };
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
            const region = event.target.value as VisualPlacement['region'];
            const preset = region === 'storyViewportFrame' || region === 'toolbarFrame';
            updateLayout({
              placement: {
                ...placement,
                region, 
              },
              visibility: preset ? {
                ...visibility,
                sides: allSides, 
              } : visibility, 
            });
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
            updateLayout({
              depth: {
                ...currentDepth,
                plane: event.target.value as VisualDepth['plane'], 
              }, 
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
          onChange={(order) => updateLayout({
            depth: {
              ...currentDepth,
              order, 
            }, 
          })}
        />
      </div>


      <fieldset className={styles.Settings}>
        <legend>
          Маска сторон
        </legend>

        <Checkbox checked={maskEnabled} onChange={(event) => handleMaskChange(event.target.checked)}>
          Ограничить сторонами рамки
        </Checkbox>

        {maskEnabled && (
          <>
            <div className={styles.Grid}>
              {allSides.map((side) => (
                <Checkbox
                  key={side}
                  checked={visibility.sides?.includes(side) ?? false}
                  onChange={(event) => updateVisibility({
                    sides: event.target.checked
                      ? [...(visibility.sides ?? []), side] : visibility.sides?.filter((cur) => cur !== side), 
                  })}
                >
                  {{
                    top: 'Сверху',
                    right: 'Справа',
                    bottom: 'Снизу',
                    left: 'Слева', 
                  }[side]}
                </Checkbox>
              ))}
            </div>

            <PlacementNumber
              label="Толщина рамочной маски"
              value={visibility.frameWidth?.value ?? 12}
              min={0}
              onChange={(value) => updateVisibility({
                frameWidth: {
                  value,
                  unit: visibility.frameWidth?.unit ?? 'px', 
                }, 
              })}
            />

            <Select
              aria-label="Единица толщины маски"
              value={visibility.frameWidth?.unit ?? 'px'}
              onChange={(event) => updateVisibility({
                frameWidth: {
                  value: visibility.frameWidth?.value ?? 12,
                  unit: event.target.value as 'px' | '%',
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
          </>
        )}
      </fieldset>

      <Button onClick={() => updateLayout({ placement: { region: placement.region } })}>
        Заполнить область
      </Button>
    </fieldset>
  );
};
