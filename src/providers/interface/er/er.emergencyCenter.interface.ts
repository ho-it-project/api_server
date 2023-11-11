import {
  er_Department,
  er_EmergencyCenter,
  er_EmergencyRoom,
  er_EmergencyRoomBed,
  er_Hospital,
  er_HospitalDepartment,
  er_HospitalMedicalEquipment,
  er_HospitalServereIllness,
  er_MedicalEquipment,
  er_ServereIllness,
} from '@prisma/client';
import { ErEmergencyCenterRequest } from '@src/types';

export namespace ErEmergencyCenter {
  export type GetEmergencyCenterListQuery = ErEmergencyCenterRequest.GetEmergencyCenterListQuery;

  export type GetEmergentcyCenterListQueryFindManyOuputWithDistance = (GetEmergentcyCenterListQueryFindManyOuput & {
    distance: number;
  })[];

  export interface GetEmergencyCenterListQueryReturn {
    emergency_center_list: GetEmergentcyCenterListQueryFindManyOuputWithDistance;
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

  /**
   * 사용하지않지만 변경된점을 알기위해 남겨둠 지워질 예정
   */
  // export type SortEmergencyCenterByDistanceRetrun = EmergencyCenterWithDistance[];
  export type SortEmergencyCenterListByDistance = <T extends er_EmergencyCenter>(arg: {
    latitude: number;
    longitude: number;
    emergencyCenterList: T[];
  }) => (T & { distance: number })[];

  export type GetEmergencyCenterByIdReturn = er_EmergencyCenter & {
    hospital: er_Hospital & {
      hospital_departments: (er_HospitalDepartment & {
        department: er_Department;
      })[];
      hospital_medical_equipment: (er_HospitalMedicalEquipment & { medical_equipment: er_MedicalEquipment })[];
      hospital_servere_illness: (er_HospitalServereIllness & {
        servere_illness: er_ServereIllness;
      })[];
    };
    emergency_rooms: (er_EmergencyRoom & {
      emergency_room_beds: er_EmergencyRoomBed[];
      _count: {
        emergency_room_beds: number;
      };
    })[];
  };
}
