import { Auth } from '@src/auth/interface/auth.interface';
import { EmployeeRequest } from '@src/types';

export namespace ErEmployee {
  export type CreateManyEmployee = EmployeeRequest.createManyDTO & { user: Auth.AccessTokenSignPayload };
}
