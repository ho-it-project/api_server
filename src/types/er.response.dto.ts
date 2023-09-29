import { er_Employee } from '@prisma/client';
import { ErEmergencyCenter } from '@src/providers/interface/er/er.emergencyCenter.interface';
import { ErEmployee } from '@src/providers/interface/er/er.employee.interface';
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
  export type GetEmployeeList = ErEmployee.GetEmployeeListQueryReturn;

  export interface UpdatePassword {
    update_success: boolean;
  }
}

export namespace ErEmergencyCenterResponse {
  export type GetEmergencyCenterList = ErEmergencyCenter.GetEmergencyCenterListQueryReturn;
}
