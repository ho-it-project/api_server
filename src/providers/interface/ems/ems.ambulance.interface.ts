import { EMS_AMBULANCE_ERROR } from '@config/errors';
import { Status, ems_EmployeeRole } from '@prisma/client';
import { EmsAuth } from '@src/auth/interface';
import { EmsAmbulanceRequest } from '@src/types';
export namespace EmsAbulance {
  export type GetEmployeeManyWithAmbulance =
    | ({
        ambulances: {
          ambulance_id: string;
          employee_id: string;
          created_at: Date;
          status: Status;
          updated_at: Date;
        }[];
      } & {
        employee_id: string;
        ambulance_company_id: string;
        employee_name: string;
        role: ems_EmployeeRole;
        id_card: string;
        password: string;
        created_at: Date;
        updated_at: Date;
        status: Status;
      })[]
    | EMS_AMBULANCE_ERROR.EMPLOYEE_NOT_FOUND;

  export type SetAmbulanceEmployees = {
    ambulance_id: string;
    removal_employee_list?: EmsAmbulanceRequest.RemoveEmployeeDTO[];
    additional_employee_list?: EmsAmbulanceRequest.AddEmployeeDTO[];
    user: EmsAuth.AccessTokenSignPayload;
  };
}
