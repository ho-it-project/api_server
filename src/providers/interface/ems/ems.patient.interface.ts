import { EmsAuth } from '@src/auth/interface';
import { EmsPatientRequest } from '@src/types/ems.request.dto';

export namespace EmsPatient {
  export type CreatePatientDTO = {
    patientInfo: EmsPatientRequest.CreatePatientDTO;
    user: EmsAuth.AccessTokenSignPayload;
  };
}
