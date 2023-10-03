import { Prisma, er_Department, er_Employee } from '@prisma/client';
import { ErEmergencyCenter } from '@src/providers/interface/er/er.emergencyCenter.interface';
import { ErAuth } from '../auth/interface/er.auth.interface';
import { HttpStatusKey, HttpStatus_ } from '.';
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
  export type GetDepartmentStatusListDto = Pick<
    er_Department,
    'department_id' | 'department_name' | 'parent_department_id'
  >[];

  export type GetFullDepartmentListDto = Pick<
    Prisma.er_DepartmentGetPayload<{
      include: { sub_departments: { select: { department_id: true; department_name: true } } };
    }>,
    'department_id' | 'department_name' | 'sub_departments'
  >[];

  export type AddAvailableDepartmentDto = Pick<
    er_Department,
    'department_id' | 'department_name' | 'parent_department_id'
  >;

  export type RemoveAvailableDepartmentDto<T extends HttpStatusKey> = HttpStatus_<T>;
}
