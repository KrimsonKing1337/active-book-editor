import type {
  BackgroundEffectDraft,
  EditorEffectDraft,
  FrameEffectDraft,
} from '@components/EditorScreen/components/PageEffects/@types';

type EffectTileContent = {
  effectType: string;
  effectDetails: string;
};

const getBackgroundEffectContent = (effect: BackgroundEffectDraft): EffectTileContent => {
  const { kind, options } = effect;

  switch (kind) {
    case 'background':
      return {
        effectType: 'Фон',
        effectDetails: 'Цвет и стили фона',
      };

    case 'image':
      return {
        effectType: 'Изображение',
        effectDetails: options.image?.src || 'Файл не выбран',
      };

    case 'video':
      return {
        effectType: 'Видео',
        effectDetails: options.video?.src || 'Файл не выбран',
      };

    case 'shadow':
      return {
        effectType: 'Затемнение',
        effectDetails: 'Слой затемнения и фильтры',
      };

    case 'component':
      return {
        effectType: 'Фоновый компонент',
        effectDetails: options.component?.name ?? 'Компонент не выбран',
      };
  }
};

const getFrameEffectContent = (effect: FrameEffectDraft): EffectTileContent => {
  const { kind, options } = effect;

  switch (kind) {
    case 'shadow':
      return {
        effectType: 'Рамочная тень',
        effectDetails: options.shadow?.animation?.preset ?? 'Без анимации',
      };

    case 'text':
      return {
        effectType: 'Рамочный текст',
        effectDetails: options.text?.leftText ?? '',
      };

    case 'component':
      return {
        effectType: 'Рамочный компонент',
        effectDetails: options.component?.name ?? 'Компонент не выбран',
      };
  }
};

export const getEffectTileContent = (effect: EditorEffectDraft): EffectTileContent => {
  switch (effect.type) {
    case 'audio':
      return {
        effectType: `Audio · ${effect.options.type}`,
        effectDetails: effect.options.src || 'Файл не выбран',
      };

    case 'vibration':
      return {
        effectType: 'Vibration',
        effectDetails: `${effect.options.duration} мс`,
      };

    case 'background':
      return getBackgroundEffectContent(effect);

    case 'frame':
      return getFrameEffectContent(effect);

    case 'flashlight': {
      const frameShadowLabel = effect.options.withFrameShadow ? 'да' : 'нет';

      return {
        effectType: 'Flashlight',
        effectDetails: `${effect.options.duration} мс · frameShadow: ${frameShadowLabel}`,
      };
    }
  }
};
