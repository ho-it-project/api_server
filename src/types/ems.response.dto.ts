import { ems_Ambulance, ems_AmbulanceCompany, ems_AmbulanceEmployee, ems_Employee } from '@prisma/client';
import { EmsAuth } from '@src/auth/interface';
import { EmsAmbulanceCompany } from '@src/providers/interface/ems/ems.ambulanceCompany.interface';
import { EmsPatient } from '@src/providers/interface/ems/ems.patient.interface';
import { EmsEmployee } from './../providers/interface/ems/ems.employee.interface';

export namespace EmsAuthResponse {
  export interface Login {
    /**
     * 로그인 성공 여부
     * @type boolean
     * @title 로그인 성공 여부
     */
    is_login: boolean;
    /**
     * 로그인한 직원 정보
     * @type EmsAuth.AccessTokenSignPayload
     * @title 로그인한 직원 정보
     */
    employee: EmsAuth.AccessTokenSignPayload;
    /**
     * access_token
     * @type string
     * @title access_token
     */
    access_token: string;
  }
  export interface Logout {
    is_login: false;
  }

  export interface CheckAuthStatus {
    is_login: boolean;
    employee: EmsAuth.AccessTokenSignPayload | null;
    access_token: string | null;
  }
}

export namespace EmsEmployeeResponse {
  export interface CreateManyEmployee {
    /**
     * 생성된 직원의 수
     * @type number
     * @title 생성된 직원의 수
     */
    count: number;
  }

  export interface CheckManyEmployeeExist {
    /**
     * 존재하는 직원의 수
     * @type number
     * @title 존재하는 직원의 수
     */
    exists: Pick<ems_Employee, 'id_card'>[];
  }
  export interface UpdatePassword {
    update_success: boolean;
  }

  export interface GetEmployeeList {
    /**
     * 직원 리스트
     * @type ems_Employee[]
     * @title 직원 리스트
     */
    employee_list: Omit<ems_Employee, 'password'>[];
    /**
     * 직원 수
     * @type number
     * @title 직원 수
     */
    count: number;
  }
  export interface GetEmployeeDetail extends Omit<EmsEmployee.GetEmployeeDetailReturn, 'password'> {}
}

export namespace EmsAmbulanceCompanyResponse {
  export interface GetAmbulanceCompanyList {
    ambulance_company_list: ems_AmbulanceCompany[];
    count: number;
  }

  export interface GetAmbulanceCompanyDetail extends EmsAmbulanceCompany.GetAmbulanceCompanyDetailReturn {}
}

export namespace EmsAmbulanceResponse {
  export interface GetAmbulanceDetail extends ems_Ambulance {
    ambulance_company: ems_AmbulanceCompany;
    employees: (ems_AmbulanceEmployee & {
      employee: Pick<ems_Employee, 'employee_id' | 'employee_name' | 'id_card' | 'role'>;
    })[];
  }
}

export namespace EmsPatientResponse {
  // export interface GetPatientList {
  //   patient_list: ems_Patient[];
  //   count: number;
  // }

  export interface CreatePatient {
    patient_id: string;
  }

  export interface GetPatientDetail extends EmsPatient.GetPatientDetailReturn {}

  export interface GetPatientList extends EmsPatient.GetPatientListReturn {}
}
