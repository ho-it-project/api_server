import { er_HospitalServereIllness, er_ServereIllness } from '@prisma/client';
import { ErAuth } from '@src/auth/interface';
import { ErIllnessRequest } from '@src/types';
import { ER_ILLNESS_ERROR } from './../../../config/errors/er.error';

export namespace ErIllness {
  export interface GetServableIllnessStatusArg {
    user: ErAuth.AccessTokenSignPayload;
  }
  export type GetServableIllnessStatusReturn = {
    servable_illness_id: er_ServereIllness['servere_illness_id'];
    servable_illness_name: er_ServereIllness['servere_illness_name'];
    status: er_HospitalServereIllness['status'];
  }[];

  export interface UpdateServableIllnessStatusArg {
    user: ErAuth.AccessTokenSignPayload;
    document: ErIllnessRequest.UpdateServableIllnessStatusDto;
  }
  export type UpdateServableIllnessStatusReturn = ER_ILLNESS_ERROR.ILLNESS_NOT_EXIST | GetServableIllnessStatusReturn;
}
