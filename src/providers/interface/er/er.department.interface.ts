import { ER_DEPARTMENT_ERROR } from '@config/errors';
import { Prisma, er_Department } from '@prisma/client';
import { ErAuth } from '@src/auth/interface';
import { Extract_, HttpStatusKey } from '@src/types';

export namespace ErDepartmentI {
  export interface AddAvailableDepartmentRequest {
    user: ErAuth.AccessTokenSignPayload;
    department_id: er_Department['department_id'];
  }
  export type AddAvailableDepartmentResponse =
    | ER_DEPARTMENT_ERROR.DEPARTMENT_NOT_EXIST
    | Pick<er_Department, 'department_id' | 'department_name' | 'parent_department_id'>;

  export interface RemoveAvailableDepartmentRequest {
    user: ErAuth.AccessTokenSignPayload;
    department_id: er_Department['department_id'];
  }
  export type RemoveAvailableDepartmentResponse =
    | ER_DEPARTMENT_ERROR.DEPARTMENT_NOT_EXIST
    | Extract_<HttpStatusKey, 'NO_CONTENT'>;

  export type GetFullDepartmentListRequest = '';
  export type GetFullDepartmentListReturn = Pick<
    Prisma.er_DepartmentGetPayload<{
      include: { sub_departments: { select: { department_id: true; department_name: true } } };
    }>,
    'department_id' | 'department_name' | 'sub_departments'
  >[];

  export type GetDepartmentStatusListRequest = { user: ErAuth.AccessTokenSignPayload };
  export type GetDepartmentStatusListReturn = Pick<
    er_Department,
    'department_id' | 'department_name' | 'parent_department_id'
  >[];
}
