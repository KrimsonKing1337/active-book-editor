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
      { value: 'sfx', label: 'SFX', addLabel: 'Добавить SFX' },
      { value: 'music', label: 'Music', addLabel: 'Добавить музыку' },
      { value: 'bg', label: 'Background', addLabel: 'Добавить фоновый звук' },
    ],
  },
  {
    value: 'background',
    label: 'Background',
    description: 'Фон, изображения, видео и затемнение',
    groups: [
      { value: 'background', label: 'Background', addLabel: 'Добавить фон' },
      { value: 'image', label: 'Image', addLabel: 'Добавить изображение' },
      { value: 'video', label: 'Video', addLabel: 'Добавить видео' },
      { value: 'shadow', label: 'Shadow', addLabel: 'Добавить затемнение' },
      { value: 'component', label: 'Component', addLabel: 'Добавить фоновый компонент' },
    ],
  },
  {
    value: 'side',
    label: 'Side',
    description: 'Боковые тени, текст и компоненты',
    groups: [
      { value: 'shadow', label: 'Shadow', addLabel: 'Добавить боковую тень' },
      { value: 'text', label: 'Text', addLabel: 'Добавить боковой текст' },
      { value: 'component', label: 'Component', addLabel: 'Добавить боковой компонент' },
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

  if (effect.type === 'background' || effect.type === 'side') {
    return effect.kind;
  }

  return effect.type;
};

export const getCategoryDefinition = (category: EffectCategory): EffectCategoryDefinition => {
  const definition = EFFECT_CATEGORIES.find((current) => current.value === category);

  if (!definition) {
    throw new Error(`Неизвестная категория эффектов: ${category}`);
  }

  return definition;
};

export const getEffectPath = (effect: EditorEffectDraft): string => {
  const category = getCategoryDefinition(effect.type);
  const group = category.groups.find((current) => current.value === getEffectGroup(effect));

  return [category.label, group?.label].filter(Boolean).join(' / ');
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

  return effects.filter((effect) => {
    if (category && effect.type !== category) {
      return false;
    }

    if (group && getEffectGroup(effect) !== group) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const categoryDefinition = getCategoryDefinition(effect.type);
    const groupDefinition = categoryDefinition.groups.find((current) => current.value === getEffectGroup(effect));

    const searchable = [
      effect.id,
      effect.slug,
      effect.type,
      categoryDefinition.label,
      groupDefinition?.label,
      groupDefinition?.value,
    ];

    if (effect.type === 'audio') {
      searchable.push(effect.options.src);
    } else if (effect.type === 'background') {
      searchable.push(effect.options.image?.src);
      searchable.push(effect.options.video?.src);
      searchable.push(effect.options.component?.name);
    } else if (effect.type === 'side') {
      searchable.push(effect.options.text?.leftText);
      searchable.push(effect.options.text?.rightText);
      searchable.push(effect.options.component?.name);
    }

    return searchable.some((cur) => {
      return cur?.toLocaleLowerCase().includes(normalizedQuery);
    });
  });
};
