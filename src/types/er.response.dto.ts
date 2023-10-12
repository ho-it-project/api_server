import { er_Employee } from '@prisma/client';
import { ErDepartment } from '@src/providers/interface/er/er.department.interface';
import { ErEmergencyCenter } from '@src/providers/interface/er/er.emergencyCenter.interface';
import { ErEquipment } from '@src/providers/interface/er/er.equipment.interface';
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
  export type GetEmployeeList = { count: number } & { employee_list: Omit<er_Employee, 'password'>[] };

  export interface UpdatePassword {
    update_success: boolean;
  }
}

export namespace ErEmergencyCenterResponse {
  export type GetEmergencyCenterList = ErEmergencyCenter.GetEmergencyCenterListQueryReturn;
}

export namespace ErDepartmentResponse {
  export type UpdateAvailableDepartment = ErDepartment.UpdateAvailableDepartmentReturn;
  export type GetDepartmentStatusListDto = ErDepartment.GetDepartmentStatusListReturn;
}

export namespace ErEquipmentResponse {
  export type GetEquipmentStatus = ErEquipment.GetEquipmentStatusReturn;
  export type UpdateEquipmentStatus = ErEquipment.UpdateEquipmentStatusReturn;
}
