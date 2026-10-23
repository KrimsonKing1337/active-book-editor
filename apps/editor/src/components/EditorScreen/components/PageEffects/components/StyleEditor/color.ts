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

  return [
    parts[0]?.length || 3,
    parts[1]?.length || 3,
    parts[2]?.length || 3,
    percentages.length || 3,
  ] as RgbaWidths;
};

export const getRgbaMask = (widths: RgbaWidths): string => {
  const [red, green, blue, alpha] = widths;

  return [
    'd'.repeat(red),
    'd'.repeat(green),
    'd'.repeat(blue),
  ].join(' ') + ' / ' + 'd'.repeat(alpha) + '%';
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

  return `#${channels.join('')}${alphaHex}`;
};

export const getRgbaColor = (hex: string): string => {
  const channels = [1, 3, 5].map((index) => {
    return parseInt(hex.slice(index, index + 2), 16);
  });

  const alpha = Math.round(parseInt(hex.slice(7, 9), 16) / 255 * 100) / 100;

  return `${channels.join(' ')} / ${Math.round(alpha * 100)}%`;
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

  const channelsAreValid = channelTexts.length === 3 && channelTexts.every((text, index) => {
    const number = channelNumbers[index];

    return text.length > 0 && Number.isInteger(number) && number >= 0 && number <= 255;
  });

  const alphaIsValid = alphaText.length > 0 && Number.isInteger(percentage)
    && percentage >= 0 && percentage <= 100;

  if (!channelsAreValid || !alphaIsValid) {
    return null;
  }

  return `rgb(${channelNumbers.join(' ')} / ${percentage / 100})`;
};
