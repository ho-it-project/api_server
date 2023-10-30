import { createResponse } from '@common/interceptor/createResponse';
import { EMS_AMBULANCE_COMPANY_ERROR, isError, throwError } from '@config/errors';
import { TypedException, TypedParam, TypedQuery, TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { EmsAmbulanceCampanyService } from '@src/providers/ems/ems.ambulanceCampany.service';
import { Try, TryCatch } from '@src/types';
import { EmsAmbulanceCompanyRequest } from '@src/types/ems.request.dto';
import { EmsAmbulanceCompanyResponse } from '@src/types/ems.response.dto';

@Controller('/ems/ambulance-companies')
export class EmsAmbulanceCompanyController {
  constructor(private readonly emsAmbulanceCampanyService: EmsAmbulanceCampanyService) {}

  /**
   * 구급업체 리스트 조회 API
   *
   * ## query
   * - page: number
   * - limit: number
   * - search: string
   *
   * - city: string[]
   *    - ex) '서울특별시','서울','서울시'
   *       -> 서버에서 '서울'로 정제하여 검색하기때문에 모두 가능
   *    - ex) '충남','충청남도'
   *       -> 서버에서 '충남'으로 정제하여 검색하기때문에 모두 가능
   *    - ex) '대전광역시','대전'
   *       -> 서버에서 '대전'으로 정제하여 검색하기때문에 모두 가능
   *
   *  - area: string[]
   *    - ex) '강남','강남구'
   *    -> 서버에서 '강남'으로 정제하여 검색하기때문에 모두 가능
   *
   *    - ex) '천안시 동남구', '천안 동남구', '천안시 동남', '천안 동남'
   *    -> '천안동남'으로 정제하여 검색하기때문에 모두 가능
   *    -> 주의 : '천안시동남구" 는 정제되지 않기때문에 검색되지 않음 (띄어쓰기 필수)
   *
   *    - ex) '천안시', '천안'
   *    -> '천안'으로 정제하여 검색하기때문에 모두 가능
   *
   * - ambulance_type: ems_AmbulanceType[]
   *    - 보유중인 구급차량 타입
   *    - BOX_TYPE, GENERAL, NEGATIVE_PRESSURE, SPECIAL
   *
   * @author de-novo
   * @tag ems_ambulance_company
   * @summary 2023-10-02 구급업체 리스트 조회 API
   *
   *
   * @param query
   * @returns 구급업체 리스트 및 총 구급업체 수
   */
  @TypedRoute.Get('/')
  async getAmbulanceCompanyList(
    @TypedQuery() query: EmsAmbulanceCompanyRequest.GetAmbulanceCompanyListQuery,
  ): Promise<Try<EmsAmbulanceCompanyResponse.GetAmbulanceCompanyList>> {
    const result = await this.emsAmbulanceCampanyService.getAmbulanceCompanyList(query);
    return createResponse(result);
  }

  /**
   * 구급업체 상세 조회 API
   *
   * - 구급업체 상세 정보를 조회한다.
   *
   * ## params
   * - ems_ambulance_company_id: string
   *
   * @author de-novo
   * @tag ems_ambulance_company
   * @summary 2023-10-02 구급업체 상세 조회 API
   *
   * @param ems_ambulance_company_id
   * @returns 구급업체 상세 정보
   */
  @TypedRoute.Get('/:ems_ambulance_company_id')
  @TypedException<EMS_AMBULANCE_COMPANY_ERROR.AMBULANCE_COMPANY_NOT_FOUND>(
    400,
    'EMS_AMBULANCE_COMPANY_ERROR.AMBULANCE_COMPANY_NOT_FOUND',
  )
  async getAmbulanceCompanyDetail(
    @TypedParam('ems_ambulance_company_id') ems_ambulance_company_id: string,
  ): Promise<
    TryCatch<
      EmsAmbulanceCompanyResponse.GetAmbulanceCompanyDetail,
      EMS_AMBULANCE_COMPANY_ERROR.AMBULANCE_COMPANY_NOT_FOUND
    >
  > {
    const result = await this.emsAmbulanceCampanyService.getAmbulanceCompanyDetail(ems_ambulance_company_id);

    if (isError(result)) {
      return throwError(result);
    }
    return createResponse(result);
  }
}
