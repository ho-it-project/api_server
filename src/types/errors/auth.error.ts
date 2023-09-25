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

  export type FORBIDDEN = ERROR<'Forbidden'>;
  export const FORBIDDEN: FORBIDDEN = {
    message: 'Forbidden',
    is_success: false,
  } as const;

  export type ACCESS_TOKEN_FAILURE = ERROR<'ACCESS_TOKEN_FAILURE'>;
  export const ACCESS_TOKEN_FAILURE: ACCESS_TOKEN_FAILURE = {
    message: 'ACCESS_TOKEN_FAILURE',
    is_success: false,
  } as const;

  export type REFRESH_TOKEN_FAILURE = ERROR<'REFRESH_TOKEN_FAILURE'>;
  export const REFRESH_TOKEN_FAILURE: REFRESH_TOKEN_FAILURE = {
    message: 'REFRESH_TOKEN_FAILURE',
    is_success: false,
  };
}
