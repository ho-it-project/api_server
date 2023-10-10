import { ERROR } from '@config/errors';
import { HttpStatus } from '@nestjs/common';
import { ErrorHttpStatusCode } from '@nestjs/common/utils/http-error-by-code.util';

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
export type TryCatch<T, E extends ERROR<string, ErrorHttpStatusCode>> = E extends any ? ResponseDTO<T> : ResponseDTO<T>;

export type ArrayElement<T extends unknown[]> = T[number];
export * from './ems.request.dto';
export * from './ems.response.dto';
export * from './er.request.dto';
export * from './er.response.dto';
export * from './req.request.dto';
export * from './req.response.dto';

/**
 * Union of HttpStatus' keys. "OK" | "CONTINUE" | "NO_CONTENTS" |...
 */
export type HttpStatusKey = keyof typeof HttpStatus;
/**
 * HTTP Status type(converted HttpStatus enum)
 *
 * Mostly used in ResponseDto where controller's response body is null.
 *
 * @template T - A generic type that specifies the type of the status message.
 * @note `T` must `extends HttpStatusKey`.
 *
 * @property {T} statusMessage - A property representing the HTTP status message.
 * @property {HttpStatusCode} statusCode - A property representing the HTTP status code.
 */
export type HttpStatus_<T extends HttpStatusKey> = {
  statusMessage: T;
  statusCode: (typeof HttpStatus)[T];
};

/**
 * Extract Utility Type with suggestion on generic U.
 *
 * Result can't be type `never` cause U extends T.
 *
 * @template T - The base type.
 * @template U - Type that suggests possible values.
 *
 * Example usage:
 *
 * ```typescript
 * // Extract possible values from '1' | '2' | '3'
 * // Provide suggestions for U here: ''
 * type extracted = Extract_<'1' | '2' | '3', ''>; // Auto-suggestions: '1', '2', '3'
 * ```
 */
export type Extract_<T, U extends T> = T extends U ? T : never;
