import { HttpStatus } from '@nestjs/common';
import { ERROR } from '.';

export namespace AUTH_ERROR {
  export interface EMPLOYEE_NOT_FOUND extends ERROR<"Employee doesn't exist", HttpStatus.BAD_REQUEST> {}
  export interface PASSWORD_INCORRECT extends ERROR<'Password is incorrect', HttpStatus.BAD_REQUEST> {}
  export interface FORBIDDEN extends ERROR<'Forbidden', HttpStatus.FORBIDDEN> {}
  export interface ACCESS_TOKEN_FAILURE extends ERROR<'ACCESS_TOKEN_FAILURE', HttpStatus.UNAUTHORIZED> {}
  export interface REFRESH_TOKEN_FAILURE extends ERROR<'REFRESH_TOKEN_FAILURE', HttpStatus.UNAUTHORIZED> {}
  export interface REFRESH_TOKEN_INVALID extends ERROR<'REFRESH_TOKEN_INVALID', HttpStatus.UNAUTHORIZED> {}
}
