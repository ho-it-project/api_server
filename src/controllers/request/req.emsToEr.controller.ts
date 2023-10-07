import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { AUTH_ERROR, isError, throwError } from '@config/errors';
import { REQ_EMS_TO_ER_ERROR } from '@config/errors/req.error';
import { TypedException, TypedQuery, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { EmsJwtAccessAuthGuard } from '@src/auth/guard/ems.jwt.access.guard';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import { EmsAuth, ErAuth } from '@src/auth/interface';
import { ReqEmsToErService } from '@src/providers/req/req.emsToEr.service';
import { ReqEmsToErRequest, TryCatch } from '@src/types';
import { ReqEmsToErResponse } from '@src/types/req.response.dto';

@Controller('request/ems-to-er')
export class ReqEmsToErController {
  constructor(private readonly reqEmsToErService: ReqEmsToErService) {}

  /**
   * EMS to ER 수용요청 API
   *
   * 외부에서 응급환자 수용 요청 하는 API 입니다.
   * (EMS -> ER)
   *
   * 본 API는 EMS 시스템에서만 호출 가능합니다.
   * EMS 시스템은 본 API를 호출하여 응급환자 수용 요청을 합니다.
   *
   * 요청생성은 현재 담당중인 환자정보를 기반으로 요청을 생성합니다.
   * (patient_status가 PENDING인 환자정보를 기반으로 요청을 생성)
   *
   * @author de-novo
   * @tag req_ems-to-er-(EMS)
   * @summary EMS to Er 수용요청 생성 API -- 아직 완성안됨
   *
   * @security access_token
   * @param body
   * @return {ReqEmsToErResponse.createEmsToErRequest} 요청된 병원 리스트
   */
  @TypedRoute.Post('/')
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  @TypedException<REQ_EMS_TO_ER_ERROR.PENDING_PATIENT_NOT_FOUND>(404.1, 'PENDING_PATIENT_NOT_FOUND')
  @TypedException<REQ_EMS_TO_ER_ERROR.AMBULANCE_COMPANY_NOT_FOUND>(404.2, 'AMBULANCE_COMPANY_NOT_FOUND')
  @TypedException<REQ_EMS_TO_ER_ERROR.REQUEST_ALREADY_PROCESSED>(400.1, 'REQUEST_ALREADY_PROCESSED')
  @UseGuards(EmsJwtAccessAuthGuard)
  async createEmsToErRequest(
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
  ): Promise<
    TryCatch<
      ReqEmsToErResponse.createEmsToErRequest,
      | REQ_EMS_TO_ER_ERROR.PENDING_PATIENT_NOT_FOUND
      | REQ_EMS_TO_ER_ERROR.AMBULANCE_COMPANY_NOT_FOUND
      | REQ_EMS_TO_ER_ERROR.REQUEST_ALREADY_PROCESSED
    >
  > {
    const result = await this.reqEmsToErService.createEmsToErRequest(user);
    if (isError(result)) {
      return throwError(result);
    }

    return createResponse(result);
  }

  @TypedRoute.Get('/ems')
  @UseGuards(EmsJwtAccessAuthGuard)
  async getEmsToErRequestListEms(
    @TypedQuery() query: ReqEmsToErRequest.GetEmsToErRequestListQuery,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
  ) {
    const result = await this.reqEmsToErService.getEmsToErRequestList({ query, user, type: 'ems' });
    if (isError(result)) {
      return throwError(result);
    }
    return createResponse(result);
  }

  @TypedRoute.Get('/er')
  @UseGuards(ErJwtAccessAuthGuard)
  async getEmsToErRequestList(
    @TypedQuery() query: ReqEmsToErRequest.GetEmsToErRequestListQuery,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ) {
    const result = await this.reqEmsToErService.getEmsToErRequestList({ query, user, type: 'er' });
    if (isError(result)) {
      return throwError(result);
    }
    // ER이 조회시 REQUESTED 상태인 요청은 VIEWED로 변경
    await this.reqEmsToErService.updateEmsToErRequestStatusAfterView({
      reqList: result.request_list
        .filter((r) => r.request_status === 'REQUESTED')
        .map((r) => ({ patient_id: r.patient_id, emergency_center_id: r.emergency_center_id })),
      status: RequestStatus.VIEWED,
    });
    return createResponse(result);
  }
}
