import { Gender, RequestStatus, ems_Severity } from '@prisma/client';
import { tags } from 'typia';

export namespace ReqEmsToErRequest {
  export interface GetEmsToErRequestListQuery {
    page?: number;
    limit?: number;
    search?: string;
    search_type?: 'ambulance_company_name' | 'patient_name' | 'patient_symptom_summary';
    request_status?: RequestStatus[];
    patient_gender?: Gender[];
    patient_severity?: ems_Severity[];
    request_start_date?: string & tags.Format<'date-time'>; // 요청 시작 날짜 및 시간
    // request_end_date?: string & tags.Format<'date-time'>; // 요청 종료 날짜 및 시간 종료된 요청은 다시볼 필요가 없으므로 필요없음
  }

  export interface RespondEmsToErRequestDto {
    response: 'ACCEPTED' | 'REJECTED';
    reject_reason?: string;
  }

  export interface CreateEmsToErRequestDto {
    departments: string[];
  }

  export interface UpdateEmsToErRequestDto {
    request_status: 'TRANSFER' | 'TRANSFER_COMPLETED';
  }
}
