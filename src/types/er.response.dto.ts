import { er_Employee, er_NurseSpecialization } from '@prisma/client';
import { ErDepartment } from '@src/providers/interface/er/er.department.interface';
import { ErEmergencyCenter } from '@src/providers/interface/er/er.emergencyCenter.interface';
import { ErEmployee } from '@src/providers/interface/er/er.employee.interface';
import { ErEquipment } from '@src/providers/interface/er/er.equipment.interface';
import { ErIllness } from '@src/providers/interface/er/er.illness.interface';
import { ErPatient } from '@src/providers/interface/er/er.patient.interface';
import { DateToString } from '.';
import { ErAuth } from '../auth/interface/er.auth.interface';
export namespace ErAuthResponse {
  export interface Login {
    is_login: boolean;
    employee: ErAuth.AccessTokenSignPayload;
  }

  export interface CheckAuthStatus {
    is_login: boolean;
    employee: ErAuth.AccessTokenSignPayload | null;
  }

  export interface Logout {
    is_login: false;
  }
}

export namespace ErEmployeeResponse {
  export interface CheckManyEmployeeExist {
    exists: Pick<er_Employee, 'id_card'>[];
  }
  export type GetEmployeeList = { count: number } & {
    employee_list: ErEmployee.GetEmpoyeeWithoutPassword[];
  };

  export interface UpdatePassword {
    update_success: boolean;
  }
  export type GetNurseSpecilizationList = er_NurseSpecialization[];
}

export namespace ErEmergencyCenterResponse {
  export type GetEmergencyCenterList = DateToString<ErEmergencyCenter.GetEmergencyCenterListQueryReturn>;
  export type GetEmergencyCenterDetail = ErEmergencyCenter.GetEmergencyCenterByIdReturn;
  export type GetEmergencyRoom = ErEmergencyCenter.GetEmergencyRoomByIdReturn;
}

export namespace ErDepartmentResponse {
  export type UpdateAvailableDepartment = ErDepartment.UpdateAvailableDepartmentReturn;
  export type GetDepartmentStatusListDto = ErDepartment.GetDepartmentStatusListReturn;
  export type GetDepartmentList = ErDepartment.GetHospitalDepartmentList;
  export type GetDepartment = ErDepartment.GetDepartment;
}

export namespace ErEquipmentResponse {
  export type GetEquipmentStatus = ErEquipment.GetEquipmentStatusByIdReturn;
  export type UpdateEquipmentStatus = ErEquipment.UpdateEquipmentStatusReturn;
}

export namespace ErIllnessResponse {
  export type GetIllnesses = ErIllness.GetIllnessesReturn;
  export type GetServableIllnessesStatus = ErIllness.GetServableIllnessesStatusReturn;
  export type UpdateServableIllnessStatus = ErIllness.UpdateServableIllnessesStatusReturn;
}

export namespace ErPatientResponse {
  export type CreatePatient = ErPatient.CreatePatientReturn;
}
