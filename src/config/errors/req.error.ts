import { HttpStatus } from '@nestjs/common';
import { EMS_PATIENT_ERROR, ERROR } from '.';

export namespace REQ_EMS_TO_ER_ERROR {
  export interface PENDING_PATIENT_NOT_FOUND extends EMS_PATIENT_ERROR.PATIENT_NOT_FOUND {}
  export interface REQUESTED_PATIENT_NOT_FOUND extends ERROR<'REQUESTED_PATIENT_NOT_FOUND', HttpStatus.NOT_FOUND> {}
  export interface REQUEST_ALREADY_PROCESSED extends ERROR<'REQUEST_ALREADY_PROCESSED', HttpStatus.BAD_REQUEST> {}
  export interface REQUEST_NOT_FOUND extends ERROR<'REQUEST_NOT_FOUND', HttpStatus.NOT_FOUND> {}
}
