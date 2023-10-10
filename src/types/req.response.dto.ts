import { ReqEmsToEr } from '@src/providers/interface/req/req.emsToEr.interface';

export namespace ReqEmsToErResponse {
  export interface createEmsToErRequest extends ReqEmsToEr.createEmsToErRequestReturn {}
  export interface getEmsToErRequestList extends ReqEmsToEr.GetEmsToErRequestListReturn {}

}
