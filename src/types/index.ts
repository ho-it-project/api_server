export * from './request.dto';
export * from './response.dto';

export interface TestBody2 {
  // test: TestBody;
}
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
  requestToResponse?: number;

  /**
   * @type string
   * @description 요청에 대한 메시지
   */
  message: string;
}

export type Try<T> = ResponseDTO<T>;
export type TryCatch<T, E extends ErrorDTO> = Try<T> | E;

export type ErrorDTO = { message: string; is_success: false };
export interface ERROR<T extends string> {
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
}
