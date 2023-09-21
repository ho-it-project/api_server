import { er_EmployeeRole } from '@prisma/client';

export namespace Auth {
  export interface ComparePassword {
    password: string;
    hash: string;
  }

  export interface HashPassword {
    password: string;
  }

  export interface AccessTokenSignPayload {
    emergency_center_id: string;
    employee_id: string;
    id_card: string;
    role: er_EmployeeRole;
  }

  export interface AccessTokenVerify {
    access_token: string;
  }

  export interface RefreshTokenSignPayload {
    emergency_center_id: string;
    employee_id: string;
    id_card: string;
  }

  export interface RefreshTokenVerify {
    refresh_token: string;
  }
  export interface LoginReturn {
    access_token: string;
    refresh_token: string;
    employee: Auth.AccessTokenSignPayload;
  }
}
