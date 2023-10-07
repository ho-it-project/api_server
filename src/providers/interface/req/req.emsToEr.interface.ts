import { req_EmsToErRequest, req_Patient } from '@prisma/client';
import { EmsAuth, ErAuth } from '@src/auth/interface';
import { ReqEmsToErRequest } from '@src/types';

export namespace ReqEmsToEr {
  export type createEmsToErRequestReturn = {
    target_emergency_center_list: {
      emergency_center_id: string;
      emergency_center_name: string;
      emergency_center_latitude: number;
      emergency_center_longitude: number;
      distance: number;
    }[];
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
    patient_id: string;
  };
}
