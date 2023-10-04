import { ERROR } from '@config/errors';
import { ErrorHttpStatusCode } from '@nestjs/common/utils/http-error-by-code.util';

export * from './er.request.dto';
export * from './er.response.dto';

export interface ResponseDTO<T> {
  /**
   * @type T
   * @description 요청에 대한 응답
   */
  result: T;

  /**
   * @type true
   * @description 요청이 성공했는지 여부
   */
  is_success: true;
  /**
   * @type number
   * @description 요청부터 응답까지 걸린 시간
   */
  request_to_response?: number;

  /**
   * @type string
   * @description 요청에 대한 메시지
   */
  message: string;
}

export type Try<T> = ResponseDTO<T>;
export type TryCatch<T, E extends ERROR<string, ErrorHttpStatusCode>> = Try<T> | E;

export type ArrayElement<T extends unknown[]> = T[number];
