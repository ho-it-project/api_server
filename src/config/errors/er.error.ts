import { HttpStatus } from '@nestjs/common';
import typia from 'typia';
import { ERROR } from '.';

export namespace ER_ERROR {
  export interface ER_NOT_FOUND extends ERROR<"ER doesn't exist", HttpStatus.NOT_FOUND> {}
}
export namespace ER_EMPLOYEE_ERROR {
  export interface EMPLOYEE_MULTIPLE_ALREADY_EXIST
    extends ERROR<'EMPLOYEE_MULTIPLE_ALREADY_EXIST', HttpStatus.BAD_REQUEST> {}

  export interface EMPLOYEE_NOT_FOUND extends ERROR<"Employee doesn't exist", HttpStatus.BAD_REQUEST> {}
  export interface EMPLOYEE_PASSWORD_INVALID extends ERROR<'Password is invalid', HttpStatus.BAD_REQUEST> {}
  export interface EMPLOYEE_PASSWORD_SAME extends ERROR<'Password is same', HttpStatus.BAD_REQUEST> {}
  export interface EMPLOYEE_ROLE_SPECIALIZATION_NOT_MATCH
    extends ERROR<'Role and specialization not match', HttpStatus.BAD_REQUEST> {}
}

export namespace ER_DEPARTMENT_ERROR {
  export interface DEPARTMENT_NOT_EXIST extends ERROR<"Department doesn't exist: ", HttpStatus.BAD_REQUEST> {}
  export const departmentNotExist = typia.random<DEPARTMENT_NOT_EXIST>();

  export interface DEPARTMENT_INVALID extends ERROR<'Department is invalid', HttpStatus.BAD_REQUEST> {}
}

export namespace ER_EMERGENCY_CENTER_ERROR {
  export interface EMERGENCY_CENTER_QUERY_INVAILD
    extends ERROR<'hospital_id or (latitude, longitude) is required', HttpStatus.BAD_REQUEST> {}

  export interface EMERGENCY_CENTER_NOT_FOUND extends ERROR<"Emergency center doesn't exist", HttpStatus.NOT_FOUND> {}

  export interface EMERGENCY_ROOM_NOT_FOUND extends ERROR<"Emergency room doesn't exist", HttpStatus.NOT_FOUND> {}
  export interface EMERGENCY_BED_NOT_FOUND extends ERROR<"Emergency bed doesn't exist", HttpStatus.NOT_FOUND> {}
  export interface EMERGENCY_ROOM_BED_NOT_AVAILABLE
    extends ERROR<'Emergency room bed is not available', HttpStatus.BAD_REQUEST> {}
  export interface PATIENT_NOT_EXIST extends ERROR<"Patient doesn't exist", HttpStatus.BAD_REQUEST> {}
  export interface PATIENT_ALREADY_ASSIGNED extends ERROR<'Patient already assigned', HttpStatus.BAD_REQUEST> {}
  export interface EMERGENCY_BED_NOT_OCCUPIED extends ERROR<'Emergency bed is not occupied', HttpStatus.BAD_REQUEST> {}
}

export namespace ER_EQUIPMENT_ERROR {
  export interface EQUIPMENT_NOT_EXIST extends ERROR<'Equipment not exist: ', HttpStatus.BAD_REQUEST> {}
  export const equipmentNotExist = typia.random<EQUIPMENT_NOT_EXIST>();

  export interface HOSPITAL_INVALID extends ERROR<'Hospital is invalid', HttpStatus.BAD_REQUEST> {}
  export const hospitalInvalid = typia.random<HOSPITAL_INVALID>();
}

export namespace ER_ILLNESS_ERROR {
  export interface ILLNESS_NOT_EXIST extends ERROR<'Illness not exist: ', HttpStatus.BAD_REQUEST> {}
  export const illnessNotExist = typia.random<ILLNESS_NOT_EXIST>();

  export interface HOSPITAL_INVALID extends ERROR<'Hospital is invalid', HttpStatus.BAD_REQUEST> {}
  export const hospitalInvalid = typia.random<HOSPITAL_INVALID>();
}

export namespace ER_PATIENT_ERROR {
  export interface PATIENT_NOT_EXIST extends ERROR<'Patient not exist: ', HttpStatus.BAD_REQUEST> {}
  export interface NURCE_NOT_EXIST extends ERROR<'Nurce not exist: ', HttpStatus.BAD_REQUEST> {}
  export interface DOCTOR_NOT_EXIST extends ERROR<'Doctor not exist: ', HttpStatus.BAD_REQUEST> {}
  export interface EMERGENCY_ROOM_NOT_EXIST extends ERROR<'Emergency room not exist: ', HttpStatus.BAD_REQUEST> {}
  export interface EMERGENCY_BED_NOT_EXIST extends ERROR<'Emergency bed not exist: ', HttpStatus.BAD_REQUEST> {}
  export interface EMERGENCY_BED_ALREADY_EXIST extends ERROR<'Emergency bed already exist: ', HttpStatus.BAD_REQUEST> {}
}
