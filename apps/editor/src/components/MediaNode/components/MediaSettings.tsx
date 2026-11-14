import type { ChangeEvent } from 'react';

import type {
  BookImageNode,
  BookMediaAlignment,
  BookMediaFit,
  BookVideoNode,
} from '@active-book/types';

import { MediaDimensions } from './MediaDimensions';
import { MediaPoster } from './MediaPoster';

import styles from '../MediaNode.module.scss';

type MediaSettingsProps = {
  node: BookImageNode | BookVideoNode;
  onChange: (attributes: Record<string, unknown>) => void;
};

const alignments: BookMediaAlignment[] = [
  'left',
  'center',
  'right',
];

const fits: BookMediaFit[] = [
  'contain',
  'cover',
];

export const MediaSettings = ({ node, onChange }: MediaSettingsProps) => {
  const { attrs } = node;

  let options;

  if (node.type === 'image') {
    const alt = node.attrs.alt ?? '';

    const changeHandler = (e: ChangeEvent<HTMLInputElement>) => {
      onChange({ alt: e.target.value });
    };

    options = (
      <label>
        <span>
          Альтернативное описание
        </span>

        <input value={alt} onChange={changeHandler} />
      </label>
    );
  } else {
    const video = node.attrs;

    const booleans = [
      {
        name: 'controls',
        label: 'Показывать управление',
        checked: video.controls ?? true,
      },
      {
        name: 'autoPlay',
        label: 'Автовоспроизведение',
        checked: video.autoPlay ?? false,
      },
      {
        name: 'muted',
        label: 'Без звука',
        checked: video.muted ?? true,
      },
      {
        name: 'loop',
        label: 'Повторять',
        checked: video.loop ?? false,
      },
    ];

    options = (
      <>
        <MediaPoster value={video.poster} onChange={onChange} />

        {booleans.map((booleanCur) => {
          const {
            checked,
            label,
            name,
          } = booleanCur;

          const changeHandler = (e: ChangeEvent<HTMLInputElement>) => {
            onChange({ [name]: e.target.checked });
          };

          return (
            <label key={name}>
              <input
                type="checkbox"
                checked={checked}
                onChange={changeHandler}
              />

              {label}
            </label>
          );
        })}
      </>
    );
  }

  const alignValue = attrs.align ?? 'left';

  const alignChangeHandler = (e: ChangeEvent<HTMLSelectElement>) => {
    const align = alignments.find((valueCur) => {
      return valueCur === e.target.value;
    });

    if (align) {
      onChange({ align });
    }
  };

  const fitValue = attrs.fit ?? 'contain';

  const fitChangeHandler = (e: ChangeEvent<HTMLSelectElement>) => {
    const fit = fits.find((valueCur) => {
      return valueCur === e.target.value;
    });

    if (fit) {
      onChange({ fit });
    }
  };

  return (
    <fieldset className={styles.Settings} aria-label="Настройки медиа">
      <legend>
        Настройки медиа
      </legend>

      <MediaDimensions attrs={attrs} onChange={onChange} />

      <label>
        <span>
          Выравнивание
        </span>

        <select
          value={alignValue}
          onChange={alignChangeHandler}
        >
          <option value="left">
            Слева
          </option>

          <option value="center">
            По центру
          </option>

          <option value="right">
            Справа
          </option>
        </select>
      </label>

      <label>
        Размещение в заданной области
        <select
          value={fitValue}
          onChange={fitChangeHandler}
        >
          <option value="contain">
            Показать целиком
          </option>

          <option value="cover">
            Заполнить область
          </option>
        </select>
      </label>

      {options}
    </fieldset>
  );
};
