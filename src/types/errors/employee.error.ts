import { ERROR } from '..';

export namespace EMPLOYEE_ERROR {
  export type EMPLOYEE_NOT_FOUND = ERROR<"Employee doesn't exist">;
  export const EMPLOYEE_NOT_FOUND: EMPLOYEE_NOT_FOUND = {
    message: "Employee doesn't exist",
    is_success: false,
  } as const;

  export type EMPLOYEE_ALREADY_EXIST = ERROR<'Employee already exist'>;
  export const EMPLOYEE_ALREADY_EXIST: EMPLOYEE_ALREADY_EXIST = {
    message: 'Employee already exist',
    is_success: false,
  } as const;

  export type EMPLOYEE_NOT_FOUND_IN_EMERGENCY_CENTER = ERROR<'Employee not found in emergency center'>;
  export const EMPLOYEE_NOT_FOUND_IN_EMERGENCY_CENTER: EMPLOYEE_NOT_FOUND_IN_EMERGENCY_CENTER = {
    message: 'Employee not found in emergency center',
    is_success: false,
  } as const;

  export type EMPLOYEE_MULTIPLE_ALREADY_EXIST = (
    id_cards: string[],
  ) => ERROR<`Employee already exists with id_card: ${string}`>;
  export const EMPLOYEE_MULTIPLE_ALREADY_EXIST: EMPLOYEE_MULTIPLE_ALREADY_EXIST = (id_cards) => ({
    message: `Employee already exists with id_card: ${id_cards.join(', ')}`,
    is_success: false,
  });

  export type EMPLOYEE_PASSWORD_INVALID = ERROR<'Employee password invalid'>;
  export const EMPLOYEE_PASSWORD_INVALID: EMPLOYEE_PASSWORD_INVALID = {
    message: 'Employee password invalid',
    is_success: false,
  } as const;
}
