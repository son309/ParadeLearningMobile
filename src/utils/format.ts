export const formatCount = (value: string | number | undefined) => {
  const parsed = Number(value ?? 0);
  if (Number.isNaN(parsed)) {
    return '0';
  }

  return parsed.toLocaleString('en-US');
};
