export const numberOr = (value: string | undefined): number | undefined => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const listOr = (value: string | undefined): string[] => {
  return value === undefined ? [] : value.split(",").map((item) => item.trim());
};
