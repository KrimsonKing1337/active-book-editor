export const removeLeadingZeros = (value: string): string => {
  return value.replace(/^(-?)0+(?=\d)/, '$1');
};
