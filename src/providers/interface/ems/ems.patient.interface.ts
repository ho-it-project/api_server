import {
  ems_ABCDE_Assessment,
  ems_DCAP_BTLS_Assessment,
  ems_Guardian,
  ems_OPQRST_Assessment,
  ems_Patient,
  ems_SAMPLE_Assessment,
  ems_VS_Assessment,
} from '@prisma/client';
import { EmsAuth } from '@src/auth/interface';
import { EmsPatientRequest } from '@src/types/ems.request.dto';

export namespace EmsPatient {
  export type CreatePatientDTO = {
    patientInfo: EmsPatientRequest.CreatePatientDTO;
    user: EmsAuth.AccessTokenSignPayload;
  };

  export interface GetPatientDetailReturn extends ems_Patient {
    guardian: ems_Guardian | null;
    abcde: ems_ABCDE_Assessment[];
    dcap_btls: ems_DCAP_BTLS_Assessment[];
    vs: ems_VS_Assessment[];
    sample: ems_SAMPLE_Assessment[];
    opqrst: ems_OPQRST_Assessment[];
  }
}
