import type { EditorEffectDraft } from '../../@types';

export type EffectCategory = EditorEffectDraft['type'];
export type GroupingMode = 'none' | 'type';

export type EffectGroup = {
  value: string;
  label: string;
  addLabel: string;
};

export type EffectCategoryDefinition = {
  value: EffectCategory;
  label: string;
  description: string;
  groups: EffectGroup[];
};

export const EFFECT_CATEGORIES: EffectCategoryDefinition[] = [
  {
    value: 'audio',
    label: 'Audio',
    description: 'Звуковые эффекты и музыка',
    groups: [
      {
        value: 'sfx',
        label: 'SFX',
        addLabel: 'Добавить SFX',
      },
      {
        value: 'music',
        label: 'Music',
        addLabel: 'Добавить музыку',
      },
      {
        value: 'bg',
        label: 'Background',
        addLabel: 'Добавить фоновый звук',
      },
    ],
  },
  {
    value: 'background',
    label: 'Background',
    description: 'Фон, изображения, видео и затемнение',
    groups: [
      {
        value: 'background',
        label: 'Background',
        addLabel: 'Добавить фон',
      },
      {
        value: 'image',
        label: 'Image',
        addLabel: 'Добавить изображение',
      },
      {
        value: 'video',
        label: 'Video',
        addLabel: 'Добавить видео',
      },
      {
        value: 'shadow',
        label: 'Shadow',
        addLabel: 'Добавить затемнение',
      },
      {
        value: 'component',
        label: 'Component',
        addLabel: 'Добавить фоновый компонент',
      },
    ],
  },
  {
    value: 'frame',
    label: 'Frame',
    description: 'Рамочные тени, текст и компоненты',
    groups: [
      {
        value: 'shadow',
        label: 'Shadow',
        addLabel: 'Добавить боковую тень',
      },
      {
        value: 'text',
        label: 'Text',
        addLabel: 'Добавить боковой текст',
      },
      {
        value: 'component',
        label: 'Component',
        addLabel: 'Добавить боковой компонент',
      },
    ],
  },
  {
    value: 'vibration',
    label: 'Vibration',
    description: 'Вибрация устройства',
    groups: [{ value: 'vibration', label: 'Vibration', addLabel: 'Добавить вибрацию' }],
  },
  {
    value: 'flashlight',
    label: 'Flashlight',
    description: 'Вспышки и фонарик',
    groups: [{ value: 'flashlight', label: 'Flashlight', addLabel: 'Добавить вспышку' }],
  },
];

export const getEffectGroup = (effect: EditorEffectDraft): string => {
  if (effect.type === 'audio') {
    return effect.options.type;
  }

  if (effect.type === 'background' || effect.type === 'frame') {
    return effect.kind;
  }

  return effect.type;
};

export const getCategoryDefinition = (category: EffectCategory): EffectCategoryDefinition => {
  const definition = EFFECT_CATEGORIES.find((categoryCur) => {
    return categoryCur.value === category;
  });

  if (!definition) {
    throw new Error(`Неизвестная категория эффектов: ${category}`);
  }

  return definition;
};

export const getEffectPath = (effect: EditorEffectDraft): string => {
  const category = getCategoryDefinition(effect.type);
  const effectGroup = getEffectGroup(effect);

  const group = category.groups.find((groupCur) => {
    return groupCur.value === effectGroup;
  });

  const filteredLabels = [category.label, group?.label].filter(Boolean);

  return filteredLabels.join(' / ');
};

export type FilterEffectsOptions = {
  effects: EditorEffectDraft[];
  category: EffectCategory | null;
  group: string | null;
  query: string;
};

export const getFilteredEffects = ({
  effects,
  category,
  group,
  query,
}: FilterEffectsOptions): EditorEffectDraft[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return effects.filter((effectCur) => {
    if (category && effectCur.type !== category) {
      return false;
    }

    const effectGroup = getEffectGroup(effectCur);

    if (group && effectGroup !== group) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const categoryDefinition = getCategoryDefinition(effectCur.type);

    const groupDefinition = categoryDefinition.groups.find((groupCur) => {
      return groupCur.value === effectGroup;
    });

    const searchable = [
      effectCur.id,
      effectCur.slug,
      effectCur.type,
      categoryDefinition.label,
      groupDefinition?.label,
      groupDefinition?.value,
    ];

    if (effectCur.type === 'audio') {
      searchable.push(effectCur.options.src);
    } else if (effectCur.type === 'background') {
      searchable.push(effectCur.options.image?.src);
      searchable.push(effectCur.options.video?.src);
      searchable.push(effectCur.options.component?.name);
    } else if (effectCur.type === 'frame') {
      searchable.push(effectCur.options.text?.leftText);
      searchable.push(effectCur.options.text?.rightText);
      searchable.push(effectCur.options.component?.name);
    }

    return searchable.some((valueCur) => {
      return valueCur?.toLocaleLowerCase().includes(normalizedQuery);
    });
  });
};
