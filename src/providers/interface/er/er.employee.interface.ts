import {
  er_Department,
  er_DoctorSpecialization,
  er_Employee,
  er_EmployeeDoctorSpecialization,
  er_EmployeeNurseSpecialization,
  er_NurseSpecialization,
} from '@prisma/client';
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
  export type GetEmpoyeeWithoutPassword = Omit<er_Employee, 'password'> & {
    employee_doctor_specializations?: (er_EmployeeDoctorSpecialization & {
      doctor_specialization: er_DoctorSpecialization;
    })[];
    employee_nurse_specializations?: (er_EmployeeNurseSpecialization & {
      nurse_specialization: er_NurseSpecialization;
    })[];
    department?: er_Department;
  };
}
