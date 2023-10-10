import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorHttpStatusCode } from '@nestjs/common/utils/http-error-by-code.util';

export interface ERROR<T extends string, H extends ErrorHttpStatusCode> {
  /**
   * @type string
   * @description 에러 메시지
   */
  message: T;

  /**
   * @type false
   * @description 에러 여부
   */
  is_success: false;

  /**
   * @type number
   * @description http 상태 코드
   */
  http_status_code: H;
}

export const isError = (error: any): error is ERROR<string, ErrorHttpStatusCode> => {
  if (error?.is_success === false && HttpStatus[error?.http_status_code]) {
    return true;
  }
  return false;
};

export const createError = (error: ERROR<string, ErrorHttpStatusCode>) => {
  return new HttpException(error, error.http_status_code);
};

export const throwError = (error: ERROR<string, ErrorHttpStatusCode>) => {
  throw createError(error);
};

export * from './auth.error';
export * from './ems.error';
export * from './er.error';
