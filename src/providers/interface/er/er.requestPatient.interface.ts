import {
  ems_ABCDE_Assessment,
  ems_DCAP_BTLS_Assessment,
  ems_Guardian,
  ems_OPQRST_Assessment,
  ems_Patient,
  ems_Rapid_Asscessment,
  ems_SAMPLE_Assessment,
  ems_VS_Assessment,
} from '@prisma/client';

export namespace ErRequestPatient {
  export interface GetRequestedPatient {
    patient: ems_Patient & {
      rapid: ems_Rapid_Asscessment[];
      abcde: ems_ABCDE_Assessment[];
      vs: ems_VS_Assessment[];
      opqrst: ems_OPQRST_Assessment[];
      sample: ems_SAMPLE_Assessment[];
      dcap_btls: ems_DCAP_BTLS_Assessment[];
      guardian: ems_Guardian | null;
      employee: {
        employee_id: string;
        employee_name: string;
        ambulance_company: {
          ambulance_company_name: string;
          ambulance_company_id: string;
          ambulance_company_phone: string;
        };
      };
    };
  }
}
