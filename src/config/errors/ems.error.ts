import { HttpStatus } from '@nestjs/common';
import { ERROR } from '.';

export namespace EMS_EMPLOYEE_ERROR {
  export type EMPLOYEE_MULTIPLE_ALREADY_EXIST = ERROR<'EMPLOYEE_MULTIPLE_ALREADY_EXIST', HttpStatus.BAD_REQUEST>;
}
