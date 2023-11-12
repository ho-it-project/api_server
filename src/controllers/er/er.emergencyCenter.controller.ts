import { createResponse } from '@common/interceptor/createResponse';
import { ER_EMERGENCY_CENTER_ERROR, isError, throwError } from '@config/errors';
import { TypedException, TypedParam, TypedQuery, TypedRoute } from '@nestia/core';
import { Controller, HttpStatus } from '@nestjs/common';
import { ErEmergencyCenterService } from '@src/providers/er/er.emergencyCenter.service';
import { ErEmergencyCenterRequest, ErEmergencyCenterResponse, Try, TryCatch } from '@src/types';

@Controller('/er/emergency-centers')
export class ErEmergencyCenterController {
  constructor(private readonly erEmergencyCenterService: ErEmergencyCenterService) {}

  /**
   * 응급의료기관 리스트 조회 API
   * 응급의료기관 리스트가 필요한 경우에 사용한다.
   *
   * 필수값 : [latitude, longitude]
   *
   * ## query
   * - page : 조회할 페이지
   *    - default : 1
   * - limit : 한 페이지에 보여줄 응급의료기관 수
   *    - default : 10
   * - search : 응급의료기관 이름으로 검색
   *    - default : '' - 전체
   * - emergency_center_type : 응급의료기관 타입 필터 - 복수 선택 가능
   *    - default : [] - 전체
   * - city : 도시로 검색
   *    - default : '' - 전체
   * - latitude : 위도
   * - longitude : 경도
   *
   * @author de-novo
   * @tag er_emergency_center
   * @summary 2023-09-30 - 응급의료기관 리스트 조회 API
   * @param query
   * @returns 응급의료기관 리스트 조회
   */
  @TypedRoute.Get('')
  async getEmergencyCenterList(
    @TypedQuery()
    query: ErEmergencyCenterRequest.GetEmergencyCenterListQuery,
  ): Promise<Try<ErEmergencyCenterResponse.GetEmergencyCenterList>> {
    const result = await this.erEmergencyCenterService.getEmergencyCenterListByQuery(query);
    return createResponse(result);
  }

  /**
   * 응급의료기관 상세 조회 API
   *
   * emergency_center_id를 이용하여 응급의료기관 상세 정보를 조회한다.
   * 필수값 : [emergency_center_id]
   *
   * 병상정보, 치료가능 질환등 응급실 정보를 조회한다.
   *
   *
   * @author de-novo
   * @tag er_emergency_center
   * @summary 2023-11-12 - 응급의료기관 상세 조회 API
   * @param query
   * @returns 응급의료기관 조회
   */

  @TypedRoute.Get('/:emergency_center_id')
  @TypedException<ER_EMERGENCY_CENTER_ERROR.EMERGENCY_CENTER_NOT_FOUND>(
    HttpStatus.NOT_FOUND,
    'ER_EMERGENCY_CENTER_ERROR.EMERGENCY_CENTER_NOT_FOUND',
  )
  async getEmergencyCenter(
    @TypedParam('emergency_center_id') emergency_center_id: string,
  ): Promise<
    TryCatch<ErEmergencyCenterResponse.GetEmergencyCenterDetail, ER_EMERGENCY_CENTER_ERROR.EMERGENCY_CENTER_NOT_FOUND>
  > {
    const result = await this.erEmergencyCenterService.getEmergencyCenterById(emergency_center_id);
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }
}
