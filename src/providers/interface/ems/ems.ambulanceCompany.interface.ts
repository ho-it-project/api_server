import { Status, ems_AmbulanceType, ems_EmployeeRole } from '@prisma/client';

export namespace EmsAmbulanceCompany {
  export type GetAmbulanceCompanyDetailReturn = {
    ambulances: {
      employees: {
        ambulance_id: string;
        employee_id: string;
        created_at: Date;
        status: Status;
        updated_at: Date;
        employee: {
          employee_id: string;
          employee_name: string;
          role: ems_EmployeeRole;
        };
      }[];
      ambulance_id: string;
      ambulance_company_id: string;
      ambulance_type: ems_AmbulanceType;
      ambulance_number: string;
      created_at: Date;
      updated_at: Date;
      status: Status;
    }[];

    ambulance_company_id: string;
    ambulance_company_name: string;
    ambulance_company_representative: string | null;
    ambulance_company_area: string;
    ambulance_company_address: string | null;
    ambulance_company_phone: string;
    created_at: Date;
    updated_at: Date;
    status: Status;
  };
}
