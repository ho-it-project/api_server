import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { AUTH_ERROR, isError, throwError } from '@config/errors';
import { REQ_EMS_TO_ER_ERROR } from '@config/errors/req.error';
import { TypedBody, TypedException, TypedParam, TypedQuery, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RequestStatus } from '@prisma/client';
import { EmsJwtAccessAuthGuard } from '@src/auth/guard/ems.jwt.access.guard';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import { EmsAuth, ErAuth } from '@src/auth/interface';
import { ReqEmsToErProducer } from '@src/providers/req/req.emsToEr.producer';
import { ReqEmsToErService } from '@src/providers/req/req.emsToEr.service';
import { ReqEmsToErRequest, Try, TryCatch } from '@src/types';
import { ReqEmsToErResponse } from '@src/types/req.response.dto';

@Controller('requests/ems-to-er')
export class ReqEmsToErController {
  constructor(
    private readonly reqEmsToErService: ReqEmsToErService,
    private readonly reqEmsToErProducer: ReqEmsToErProducer,
  ) {}

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
   * @summary 2023-10-08 - EMS to Er 수용요청 생성 API
   *
   * @security access_token
   * @param body
   * @return {ReqEmsToErResponse.createEmsToErRequest} 요청된 병원 리스트
   */
  @TypedRoute.Post('/')
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  @TypedException<REQ_EMS_TO_ER_ERROR.PENDING_PATIENT_NOT_FOUND>(404.1, 'PENDING_PATIENT_NOT_FOUND')
  @TypedException<REQ_EMS_TO_ER_ERROR.REQUEST_ALREADY_PROCESSED>(400.1, 'REQUEST_ALREADY_PROCESSED')
  @UseGuards(EmsJwtAccessAuthGuard)
  async createEmsToErRequest(
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
  ): Promise<
    TryCatch<
      ReqEmsToErResponse.createEmsToErRequest,
      REQ_EMS_TO_ER_ERROR.PENDING_PATIENT_NOT_FOUND | REQ_EMS_TO_ER_ERROR.REQUEST_ALREADY_PROCESSED
    >
  > {
    const result = await this.reqEmsToErService.createEmsToErRequest({ user });
    if (isError(result)) {
      return throwError(result);
    }

    const { target_emergency_center_list, patient } = result;

    await this.reqEmsToErProducer.sendEmsToErNewRequest({ request_list: target_emergency_center_list, patient });

    return createResponse(result);
  }

  /**
   * ems to er 요청 리스트 조회 API - EMS
   *
   * EMS 직원 본인이 생성한 요청 리스트를 조회하는 API 입니다.
   *
   * 본 API는 EMS 시스템에서만 호출 가능합니다.
   * EMS 시스템은 본 API를 호출하여 EMS 직원 본인이 생성한 요청 리스트를 조회합니다.
   * query를 통해 요청 리스트를 필터링 할 수 있습니다.
   *
   * ## query
   *    - page?: number;
   *        - default: 1
   *    - limit?: number;
   *        - default: 10
   *    - search?: string;
   *        - 검색어
   *    - search_type?: 'ambulance_company_name' | 'patient_name' | 'patient_symptom_summary';
   *        - 검색 타입
   *    - request_status?: RequestStatus[];
   *        - 요청 상태 필터링
   *    - patient_gender?: Gender[];
   *        - 환자 성별 필터링
   *    - patient_severity?: ems_Severity[];
   *        - 환자 중증도 필터링
   *    - request_start_date?: string & tags.Format<'date-time'>; // 요청 시작 날짜 및 시간
   *        - 요청 시작 날짜 및 시간
   *
   * @author de-novo
   * @tag req_ems-to-er-(EMS)
   * @summary 2023-10-08 EMS to Er 요청 리스트 조회 API - EMS
   *
   * @security access_token
   * @returns ems to er 요청 리스트 및 요청 리스트 개수
   */
  @TypedRoute.Get('/ems')
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  @UseGuards(EmsJwtAccessAuthGuard)
  async getEmsToErRequestListEms(
    @TypedQuery() query: ReqEmsToErRequest.GetEmsToErRequestListQuery,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
  ): Promise<Try<ReqEmsToErResponse.getEmsToErRequestList>> {
    const result = await this.reqEmsToErService.getEmsToErRequestList({ query, user, type: 'ems' });
    if (isError(result)) {
      return throwError(result);
    }
    return createResponse(result);
  }

