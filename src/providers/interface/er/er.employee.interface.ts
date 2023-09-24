import { Auth } from '@src/auth/interface/auth.interface';
import { EmployeeRequest } from '@src/types';

export namespace ErEmployee {
  export type CreateManyEmployee = EmployeeRequest.CreateManyDTO & { user: Auth.AccessTokenSignPayload };
  export type CheckEmployeeExist = { id_card: string; hospital_id: string };
  export type CheckManyEmployeeExist = { id_cards: string[]; hospital_id: string };
  export type UpdatePassword = { hospital_id: string; id_card: string; password: string; now_password: string };
  export type GetEmployeeList = { query: EmployeeRequest.GetEmployeeListQuery } & { user: Auth.AccessTokenSignPayload };
}
