import { createResponse } from '@common/interceptor/createResponse';
import { EMS_AMBULANCE_ERROR, isError, throwError } from '@config/errors';
import { TypedException, TypedParam, TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { EmsAmbulanceService } from '@src/providers/ems/ems.ambulance.service';
import { TryCatch } from '@src/types';
import { EmsAmbulanceResponse } from '@src/types/ems.response.dto';

@Controller('/ems/ambulance')
export class EmsAmbulanceController {
  constructor(private readonly emsAmbulanceService: EmsAmbulanceService) {}
  /**
   * 구급차 상세 조회 API
   *
   * ## param
   * - ambulance_id: string
   *
   * @author de-novo
   * @tag ems_ambulance
   * @summary 2023-10-02 구급차 상세 조회 API
   *
   * @param ambulanceId
   * @returns {EmsAmbulanceResponse.GetAmbulanceDetail} 구급차 상세 정보
   */
  @TypedRoute.Get('/:ambulance_id')
  @TypedException<EMS_AMBULANCE_ERROR.AMBULANCE_NOT_FOUND>(404, '구급차량을 찾을 수 없습니다.')
  async getAmbulanceCompanyList(
    @TypedParam('ambulance_id') ambulanceId: string,
  ): Promise<TryCatch<EmsAmbulanceResponse.GetAmbulanceDetail, EMS_AMBULANCE_ERROR.AMBULANCE_NOT_FOUND>> {
    console.log(ambulanceId);
    const result = await this.emsAmbulanceService.getAmbulanceDetail(ambulanceId);
    if (isError(result)) {
      return throwError(result);
    }

    return createResponse(result);
  }
}
