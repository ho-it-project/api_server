import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { ER_REQUEST_PATIENT_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedParam, TypedRoute } from '@nestia/core';
import { Controller, HttpStatus, UseGuards } from '@nestjs/common';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import { ErAuth } from '@src/auth/interface';
import { ErRequestPatientService } from '@src/providers/er/er.requestPatient.service';
import { ErRequestPatientRequest, ErRequestPatientResponse, TryCatch } from '@src/types';

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

  /**
   * 요청 받은 환자 인수인계 API
   *
   * //TODO: 추후에 인수인계 인증처리 추가 예정입니다
   *
   * 요청 받은 환자 인수인계 API 입니다.
   *
   * 인수인계 받은 환자 정보는 er_patient 테이블에 저장후
   * ems_patient를 완료처리 합니다.
   *
   * ## Body
   * - emergency_room_id: 응급실 id
   * - emergency_room_bed_num: 환자가 배정받을 병상 번호
   * - doctor_id: 담당 의사 id
   * - nurse_id: 담당 간호사 id
   *
   * @author de-novo
   * @tag er_request_patient
   * @summary 2023-11-26 - 요청 받은 환자 인수인계 API
   *
   * @security access_token
   * @returns 성공여부
   */
  @TypedRoute.Post('/:patient_id')
  @UseGuards(ErJwtAccessAuthGuard)
  @TypedException<ER_REQUEST_PATIENT_ERROR.REQUEST_PATIENT_NOT_EXIST>(
    HttpStatus.BAD_REQUEST,
    'REQUEST_PATIENT_NOT_EXIST',
  )
  @TypedException<ER_REQUEST_PATIENT_ERROR.EMERGENCY_BED_NOT_FOUND>(HttpStatus.BAD_REQUEST, 'EMERGENCY_BED_NOT_FOUND')
  @TypedException<ER_REQUEST_PATIENT_ERROR.ER_BED_NOT_AVAILABLE>(HttpStatus.BAD_REQUEST, 'ER_BED_NOT_AVAILABLE')
  @TypedException<ER_REQUEST_PATIENT_ERROR.DOCTOR_NOT_EXIST>(HttpStatus.BAD_REQUEST, 'DOCTOR_NOT_EXIST')
  @TypedException<ER_REQUEST_PATIENT_ERROR.NURCE_NOT_EXIST>(HttpStatus.BAD_REQUEST, 'NURCE_NOT_EXIST')
  async assignRequestPatient(
    @TypedParam('patient_id') patient_id: string,
    @TypedBody() body: ErRequestPatientRequest.AssignRequestPatientDto,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<
    TryCatch<
      'SUCCESS',
      | ER_REQUEST_PATIENT_ERROR.REQUEST_PATIENT_NOT_EXIST
      | ER_REQUEST_PATIENT_ERROR.EMERGENCY_BED_NOT_FOUND
      | ER_REQUEST_PATIENT_ERROR.ER_BED_NOT_AVAILABLE
      | ER_REQUEST_PATIENT_ERROR.DOCTOR_NOT_EXIST
      | ER_REQUEST_PATIENT_ERROR.NURCE_NOT_EXIST
    >
  > {
    const { emergency_room_bed_num, emergency_room_id, doctor_id, nurse_id } = body;
    const result = await this.erRequestPatientService.assignRequestPatient({
      patient_id,
      user,
      emergency_room_bed_num,
      emergency_room_id,
      doctor_id,
      nurse_id,
    });
    if (isError(result)) return throwError(result);

    return createResponse(result);
  }
}
