import {
  ems_ABCDE_Assessment,
  ems_DCAP_BTLS_Assessment,
  ems_Guardian,
  ems_OPQRST_Assessment,
  ems_Patient,
  ems_PatientStatus,
  ems_Rapid_Asscessment,
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
    rapid: ems_Rapid_Asscessment[];
  }

  export interface GetPatientListDTO {
    query: EmsPatientRequest.GetPatientListQuery;
    user: EmsAuth.AccessTokenSignPayload;
  }

  // export type GetPatientListReturn = Omit<ems_Patient, 'patient_identity_number'>[];
  export interface GetPatientListReturn {
    patient_list: Omit<ems_Patient, 'patient_identity_number'>[];
    count: number;
  }

  export interface CreateABCDEAssessment {
    patient_id: string;
    ems_employee_id: string;
    abcde_assessment: EmsPatientRequest.CreateABCDEAssessmentDTO;
  }

  export interface CreateDCAP_BTLSAssessment {
    patient_id: string;
    ems_employee_id: string;
    dcap_btls_assessment: EmsPatientRequest.CreateDCAP_BTLSAssessmentDTO;
  }

  export interface CreateVSAssessment {
    patient_id: string;
    ems_employee_id: string;
    vs_assessment: EmsPatientRequest.CreateVSAssessmentDTO;
  }

  export interface CreateSAMPLEAssessment {
    patient_id: string;
    ems_employee_id: string;
    sample_assessment: EmsPatientRequest.CreateSAMPLEAssessmentDTO;
  }

  export interface CreateOPQRSTAssessment {
    patient_id: string;
    ems_employee_id: string;
    opqrst_assessment: EmsPatientRequest.CreateOPQRSTAssessmentDTO;
  }

  export interface CompletePatient {
    user: EmsAuth.AccessTokenSignPayload;
    patient_id: string;
  }

  export interface CanclePatient {
    user: EmsAuth.AccessTokenSignPayload;
    patient_id: string;
  }

  export interface UpdatePatientStatus {
    user: EmsAuth.AccessTokenSignPayload;
    patient_id: string;
    patient_status: ems_PatientStatus;
  }
}
