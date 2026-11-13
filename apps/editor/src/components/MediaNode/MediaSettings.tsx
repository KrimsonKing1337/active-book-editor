import type {
  BookImageNode,
  BookMediaAlignment,
  BookMediaFit,
  BookVideoNode,
} from '@active-book/types';

import { MediaDimensions } from './MediaDimensions';
import { MediaPoster } from './MediaPoster';

import styles from './MediaNode.module.scss';

type MediaSettingsProps = {
  node: BookImageNode | BookVideoNode;
  onChange: (attributes: Record<string, unknown>) => void;
};

const alignments: BookMediaAlignment[] = [
  'left',
  'center',
  'right',
];
const fits: BookMediaFit[] = ['contain', 'cover'];

export const MediaSettings = ({ node, onChange }: MediaSettingsProps) => {
  const { attrs } = node;
  let options;

  if (node.type === 'image') {
    options = (
      <label>
        Альтернативное описание
        <input value={node.attrs.alt ?? ''} onChange={(event) => onChange({ alt: event.target.value })} />
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

        {booleans.map(({
          name,
          label,
          checked,
        }) => (
          <label key={name}>
            <input type="checkbox" checked={checked} onChange={(event) => onChange({ [name]: event.target.checked })} />
            {label}
          </label>
        ))}
      </>
    );
  }

  return (
    <fieldset className={styles.Settings} aria-label="Настройки медиа">
      <legend>
        Настройки медиа
      </legend>

      <MediaDimensions attrs={attrs} onChange={onChange} />

      <label>
        Выравнивание
        <select
          value={attrs.align ?? 'left'}
          onChange={(event) => {
            const align = alignments.find((value) => value === event.target.value);

            if (align) {
              onChange({ align });
            }
          }}
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
          value={attrs.fit ?? 'contain'}
          onChange={(event) => {
            const fit = fits.find((value) => value === event.target.value);

            if (fit) {
              onChange({ fit });
            }
          }}
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
