import { Auth } from './../auth/interface/auth.interface';
export namespace AuthResponse {
  export interface Login {
    is_login: boolean;
    employee: Auth.AccessTokenSignPayload;
  }

  export interface CheckAuthStatus {
    is_login: boolean;
    employee: Auth.AccessTokenSignPayload | null;
  }
}
