import { createResponse } from '@common/interceptor/createResponse';
import { TypedQuery, TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { ErEmergencyCenterService } from '@src/providers/er/er.emergencyCenter.service';
import { ErEmergencyCenterRequest, ErEmergencyCenterResponse, Try } from '@src/types';

@Controller('/er/emergency-center')
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
}
