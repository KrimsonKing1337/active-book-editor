import { type Modify } from '@react-input/mask';

export const hexMaskOptions = {
  mask: '#hhhhhhhh',
  replacement: { h: /[a-f\d]/i },
};

export const rgbaReplacement = { d: /\d/, a: /[01]/ };

export const getRgbaMask = (value: string): string => {
  const [channelsPart = '', alphaPart = ''] = value.split('/');
  const channels = channelsPart.trim().split(/\s+/);

  const lengths = [0, 1, 2].map((index) => {
    const digits = channels[index]?.replace(/\D/g, '').length ?? 0;

    return digits ? 'd'.repeat(Math.min(digits, 3)) : 'ddd';
  });

  const decimals = alphaPart.split('.')[1]?.replace(/\D/g, '').length ?? 0;
  const alphaMask = decimals ? 'd'.repeat(Math.min(decimals, 2)) : 'dd';

  return lengths.join(' ') + ' / a.' + alphaMask;
};

export const modifyRgbaMask: Modify = ({ value, data, selectionStart, selectionEnd }) => {
  const nextValue = value.slice(0, selectionStart) + (data ?? '') + value.slice(selectionEnd);

  return { mask: getRgbaMask(nextValue) };
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

  return '#' + channels.join('') + alphaHex;
};

export const getRgbaColor = (hex: string): string => {
  const channels = [1, 3, 5].map((index) => {
    return parseInt(hex.slice(index, index + 2), 16);
  });

  const alpha = Math.round(parseInt(hex.slice(7, 9), 16) / 255 * 100) / 100;

  return channels.join(' ') + ' / ' + alpha;
};

export const parseRgbaColor = (value: string): string | null => {
  const [channelsPart, alphaPart] = value.split('/');

  if (!channelsPart || !alphaPart) {
    return null;
  }

  const channels = channelsPart.trim().split(/\s+/).map(Number);
  const alpha = Number(alphaPart.trim());

  const channelsAreValid = channels.length === 3 && channels.every((channel) => {
    return Number.isInteger(channel) && channel >= 0 && channel <= 255;
  });

  if (!channelsAreValid || !Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
    return null;
  }

  return 'rgb(' + channels.join(' ') + ' / ' + alpha + ')';
};

