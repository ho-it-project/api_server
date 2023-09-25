import { ERROR } from '..';

export namespace ER_EMERGENCY_CENTER_ERROR {
  export type EMERGENCY_CENTER_NOT_FOUND = ERROR<"Emergency center doesn't exist">;
  export const EMERGENCY_CENTER_NOT_FOUND: EMERGENCY_CENTER_NOT_FOUND = {
    message: "Emergency center doesn't exist",
    is_success: false,
  } as const;
}
