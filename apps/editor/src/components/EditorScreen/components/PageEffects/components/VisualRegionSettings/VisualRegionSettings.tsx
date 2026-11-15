import type { ChangeEvent } from 'react';

import type {
  VisualDepth,
  VisualPlacement,
  VisualVisibility,
} from '@active-book/types';

import type { VisualLayout } from '@active-book/book-builder/effects';

import { Select, Button } from '../EffectControls';

import { FrameMaskSettings } from './components/FrameMaskSettings';
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

const anchorProperties = ['anchor', 'origin'] as const;
const offsetAxes = ['x', 'y'] as const;
const sizeAxes = ['width', 'height'] as const;
const lengthUnits = ['px', '%'] as const;

const anchorLabels = {
  anchor: 'Якорь поверхности',
  origin: 'Точка поверхности у якоря',
};

const sizeLabels = {
  width: 'Ширина поверхности',
  height: 'Высота поверхности',
};

const sizeUnitLabels = {
  width: 'Единица ширины',
  height: 'Единица высоты',
};

const regionOptions = Object.entries(regions).map(([value, label]) => {
  return (
    <option key={value} value={value}>
      {label}
    </option>
  );
});

const planeOptions = Object.entries(planes).map(([value, label]) => {
  return (
    <option key={value} value={value}>
      {label}
    </option>
  );
});

const anchorOptions = Object.entries(anchors).map(([value, label]) => {
  return (
    <option key={value} value={value}>
      {label}
    </option>
  );
});

const lengthUnitOptions = lengthUnits.map((unitCur) => {
  return (
    <option key={unitCur} value={unitCur}>
      {unitCur}
    </option>
  );
});

type Region = VisualPlacement['region'];
type Plane = VisualDepth['plane'];
type AnchorProperty = (typeof anchorProperties)[number];
type OffsetAxis = (typeof offsetAxes)[number];
type SizeAxis = (typeof sizeAxes)[number];
type LengthUnit = (typeof lengthUnits)[number];

type LengthPatch = {
  value?: number;
  unit?: LengthUnit;
};

