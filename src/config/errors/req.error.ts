import { HttpStatus } from '@nestjs/common';
import { ERROR } from '.';

export namespace REQ_EMS_TO_ER_ERROR {
  export interface PENDING_PATIENT_NOT_FOUND extends ERROR<'PENDING_PATIENT_NOT_FOUND', HttpStatus.NOT_FOUND> {}
  export interface REQUEST_ALREADY_PROCESSED extends ERROR<'REQUEST_ALREADY_PROCESSED', HttpStatus.BAD_REQUEST> {}
  export interface AMBULANCE_COMPANY_NOT_FOUND extends ERROR<'AMBULANCE_COMPANY_NOT_FOUND', HttpStatus.NOT_FOUND> {}
}
