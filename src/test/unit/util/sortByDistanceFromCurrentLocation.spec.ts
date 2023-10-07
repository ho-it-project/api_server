import { sortByDistanceFromCurrentLocation } from '@common/util/sortByDistanceFromCurrentLocation';
import { er_EmergencyCenter, er_Hospital } from '@prisma/client';
import typia, { tags } from 'typia';

describe('sortByDistanceFromCurrentLocation', () => {
  it('should be return empty array', async () => {
    const result = sortByDistanceFromCurrentLocation<er_Hospital>({
      latitude: 37.123,
      list: [],
      longitude: 127.123,
      objLatitudeKey: 'longitude',
      objLongitudeKey: 'longitude',
    });
    expect(result).toEqual([]);
  });
  it('should be return comparisonTargetList with distance', async () => {
    const comparisonTargetList = typia.random<er_Hospital[] & tags.MinItems<10> & tags.MaxItems<10>>();

    const result = sortByDistanceFromCurrentLocation({
      latitude: 37.123,
      list: comparisonTargetList,
      longitude: 127.123,
      objLatitudeKey: 'latitude',
      objLongitudeKey: 'longitude',
    });
    expect(result.length).toEqual(comparisonTargetList.length);
    expect(result[0].distance).toBeDefined();
  });

  it('should be return comparisonTargetList with distance', async () => {
    const comparisonTargetList = typia.random<er_EmergencyCenter[] & tags.MinItems<10> & tags.MaxItems<10>>();

    const result = sortByDistanceFromCurrentLocation({
      latitude: 37.123,
      list: comparisonTargetList,
      longitude: 127.123,
      objLatitudeKey: 'emergency_center_latitude',
      objLongitudeKey: 'emergency_center_longitude',
    });
    expect(result.length).toEqual(comparisonTargetList.length);
    expect(result[0].distance).toBeDefined();
  });
});
