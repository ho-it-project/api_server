import { er_Employee } from '@prisma/client';
import { ErEmergencyCenter } from '@src/providers/interface/er/er.emergencyCenter.interface';
import { ErEmployee } from '@src/providers/interface/er/er.employee.interface';
import { Auth } from './../auth/interface/auth.interface';
export namespace AuthResponse {
  export interface Login {
    is_login: boolean;
    employee: Auth.AccessTokenSignPayload;
  }

  export interface CheckAuthStatus {
    is_login: boolean;
    employee: Auth.AccessTokenSignPayload | null;
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
