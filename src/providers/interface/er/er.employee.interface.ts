import { er_Employee } from '@prisma/client';
import { ErAuth } from '@src/auth/interface/er.auth.interface';
import { ErEmployeeRequest } from '@src/types';

export namespace ErEmployee {
  export type CreateManyEmployee = ErEmployeeRequest.CreateManyDTO & { user: ErAuth.AccessTokenSignPayload };
  export type CheckEmployeeExist = { id_card: string; hospital_id: string };
  export type CheckManyEmployeeExist = { id_cards: string[]; hospital_id: string };

  export type UpdatePassword = { hospital_id: string; id_card: string; password: string; now_password: string };

  export type GetEmployeeList = { query: ErEmployeeRequest.GetEmployeeListQuery } & {
    user: ErAuth.AccessTokenSignPayload;
  };
  export type GetEmpoyeeWithoutPassword = Omit<er_Employee, 'password'>;
  export type GetEmployeeListQueryReturn = { count: number } & { employee_list: GetEmpoyeeWithoutPassword[] };
}
