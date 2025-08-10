export const numberOr = (value: string | undefined): number | undefined => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};
