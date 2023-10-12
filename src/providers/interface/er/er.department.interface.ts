import { ER_DEPARTMENT_ERROR } from '@config/errors';
import { er_Department } from '@prisma/client';
import { ErAuth } from '@src/auth/interface';
import { ErDepartmentRequest, Extract_, HttpStatusKey } from '@src/types';

export namespace ErDepartment {
  export type DepartmentReturn = Pick<er_Department, 'department_id' | 'department_name'> & {
    status: er_Department['status'];
  };

  export interface UpdateAvailableDepartmentArg {
    user: ErAuth.AccessTokenSignPayload;
    data: ErDepartmentRequest.UpdateAvailableDepartmentDto;
  }

  // export type UpdateResponseDto<T> = {
  //   data?: T;
  //   status: ERROR<string, number> | 'SUCCESS';
  // };

  export type UpdateAvailableDepartmentReturn =
    | ER_DEPARTMENT_ERROR.DEPARTMENT_NOT_EXIST
    | Pick<er_Department, 'department_id' | 'department_name' | 'status'>[];

  export interface RemoveAvailableDepartmentArg {
    user: ErAuth.AccessTokenSignPayload;
    department_id: er_Department['department_id'];
  }
  export type RemoveAvailableDepartmentReturn =
    | ER_DEPARTMENT_ERROR.DEPARTMENT_NOT_EXIST
    | Extract_<HttpStatusKey, 'NO_CONTENT'>;

  export type GetFullDepartmentListArg = '';
  export type GetFullDepartmentListReturn = Array<
    DepartmentReturn & {
      sub_departments?: DepartmentReturn[];
    }
  >;

  export type GetDepartmentStatusListArg = { user: ErAuth.AccessTokenSignPayload };
  export type GetDepartmentStatusListReturn = GetFullDepartmentListReturn;
}