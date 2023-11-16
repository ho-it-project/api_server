import { EMS_AMBULANCE_ERROR } from '@config/errors';
import { Status, ems_EmployeeRole } from '@prisma/client';
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
}
