const hexReplacement = {
  h: /[a-f\d]/i,
};

export const hexMaskOptions = {
  mask: '#hhhhhhhh',
  replacement: hexReplacement,
};

export type RgbaChannels = [string, string, string, string];

export const getHexColor = (value: string): string => {
  if (value.startsWith('#')) {
    const digits = value.slice(1);

    if (digits.length === 6 || digits.length === 8) {
      return value.length === 7 ? value + 'ff' : value;
    }
  }

  const matches = value.match(/\d+(?:\.\d+)?/g);

  if (!matches || matches.length < 3) {
    return '#000000ff';
  }

  const channels = matches.slice(0, 3).map((channel) => {
    const normalized = Math.max(0, Math.min(255, Number(channel)));

    return Math.round(normalized).toString(16).padStart(2, '0');
  });

  const alpha = Math.max(0, Math.min(1, Number(matches[3] ?? 1)));
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');

  const channelsString = channels.join('');

  return `#${channelsString}${alphaHex}`;
};

export const getRgbaChannels = (hex: string): RgbaChannels => {
  const color = getHexColor(hex);

  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);
  const alpha = parseInt(color.slice(7, 9), 16);

  const alphaPercent = Math.round(alpha / 255 * 100);

  return [String(red), String(green), String(blue), String(alphaPercent)];
};

export const getRgbaError = (channels: RgbaChannels): string | null => {
  const names = ['R', 'G', 'B', 'A'];

  for (let index = 0; index < channels.length; index += 1) {
    const text = channels[index];
    const maximum = index === 3 ? 100 : 255;

    if (text && (!/^\d{1,3}$/.test(text) || Number(text) > maximum)) {
      return `Канал ${names[index]}: допустимое значение от 0 до ${maximum}`;
    }
  }

  return null;
};

export const getHexFromRgba = (channels: RgbaChannels): string | null => {
  if (getRgbaError(channels)) {
    return null;
  }

  const numbers = channels.map((value) => Number(value || 0));
  const rgb = numbers.slice(0, 3);
  const alpha = numbers[3];

  const rgbHex = rgb.map((value) => value.toString(16).padStart(2, '0')).join('');
  const alphaHex = Math.round(alpha / 100 * 255).toString(16).padStart(2, '0');

  return `#${rgbHex}${alphaHex}`;
};
