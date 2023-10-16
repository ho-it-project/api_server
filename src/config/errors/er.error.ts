import { HttpStatus } from '@nestjs/common';
import typia from 'typia';
import { ERROR } from '.';

export namespace ER_EMPLOYEE_ERROR {
  export interface EMPLOYEE_MULTIPLE_ALREADY_EXIST
    extends ERROR<'EMPLOYEE_MULTIPLE_ALREADY_EXIST', HttpStatus.BAD_REQUEST> {}

  export interface EMPLOYEE_NOT_FOUND extends ERROR<"Employee doesn't exist", HttpStatus.BAD_REQUEST> {}
  export interface EMPLOYEE_PASSWORD_INVALID extends ERROR<'Password is invalid', HttpStatus.BAD_REQUEST> {}
  export interface EMPLOYEE_PASSWORD_SAME extends ERROR<'Password is same', HttpStatus.BAD_REQUEST> {}
}

export namespace ER_DEPARTMENT_ERROR {
  export interface DEPARTMENT_NOT_EXIST extends ERROR<"Department doesn't exist: ", HttpStatus.BAD_REQUEST> {}
  export const departmentNotExist = typia.random<DEPARTMENT_NOT_EXIST>();
}

export namespace ER_EMERGENCY_CENTER_ERROR {
  export interface EMERGENCY_CENTER_QUERY_INVAILD
    extends ERROR<'hospital_id or (latitude, longitude) is required', HttpStatus.BAD_REQUEST> {}
}

export namespace ER_EQUIPMENT_ERROR {
  export interface EQUIPMENT_NOT_EXIST extends ERROR<'Equipment not exist: ', HttpStatus.BAD_REQUEST> {}
  export const equipmentNotExist = typia.random<EQUIPMENT_NOT_EXIST>();
}

export namespace ER_ILLNESS_ERROR {
  export interface ILLNESS_NOT_EXIST extends ERROR<'Illness not exist: ', HttpStatus.BAD_REQUEST> {}
  export const illnessNotExist = typia.random<ILLNESS_NOT_EXIST>();
}
