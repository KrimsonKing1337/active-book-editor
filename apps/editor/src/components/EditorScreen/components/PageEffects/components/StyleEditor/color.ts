const hexReplacement = {
  h: /[a-f\d]/i,
};

export const hexMaskOptions = {
  mask: '#hhhhhhhh',
  replacement: hexReplacement,
};

export const rgbaReplacement = {
  d: /\d/,
};

export type RgbaWidths = [number, number, number, number];

export const getRgbaWidths = (value: string): RgbaWidths => {
  const [channels = '', alpha = ''] = value.split('/');
  const parts = channels.trim().split(/\s+/);
  const percentages = alpha.trim().replace('%', '');

  const redWidth = parts[0]?.length || 3;
  const greenWidth = parts[1]?.length || 3;
  const blueWidth = parts[2]?.length || 3;
  const alphaWidth = percentages.length || 3;

  return [
    redWidth,
    greenWidth,
    blueWidth,
    alphaWidth,
  ] as RgbaWidths;
};

export const getRgbaMask = (widths: RgbaWidths): string => {
  const [red, green, blue, alpha] = widths;

  const redMask = 'd'.repeat(red);
  const greenMask = 'd'.repeat(green);
  const blueMask = 'd'.repeat(blue);
  const alphaMask = 'd'.repeat(alpha);

  const rgbMask = [redMask, greenMask, blueMask].join(' ');

  return `${rgbMask} / ${alphaMask}%`;
};

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

  const channelsString = `${channels.join('')}`;

  return `#${channelsString}${alphaHex}`;
};

export const getRgbaColor = (hex: string): string => {
  const channels = [1, 3, 5].map((index) => {
    return parseInt(hex.slice(index, index + 2), 16);
  });

  const alpha = Math.round(parseInt(hex.slice(7, 9), 16) / 255 * 100) / 100;

  const channelsString = `${channels.join(' ')}`;
  const alphaString = `${Math.round(alpha * 100)}`;

  return `${channelsString} / ${alphaString}%`;
};

export const parseRgbaColor = (value: string): string | null => {
  const sections = value.split('/');

  if (sections.length !== 2 || !sections[1].trim().endsWith('%')) {
    return null;
  }

  const channelTexts = sections[0].trim().split(/\s+/);
  const channelNumbers = channelTexts.map(Number);
  const alphaText = sections[1].trim().slice(0, -1);
  const percentage = Number(alphaText);

  const channelTextsCountAreValid = channelTexts.length === 3;

  const channelTextAreValid = channelTexts.every((text, index) => {
    const number = channelNumbers[index];

    return text.length > 0 && Number.isInteger(number) && number >= 0 && number <= 255;
  });

  const channelsAreValid = channelTextsCountAreValid && channelTextAreValid;

  const alphaIsValid = alphaText.length > 0
    && Number.isInteger(percentage)
    && percentage >= 0
    && percentage <= 100;

  if (!channelsAreValid || !alphaIsValid) {
    return null;
  }

  const rgbValue = `${channelNumbers.join(' ')}`;
  const alphaValue = percentage / 100;

  return `rgb(${rgbValue} / ${alphaValue})`;
};