  /**
   * ems to er 요청 리스트 조회 API - ER
   *
   * ER에 해당하는 요청 리스트를 조회하는 API 입니다.
   *
   * 본 API는 ER 시스템에서만 호출 가능합니다.
   * ER 시스템은 본 API를 호출하여 ER에 해당하는 요청 리스트를 조회합니다.
   *
   *  - ER이 조회시 REQUESTED 상태인 요청은 VIEWED로 변경
   *  - 요청을 조회하면 해당 요청은 VIEWED 상태로 변경됩니다.
   *
   * ## query
   *    - page?: number;
   *        - default: 1
   *    - limit?: number;
   *        - default: 10
   *    - search?: string;
   *        - 검색어
   *    - search_type?: 'ambulance_company_name' | 'patient_name' | 'patient_symptom_summary';
   *        - 검색 타입
   *    - request_status?: RequestStatus[];
   *        - 요청 상태 필터링
   *    - patient_gender?: Gender[];
   *        - 환자 성별 필터링
   *    - patient_severity?: ems_Severity[];
   *        - 환자 중증도 필터링
   *    - request_start_date?: string & tags.Format<'date-time'>; // 요청 시작 날짜 및 시간
   *        - 요청 시작 날짜 및 시간
   *
   * @author de-novo
   * @tag req_ems-to-er-(ER)
   * @summary 2023-10-08 EMS to Er 요청 리스트 조회 API - ER
   *
   * @security access_token
   * @returns ems to er 요청 리스트 및 요청 리스트 개수
   */
  @TypedRoute.Get('/er')
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  @UseGuards(ErJwtAccessAuthGuard)
  async getEmsToErRequestList(
    @TypedQuery() query: ReqEmsToErRequest.GetEmsToErRequestListQuery,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<Try<ReqEmsToErResponse.getEmsToErRequestList>> {
    const result = await this.reqEmsToErService.getEmsToErRequestList({ query, user, type: 'er' });
    if (isError(result)) {
      return throwError(result);
    }

    const reqList = result.request_list
      .filter((r) => r.request_status === 'REQUESTED')
      .map((r) => ({ patient_id: r.patient_id, emergency_center_id: r.emergency_center_id }));
    // ER이 조회시 REQUESTED 상태인 요청은 VIEWED로 변경
    await this.reqEmsToErService.updateEmsToErRequestStatusAfterView({
      reqList,
      status: RequestStatus.VIEWED,
    });

    const { request_list } = result;
    request_list
      .filter((r) => r.request_status === 'REQUESTED')
      .forEach(async (r) => {
        const { patient, ...req } = r;
        await this.reqEmsToErProducer.sendEmsToErUpdate({
          patient,
          updated_list: [{ ...req, request_status: 'VIEWED' }],
        });
      });

    return createResponse(result);
  }

  /**
   * ems to er 요청 수락/거절 API - ER
   *
   * ER에서 요청에 대한 수락/거절을 응답하는 API 입니다.
   *
   * 본 API는 ER 시스템에서만 호출 가능합니다.
   * ER 시스템은 본 API를 호출하여 ER에서 요청에 대한 수락/거절을 응답합니다.
   *
   *  - ER이 요청에 대한 응답을 하면 해당 요청은 ACCEPTED/REJECTED 상태로 변경됩니다.
   *  - 요청을 응답하면 해당 요청은 ACCEPTED/REJECTED 상태로 변경됩니다.
   *  - 만약 응답이 ACCEPTED라면 해당 요청의 다른 요청은 CANCEL 상태로 변경됩니다.
   *
   * ## body
   *    - response: 'ACCEPTED' | 'REJECTED';
   *        - 응답
   *
   * ## param
   *    - patient_id: string;
   *        - 환자 id
   *
   * @summary 2023-10-08 EMS to Er 요청 수락/거절 API - ER
   * @tag req_ems-to-er-(ER)
   *
   * @security access_token
   * @returns null
   */
  @TypedRoute.Post('/:patient_id')
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  @TypedException<REQ_EMS_TO_ER_ERROR.REQUEST_ALREADY_PROCESSED>(400.1, 'REQUEST_ALREADY_PROCESSED')
  @TypedException<REQ_EMS_TO_ER_ERROR.REQUEST_NOT_FOUND>(404.1, 'REQUEST_NOT_FOUND')
  @UseGuards(ErJwtAccessAuthGuard)
  async respondEmsToErRequest(
    @TypedParam('patient_id') patient_id: string,
    @TypedBody() respondErToEmsRequestDto: ReqEmsToErRequest.RespondEmsToErRequestDto,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<
    TryCatch<undefined, REQ_EMS_TO_ER_ERROR.REQUEST_ALREADY_PROCESSED | REQ_EMS_TO_ER_ERROR.REQUEST_NOT_FOUND>
  > {
    const { response, reject_reason } = respondErToEmsRequestDto;
    const { emergency_center_id } = user;
    const result = await this.reqEmsToErService.respondEmsToErRequest({
      user,
      response,
      reject_reason,
      patient_id,
    });
    if (isError(result)) {
      return throwError(result);
    }
    const { patient, complete_req_list, response: _response } = result;
    // TODO: 카프카로 전송 필요
    const { ambulance_company_id, ems_employee_id } = patient;
    const { request_date, request_status } = _response;
    // 변경된 요청 상태를 카프카로 전송하여 EMS에게 알림
    await this.reqEmsToErProducer.sendEmsToErResponse({
      patient_id,
      emergency_center_id,
      ambulance_company_id,
      ems_employee_id,
      request_date,
      request_status,
      reject_reason,
    });
    await this.reqEmsToErProducer.sendEmsToErUpdate({ patient, updated_list: complete_req_list });
    return createResponse(undefined);
  }

  // @TypedRoute.Put('/:patient_id')
  // @UseGuards(EmsJwtAccessAuthGuard)
  // async cancelEmsToErRequest() {}

  /**
   * ems to er 요청 상태 변경 API - EMS
   *
   *
   * 본 API는 EMS 시스템에서만 호출 가능합니다.
   * EMS에서 요청 상태를 변경하는 API 입니다.
   *
   * 변경 가능 상태
   * - ACCEPTED -> TRANSFER // 수락 후 환자 이송
   * - TRANSFER -> TRANSFER_COMPLETED // 환자 이송 완료
   *
   * ## body
   *   - request_status: "TRANSFER" | "TRANSFER_COMPLETED";
   *
   */
  @TypedRoute.Patch('/:patient_id')
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  @TypedException<REQ_EMS_TO_ER_ERROR.REQUEST_NOT_FOUND>(404.1, 'REQUEST_NOT_FOUND')
  @UseGuards(EmsJwtAccessAuthGuard)
  async updateEmsToErRequest(
    @TypedParam('patient_id') patient_id: string,
    @TypedBody() body: ReqEmsToErRequest.UpdateEmsToErRequestDto,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
  ): Promise<TryCatch<'SUCCESS', REQ_EMS_TO_ER_ERROR.REQUEST_NOT_FOUND>> {
    const { request_status } = body;
    const result = await this.reqEmsToErService.updateEmsToErRequest({ patient_id, request_status, user });

    if (isError(result)) {
      return throwError(result);
    }

    const { ems_to_er_request, ...patient } = result;
    await this.reqEmsToErProducer.sendEmsToErUpdate({ patient, updated_list: ems_to_er_request });
    return createResponse('SUCCESS');
  }

  //1분마다 실행
  @Cron('0 * * * * *')
  async batchNewEmsToErRequest() {
    const result = await this.reqEmsToErService.batchNewEmsToErRequest();

    await Promise.all(
      result.map(async (r) => {
        if (isError(r)) {
          return;
        }
        const { target_emergency_center_list, patient } = r;
        await this.reqEmsToErProducer.sendEmsToErNewRequest({ request_list: target_emergency_center_list, patient });
      }),
    );
  }
}
