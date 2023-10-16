export const filterByDistance = <T extends { distance: number }>(list: T[], n: number, standard: number) => {
  return list.filter((item) => (n - 1) * standard <= item.distance && item.distance < n * standard);
};
