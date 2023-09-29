import { ems_EmployeeRole } from '@prisma/client';

export namespace EmsAuth {
  export interface AccessTokenSignPayload {
    ambulance_company_id: string;
    employee_id: string;
    id_card: string;
    role: ems_EmployeeRole;
  }

  export interface RefreshTokenSignPayload {
    ambulance_company_id: string;
    employee_id: string;
    id_card: string;
  }

  export interface LoginReturn {
    access_token: string;
    refresh_token: string;
    employee: AccessTokenSignPayload;
  }
}
