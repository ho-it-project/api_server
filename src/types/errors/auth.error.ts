import { ERROR } from '..';

export namespace AUTH_ERROR {
  export type EMPLOYEE_NOT_FOUND = ERROR<"Employee doesn't exist">;
  export const EMPLOYEE_NOT_FOUND: EMPLOYEE_NOT_FOUND = {
    message: "Employee doesn't exist",
    is_success: false,
  } as const;

  export type PASSWORD_INCORRECT = ERROR<'Password is incorrect'>;
  export const PASSWORD_INCORRECT: PASSWORD_INCORRECT = {
    message: 'Password is incorrect',
    is_success: false,
  } as const;
}
