import { RequestStatus, req_EmsToErRequest, req_Patient } from '@prisma/client';
import { EmsAuth, ErAuth } from '@src/auth/interface';
import { ReqEmsToErRequest } from '@src/types';

export namespace ReqEmsToEr {
  export type CreateEmsToErRequestArg = {
    user: Pick<EmsAuth.AccessTokenSignPayload, 'ambulance_company_id' | 'employee_id'>;
    department_list?: number[];
    _type?: 'BATCH' | 'API';
  };

  export type CreateEmsToErRequestReturn = {
    target_emergency_center_list: req_EmsToErRequest[];
    patient: req_Patient;
  };
  export type GetEmsToErRequestListEms = {
    query: ReqEmsToErRequest.GetEmsToErRequestListQuery;
    user: EmsAuth.AccessTokenSignPayload;
    type: 'ems';
  };
  export type GetEmsToErRequestListEr = {
    query: ReqEmsToErRequest.GetEmsToErRequestListQuery;
    user: ErAuth.AccessTokenSignPayload;
    type: 'er';
  };

  export type GetEmsToErRequestList = GetEmsToErRequestListEms | GetEmsToErRequestListEr;
  export type GetEmsToErRequestListReturn = {
    request_list: (req_EmsToErRequest & { patient: req_Patient })[];
    count: number;
  };

  export type RespondErToEmsRequest = {
    user: ErAuth.AccessTokenSignPayload;
    response: 'ACCEPTED' | 'REJECTED';
    reject_reason?: string;
    patient_id: string;
  };

  export type ResopndErToEmsRequestReturn = {
    patient: req_Patient;
    complete_req_list: req_EmsToErRequest[];
    response: req_EmsToErRequest;
  };

  export type UpdateEmsToErRequestArg = {
    user: EmsAuth.AccessTokenSignPayload;
    patient_id: string;
    request_status: 'TRANSFER' | 'TRANSFER_COMPLETED';
  };
}

export namespace ReqEmsToErMessage {
  export type SendEmsToErNewRequest = {
    request_list: req_EmsToErRequest[];
    patient: req_Patient;
  };
  export type SendEmsToErNewRequestMessage = req_EmsToErRequest & { patient: req_Patient };

  export type SendEmsToErResponse = {
    patient_id: string;
    emergency_center_id: string;
    request_status: RequestStatus;
    request_date: string | Date;
    reject_reason?: string | null;
    ambulance_company_id: string;
    ems_employee_id: string;
  };

  export type SendEmsToErUpdate = {
    updated_list: req_EmsToErRequest[];
    patient: req_Patient;
  };
}
