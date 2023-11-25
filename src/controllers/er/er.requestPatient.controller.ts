import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { ER_REQUEST_PATIENT_ERROR, isError, throwError } from '@config/errors';
import { TypedException, TypedParam, TypedRoute } from '@nestia/core';
import { Controller, HttpStatus, UseGuards } from '@nestjs/common';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import { ErAuth } from '@src/auth/interface';
import { ErRequestPatientService } from '@src/providers/er/er.requestPatient.service';
import { ErRequestPatientResponse, TryCatch } from '@src/types';

@Controller('/er/request-patients')
export class ErRequestPatientController {
  constructor(private readonly erRequestPatientService: ErRequestPatientService) {}

  /**
   * 요청 받은 환자 상세정보 조회 API
   *
   * 1. 요청 받은 환자 상세정보 조회
   * 2. 요청 받은 환자 상세정보 조회 실패시 에러 반환 (ER_REQUEST_PATIENT_ERROR.REQUEST_PATIENT_NOT_EXIST)
   * ㄴ 권한이 없는 사용자의 경우 에러 반환 (요청받지 않은 환자 정보 조회한 경우 등...)
   *
   * @author de-novo
   * @tag er_request_patient
   * @summary 2023-11-26 - 요청 받은 환자 상세정보 조회 API
   *
   * @security access_token
   * @returns ems에서 요청 받은 환자 상세정보
   */
  @TypedRoute.Get('/:patient_id')
  @UseGuards(ErJwtAccessAuthGuard)
  @TypedException<ER_REQUEST_PATIENT_ERROR.REQUEST_PATIENT_NOT_EXIST>(
    HttpStatus.BAD_REQUEST,
    'REQUEST_PATIENT_NOT_EXIST',
  )
  async getRequestedPatient(
    @TypedParam('patient_id') patient_id: string,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<
    TryCatch<ErRequestPatientResponse.GetRequestedPatient, ER_REQUEST_PATIENT_ERROR.REQUEST_PATIENT_NOT_EXIST>
  > {
    const result = await this.erRequestPatientService.getRequestedPatient(patient_id, user);
    if (isError(result)) return throwError(result);

    return createResponse(result);
  }
}
