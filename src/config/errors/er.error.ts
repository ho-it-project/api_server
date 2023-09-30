import { HttpStatus } from '@nestjs/common';
import { ERROR } from '.';

export namespace ER_EMPLOYEE_ERROR {
  export interface EMPLOYEE_MULTIPLE_ALREADY_EXIST
    extends ERROR<'EMPLOYEE_MULTIPLE_ALREADY_EXIST', HttpStatus.BAD_REQUEST> {}

  export interface EMPLOYEE_NOT_FOUND extends ERROR<"Employee doesn't exist", HttpStatus.BAD_REQUEST> {}
  export interface EMPLOYEE_PASSWORD_INVALID extends ERROR<'Password is invalid', HttpStatus.BAD_REQUEST> {}
  export interface EMPLOYEE_PASSWORD_SAME extends ERROR<'Password is same', HttpStatus.BAD_REQUEST> {}
}
