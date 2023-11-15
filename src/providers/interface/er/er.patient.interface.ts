import { Gender, Status, ems_GuardianRelation, er_Guardian } from '@prisma/client';
import { ErAuth } from '@src/auth/interface';

export namespace ErPatient {
  export interface CreatePatient {
    user: ErAuth.AccessTokenSignPayload;
    patient_info: {
      patient_name: string;
      patient_gender: Gender;
      patient_birth: string;
      patient_identity_number: string;

      patient_phone: string;
      patient_address: string;
      guardian?: {
        guardian_name: string;
        guardian_phone: string;
        guardian_address: string;
        guardian_relation: ems_GuardianRelation;
      };
      doctor_id: string;
      nurse_id: string;
    };
  }

  export interface CreatePatientReturn {
    patient_id: string;
    patient_name: string;
    patient_birth: string;
    patient_identity_number: string;
    patient_gender: Gender;
    patient_phone: string;
    patient_address: string;
    guardian_id: string | null;
    doctor_id: string;
    nurse_id: string;
    created_at: Date;
    updated_at: Date;
    status: Status;
    guardian: er_Guardian | null;
  }
}