type VisualRegionSettingsProps = {
  placement?: VisualPlacement;
  depth?: VisualDepth;
  visibility?: VisualVisibility;
  defaultPlane: Plane;
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

  const anchor = placement.anchor ?? 'top-left';
  const origin = placement.origin ?? anchor;
  const anchorValues = { anchor, origin };

  const offset: NonNullable<VisualPlacement['offset']> = placement.offset ?? {
    x: { value: 0, unit: 'px' },
    y: { value: 0, unit: 'px' },
  };

  const size: NonNullable<VisualPlacement['size']> = placement.size ?? {
    width: { value: 100, unit: '%' },
    height: { value: 100, unit: '%' },
  };

  const updateLayout = (patch: VisualLayout) => {
    onChange({
      placement,
      depth: currentDepth,
      visibility,
      ...patch,
    });
  };

  const updatePlacement = (patch: Partial<VisualPlacement>) => {
    updateLayout({
      placement: {
        ...placement,
        ...patch,
      },
    });
  };

  const updateDepth = (patch: Partial<VisualDepth>) => {
    updateLayout({
      depth: {
        ...currentDepth,
        ...patch,
      },
    });
  };

  const updateOffset = (axis: OffsetAxis, patch: LengthPatch) => {
    updatePlacement({
      offset: {
        ...offset,
        [axis]: {
          ...offset[axis],
          ...patch,
        },
      },
    });
  };

  const updateSize = (axis: SizeAxis, patch: LengthPatch) => {
    updatePlacement({
      size: {
        ...size,
        [axis]: {
          ...size[axis],
          ...patch,
        },
      },
    });
  };

  const handleRegionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updatePlacement({ region: event.target.value as Region });
  };

  const handlePlaneChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateDepth({ plane: event.target.value as Plane });
  };

  const handleAnchorChange = (property: AnchorProperty, value: string) => {
    updatePlacement({ [property]: value });
  };

  const handleVisibilityChange = (nextVisibility: VisualVisibility) => {
    updateLayout({ visibility: nextVisibility });
  };

  const handleScaleChange = (scale: number) => {
    updatePlacement({ scale });
  };

  const handleRotateChange = (rotate: number) => {
    updatePlacement({ rotate });
  };

  const handleOrderChange = (order: number) => {
    updateDepth({ order });
  };

  const handleResetPlacement = () => {
    const layoutPlacement = { region: placement.region };

    updateLayout({ placement: layoutPlacement });
  };

  const anchorControls = anchorProperties.map((propCur) => {
    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
      handleAnchorChange(propCur, e.target.value);
    };

    return (
      <label key={propCur} className={styles.Field}>
        <span>
          {anchorLabels[propCur]}
        </span>

        <Select value={anchorValues[propCur]} onChange={handleChange}>
          {anchorOptions}
        </Select>
      </label>
    );
  });

  const offsetControls = offsetAxes.map((axis) => {
    const axisU = axis.toUpperCase();

    const label = `Смещение ${axisU}`;
    const unitLabel = `Единица смещения ${axisU}`;

    const { value, unit } = offset[axis];

    const handleValueChange = (nextValue: number) => {
      updateOffset(axis, { value: nextValue });
    };

    const handleUnitChange = (event: ChangeEvent<HTMLSelectElement>) => {
      updateOffset(axis, { unit: event.target.value as LengthUnit });
    };

    return (
      <div key={axis} className={styles.Field}>
        <PlacementNumber
          label={label}
          value={value}
          onChange={handleValueChange}
        />

        <Select
          aria-label={unitLabel}
          value={unit}
          onChange={handleUnitChange}
        >
          {lengthUnitOptions}
        </Select>
      </div>
    );
  });

  const sizeControls = sizeAxes.map((axis) => {
    const { value, unit } = size[axis];

    const handleValueChange = (nextValue: number) => {
      updateSize(axis, { value: nextValue });
    };

    const handleUnitChange = (event: ChangeEvent<HTMLSelectElement>) => {
      updateSize(axis, { unit: event.target.value as LengthUnit });
    };

    return (
      <div key={axis} className={styles.Field}>
        <PlacementNumber
          label={sizeLabels[axis]}
          value={value}
          min={0}
          onChange={handleValueChange}
        />

        <Select
          aria-label={sizeUnitLabels[axis]}
          value={unit}
          onChange={handleUnitChange}
        >
          {lengthUnitOptions}
        </Select>
      </div>
    );
  });

  return (
    <fieldset className={styles.Settings}>
      <legend>
        Размещение эффекта
      </legend>

      <label className={styles.Field}>
        <span>
          Область размещения эффекта
        </span>

        <Select value={placement.region} onChange={handleRegionChange}>
          {regionOptions}
        </Select>
      </label>

      <label className={styles.Field}>
        <span>
          Слой эффекта
        </span>

        <Select value={currentDepth.plane} onChange={handlePlaneChange}>
          {planeOptions}
        </Select>
      </label>

      {anchorControls}

      <div className={styles.Grid}>
        {offsetControls}
        {sizeControls}

        <PlacementNumber
          label="Масштаб поверхности"
          value={placement.scale ?? 1}
          onChange={handleScaleChange}
        />

        <PlacementNumber
          label="Поворот поверхности"
          value={placement.rotate ?? 0}
          onChange={handleRotateChange}
        />

        <PlacementNumber
          label="Порядок в слое"
          value={currentDepth.order ?? 0}
          integer
          onChange={handleOrderChange}
        />
      </div>

      <FrameMaskSettings visibility={visibility} onChange={handleVisibilityChange} />

      <Button onClick={handleResetPlacement}>
        Сбросить размещение
      </Button>
    </fieldset>
  );
};
