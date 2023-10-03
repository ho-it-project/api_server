import { HttpStatus } from '@nestjs/common';
import { ERROR } from '.';
import typia from 'typia';

export namespace ER_EMPLOYEE_ERROR {
  export interface EMPLOYEE_MULTIPLE_ALREADY_EXIST
    extends ERROR<'EMPLOYEE_MULTIPLE_ALREADY_EXIST', HttpStatus.BAD_REQUEST> {}

  export interface EMPLOYEE_NOT_FOUND extends ERROR<"Employee doesn't exist", HttpStatus.BAD_REQUEST> {}
  export interface EMPLOYEE_PASSWORD_INVALID extends ERROR<'Password is invalid', HttpStatus.BAD_REQUEST> {}
  export interface EMPLOYEE_PASSWORD_SAME extends ERROR<'Password is same', HttpStatus.BAD_REQUEST> {}
}

export namespace ER_DEPARTMENT_ERROR {
  export interface DEPARTMENT_NOT_EXIST extends ERROR<'해당 진료과가 존재하지 않습니다.', HttpStatus.BAD_REQUEST> {}
  export const departmentNotExist = typia.random<DEPARTMENT_NOT_EXIST>();
}
