import { ErAuth } from '@src/auth/interface';
import { EmsAuth } from './ems.auth.interface';

export namespace Auth {
  export interface ComparePassword {
    password: string;
    hash: string;
  }

  export interface HashPassword {
    password: string;
  }

  export interface AccessTokenVerify {
    access_token: string;
  }

  export interface RefreshTokenVerify {
    refresh_token: string;
  }

  export type AccessTokenSignPayload = EmsAuth.AccessTokenSignPayload | ErAuth.AccessTokenSignPayload;
  export type CommonPayload =
    | (EmsAuth.AccessTokenSignPayload & { _type: 'EMS' })
    | (ErAuth.AccessTokenSignPayload & { _type: 'ER' });
}
