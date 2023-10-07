import { calculateDistance } from './calculateDistance';

type SortByDistanceFromCurrentLocation = <
  T extends {
    [key: string]: any;
  },
>(arg: {
  latitude: number;
  longitude: number;
  list: T[];
  objLatitudeKey: keyof T;
  objLongitudeKey: keyof T;
}) => (T & { distance: number })[];

export const sortByDistanceFromCurrentLocation: SortByDistanceFromCurrentLocation = ({
  latitude,
  longitude,
  list,
  objLatitudeKey,
  objLongitudeKey,
}) => {
  const sortedList = list
    .map((comparisonTarget) => {
      const coparisonLatitude = comparisonTarget[objLatitudeKey];
      const comparisonLongitude = comparisonTarget[objLongitudeKey];
      return {
        ...comparisonTarget,
        distance: calculateDistance(latitude, longitude, coparisonLatitude, comparisonLongitude),
      };
    })
    .sort((a, b) => a.distance - b.distance);
  return sortedList;
};
