import { er_EmergencyCenter, er_EmergencyRoom, er_EmergencyRoomBed, er_Hospital } from '@prisma/client';
import { ErEmergencyCenterRequest } from '@src/types';

export namespace ErEmergencyCenter {
  export type GetEmergencyCenterListQuery = ErEmergencyCenterRequest.GetEmergencyCenterListQuery;
  export interface GetEmergencyCenterListQueryReturn {
    emergency_center_list: SortEmergencyCenterByDistanceRetrun;
    count: number;
  }

  export interface EmergencyCenterWithDistance extends GetEmergentcyCenterListQueryFindManyOuput {
    /**
     * @type number
     * @description 거리
     */
    distance: number;
  }
  export interface GetEmergentcyCenterListQueryFindManyOuput extends er_EmergencyCenter {
    hospital: er_Hospital;
    emergency_rooms: (er_EmergencyRoom & {
      emergency_room_beds: er_EmergencyRoomBed[];
      _count: {
        emergency_room_beds: number;
      };
    })[];
  }

  export type SortEmergencyCenterByDistanceRetrun = EmergencyCenterWithDistance[];
}
