import { EmsAuth } from '@src/auth/interface';
import { EmsEmployeeRequest } from '@src/types/ems.request.dto';
export namespace EmsEmployee {
  export type CreateManyEmployee = EmsEmployeeRequest.CreateManyDTO & { user: EmsAuth.AccessTokenSignPayload };
  export type CheckManyEmployeeExist = { id_cards: string[]; ambulance_company_id: string };
  export type CheckEmployeeExist = { id_cards: string; ambulance_company_id: string };
  export type GetEmployeeList = { user: EmsAuth.AccessTokenSignPayload } & {
    query: EmsEmployeeRequest.GetEmployeeListQuery;
  };
}
