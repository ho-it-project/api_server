import { CurrentUser } from '@common/decorators/CurrentUser';
import { AdminGuard } from '@common/guard/admin.guard';
import { createResponse } from '@common/interceptor/createResponse';
import { AUTH_ERROR, EMS_AMBULANCE_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedParam, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { EmsJwtAccessAuthGuard } from '@src/auth/guard/ems.jwt.access.guard';
import { EmsAuth } from '@src/auth/interface';
import { EmsAmbulanceService } from '@src/providers/ems/ems.ambulance.service';
import { EmsAmbulanceRequest, TryCatch } from '@src/types';
import { EmsAmbulanceResponse } from '@src/types/ems.response.dto';

@Controller('/ems/ambulances')
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
   * @returns 구급차 상세 정보
   */
  @TypedRoute.Get('/:ambulance_id')
  @TypedException<EMS_AMBULANCE_ERROR.AMBULANCE_NOT_FOUND>(404, '구급차량을 찾을 수 없습니다.')
  async getAmbulanceCompanyList(
    @TypedParam('ambulance_id') ambulanceId: string,
  ): Promise<TryCatch<EmsAmbulanceResponse.GetAmbulanceDetail, EMS_AMBULANCE_ERROR.AMBULANCE_NOT_FOUND>> {
    const result = await this.emsAmbulanceService.getAmbulanceDetail(ambulanceId);
    if (isError(result)) {
      return throwError(result);
    }

    return createResponse(result);
  }

  /**
   * 구급차 직원 설정 API
   *
   * 구급차 - 직원 관계를 설정하는 API입니다 (담당기사, 응급구조사, 간호사 등..)
   * 직원은 한대의 구급차에만 등록될 수 있습니다.
   *
   * ## 사용자 권한
   * - ADMIN
   * 해당 API는 ADMIN 권한이 있는 사용자만 사용할 수 있습니다.
   *
   * ## param
   * - ambulance_id: string
   *
   * ## body
   * - employee_list: {
   *  employee_id: string,
   *  action: 'ADD' | 'REMOVE'
   * }[]
   *
   *
   * @author de-novo
   * @tag ems_ambulance
   * @summary 2023-11-13 구급차 직원 설정 API
   *
   * @security access_token
   * @returns 성공 여부
   */
  @TypedRoute.Post('/:ambulance_id')
  @UseGuards(EmsJwtAccessAuthGuard, AdminGuard)
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, '권한이 없습니다.')
  @TypedException<EMS_AMBULANCE_ERROR.AMBULANCE_NOT_FOUND>(404.1, '구급차량을 찾을 수 없습니다.')
  @TypedException<EMS_AMBULANCE_ERROR.EMPLOYEE_NOT_FOUND>(404.2, '직원을 찾을 수 없습니다.')
  @TypedException<EMS_AMBULANCE_ERROR.EMPLOYEE_ALREADY_ASSIGNED>(409.1, '이미 해당 구급차에 등록된 직원입니다.')
  @TypedException<EMS_AMBULANCE_ERROR.EMPLOYEE_NOT_ASSIGNED>(409.2, '해당 구급차에 등록되지 않은 직원입니다.')
  async setAmbulanceEmployee(
    @TypedBody() body: EmsAmbulanceRequest.SetAmbulanceEmployeesDTO,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
    @TypedParam('ambulance_id') ambulance_id: string,
  ): Promise<
    TryCatch<
      'SUCCESS',
      | EMS_AMBULANCE_ERROR.AMBULANCE_NOT_FOUND
      | AUTH_ERROR.FORBIDDEN
      | EMS_AMBULANCE_ERROR.EMPLOYEE_NOT_FOUND
      | EMS_AMBULANCE_ERROR.EMPLOYEE_ALREADY_ASSIGNED
      | EMS_AMBULANCE_ERROR.EMPLOYEE_NOT_ASSIGNED
    >
  > {
    const { employee_list } = body;
    const result = await this.emsAmbulanceService.setAmbulanceEmployees({
      ambulance_id,
      employee_list,
      user,
    });
    if (isError(result)) {
      return throwError(result);
    }
    return createResponse(result);
  }
}
