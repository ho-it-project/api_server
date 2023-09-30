import { EmsAuth } from '@src/auth/interface';

export namespace EmsAuthResponse {
  export interface Login {
    /**
     * 로그인 성공 여부
     * @type boolean
     * @title 로그인 성공 여부
     */
    is_login: boolean;
    /**
     * 로그인한 직원 정보
     * @type EmsAuth.AccessTokenSignPayload
     * @title 로그인한 직원 정보
     */
    employee: EmsAuth.AccessTokenSignPayload;
  }
  export interface Logout {
    is_login: false;
  }

  export interface CheckAuthStatus {
    is_login: boolean;
    employee: EmsAuth.AccessTokenSignPayload | null;
  }
}
