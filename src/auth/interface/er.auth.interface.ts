import { er_EmployeeRole } from '@prisma/client';

export namespace ErAuth {
  export interface AccessTokenSignPayload {
    hospital_id: string;
    emergency_center_id: string;
    employee_id: string;
    id_card: string;
    role: er_EmployeeRole;
  }

  export interface RefreshTokenSignPayload {
    hospital_id: string;
    emergency_center_id: string;
    employee_id: string;
    id_card: string;
  }

  export interface LoginReturn {
    access_token: string;
    refresh_token: string;
    employee: AccessTokenSignPayload;
  }
}
