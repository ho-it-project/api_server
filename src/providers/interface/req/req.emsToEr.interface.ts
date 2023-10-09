import { req_EmsToErRequest, req_Patient } from '@prisma/client';
import { EmsAuth, ErAuth } from '@src/auth/interface';
import { ReqEmsToErRequest } from '@src/types';

export namespace ReqEmsToEr {
  export type createEmsToErRequestReturn = {
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
}

export namespace ReqEmsToErMessage {
  export type SendEmsToErNewRequest = {
    request_list: req_EmsToErRequest[];
    patient: req_Patient;
  };
  export type SendEmsToErNewRequestMessage = req_EmsToErRequest & { patient: req_Patient };

  export type SendEmsToErResponse = {
    emergency_center_id: string;
    patient: req_Patient;
    response: string;
    reject_reason?: string;
  };
}
