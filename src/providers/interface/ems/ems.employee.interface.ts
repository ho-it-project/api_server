import { ems_AmbulanceCompany, ems_Employee } from '@prisma/client';
import { EmsAuth } from '@src/auth/interface';
import { EmsEmployeeRequest } from '@src/types/ems.request.dto';
export namespace EmsEmployee {
  export type CreateManyEmployee = EmsEmployeeRequest.CreateManyDTO & { user: EmsAuth.AccessTokenSignPayload };
  export type CheckManyEmployeeExist = { id_cards: string[]; ambulance_company_id: string };
  export type CheckEmployeeExist = { id_cards: string; ambulance_company_id: string };
  export type GetEmployeeList = { user: EmsAuth.AccessTokenSignPayload } & {
    query: EmsEmployeeRequest.GetEmployeeListQuery;
  };

  export type UpdatePassword = {
    ambulance_company_id: string;
    id_card: string;
    password: string;
    now_password: string;
  };
  export type DeleteEmployee = {
    user: EmsAuth.AccessTokenSignPayload;
    employee_id: string;
  };

  export type GetEmployeeDetailArg = {
    user: EmsAuth.AccessTokenSignPayload;
    employee_id: string;
  };
  export type GetEmployeeDetailReturn = ems_Employee & {
    ambulance_company: ems_AmbulanceCompany;
  };
}
