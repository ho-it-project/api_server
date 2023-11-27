import { Gender, Status, ems_GuardianRelation, er_Guardian, er_PatientLogType, er_PatientStatus } from '@prisma/client';
import { ErAuth } from '@src/auth/interface';
import { ErPatientRequest } from '@src/types';

export namespace ErPatient {
  export interface GetPatientList {
    user: ErAuth.AccessTokenSignPayload;
    query: ErPatientRequest.GetPatientListQuery;
  }

  export interface GetPatientDetail {
    user: ErAuth.AccessTokenSignPayload;
    patient_id: string;
  }

  export interface GetPatientDetailReturn {
    patient: {
      patient_logs: {
        patient_log_id: string;
        patient_id: string;
        log_date: Date;
        log_type: er_PatientLogType;
        log_desc: string;
        employee_id: string;
        created_at: Date;
        updated_at: Date;
        status: Status;
      }[];
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
    };
    patient_id: string;
    hospital_id: string;
    patient_status: er_PatientStatus;
    created_at: Date;
    status: Status;
    updated_at: Date;
  }

  export interface GetPatientListReturn {
    patient_list: ({
      patient: {
        patient_logs: {
          patient_log_id: string;
          patient_id: string;
          log_date: Date;
          log_type: er_PatientLogType;
          log_desc: string;
          employee_id: string;
          created_at: Date;
          updated_at: Date;
          status: Status;
        }[];
      } & {
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
      };
    } & {
      patient_id: string;
      hospital_id: string;
      patient_status: er_PatientStatus;
      created_at: Date;
      status: Status;
      updated_at: Date;
    })[];
    count: number;
  }

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

  export interface RecordPatientLog {
    user: ErAuth.AccessTokenSignPayload;
    patient_id: string;
    patient_log: {
      log_type: er_PatientLogType;
      log_desc: string;
    };
  }
}
