import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { ER_PATIENT_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedParam, TypedQuery } from '@nestia/core';
import { Controller, Get, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import { ErAuth } from '@src/auth/interface';
import { ErPatientService } from '@src/providers/er/er.patient.service';
import { ErPatientRequest, ErPatientResponse, Try, TryCatch } from '@src/types';

@Controller('/er/patients')
export class ErPatientController {
  constructor(private readonly erPatientService: ErPatientService) {}

  /**
   * 병원 환자 조회 API
   *
   * 병원에서 환자를 조회한다.
   *
   * ## query
   * - page : 페이지
   * - limit : 페이지당 갯수
   * - search : 환자이름 검색
   * - patient_status[] : 환자 상태
   *    - "PENDING" | "ADMISSION" | "DISCHARGE" | "DEATH" | "TRANSFERED"
   *    - PENDING - 대기
   *    - ADMISSION - 입원
   *    - DISCHARGE - 퇴원
   *    - DEATH - 사망
   *    - TRANSFERED - 이송
   *
   *
   * ## response
   * - patient_list : 환자 리스트
   * - count : 환자 갯수
   *
   *
   * @author de-novo
   * @tag er_patient
   * @summary 2023-11-15 - 병원 환자 조회 API
   *
   * @security access_token
   * @returns 환자 리스트
   */

  @Get('/')
  @UseGuards(ErJwtAccessAuthGuard)
  async getPatientList(
    @TypedQuery() query: ErPatientRequest.GetPatientListQuery,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<Try<ErPatientResponse.GetPatientList>> {
    const result = await this.erPatientService.getPatientList({ query, user });
    return createResponse(result);
  }

  @Get('/:patient_id')
  @UseGuards(ErJwtAccessAuthGuard)
  @TypedException<ER_PATIENT_ERROR.PATIENT_NOT_EXIST>(HttpStatus.BAD_REQUEST, 'ER_PATIENT_ERROR.PATIENT_NOT_EXIST')
  async getPatientDetail(
    @TypedParam('patient_id') patient_id: string,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<TryCatch<ErPatientResponse.GetPatientDetail, ER_PATIENT_ERROR.PATIENT_NOT_EXIST>> {
    const result = await this.erPatientService.getPatientDetail({ patient_id, user });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * 환자 생성 API
   * 병원에서 환자를 생성한다.
   *
   * @author de-novo
   * @tag er_patient
   * @summary 2023-11-15 - 병원 환자 생성 API
   *
   * @security access_token
   * @returns 생성된 환자 정보
   */
  @Post('')
  @UseGuards(ErJwtAccessAuthGuard)
  @TypedException<ER_PATIENT_ERROR.DOCTOR_NOT_EXIST>(HttpStatus.BAD_REQUEST, 'ER_PATIENT_ERROR.DOCTOR_NOT_EXIST')
  @TypedException<ER_PATIENT_ERROR.NURCE_NOT_EXIST>(HttpStatus.BAD_REQUEST, 'ER_PATIENT_ERROR.NURCE_NOT_EXIST')
  async createPatient(
    @TypedBody() body: ErPatientRequest.CreatePatientDto,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<
    TryCatch<ErPatientResponse.CreatePatient, ER_PATIENT_ERROR.DOCTOR_NOT_EXIST | ER_PATIENT_ERROR.NURCE_NOT_EXIST>
  > {
    const result = await this.erPatientService.createPatient({ patient_info: body, user });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * 환자 로그 기록 API
   *
   * 환자의 상태를 기록한다.
   *
   * ## body
   * - log_type : 기록 종류
   *  DIAGNOSIS - 진단
   *  TREATMENT - 처치
   *  MEDICATION - 약물처방
   *  TRANSFER - 이송  *해당 기록은 환자의 상태를 이송으로 변경한다.
   *  DISCHARGE - 퇴원  *해당 기록은 환자의 상태를 퇴원으로 변경한다.
   *  DEATH - 사망
   *  CONSULTATION - 상담
   *
   * - log_desc : 기록 내용
   *
   * ## params
   * - patient_id : 환자 id
   *
   * 필수값 : [log_type, log_desc, patient_id]
   *
   *
   * ### 꼭 읽어주세요
   * - 현재 모든 log_type을 사용 가능하지만 정상적인 로직으로 작동하는 것은
   *  진단, 처치, 약물처방, 퇴원, 상담입니다.
   *
   * 이송은 어떠한 병원으로 이송 할지를 선택하는 로직을 추가해야합니다.
   * 사망은 사망한 환자의 정보를 어떻게 처리할건지 추가적인 고민이 필요합니다.
   *
   *
   * @author de-novo
   * @tag er_patient
   * @summary 2023-11-15 - 환자 로그 기록 API
   *
   * @security access_token
   * @returns 생성된 환자 정보
   */
  @Post('/:patient_id')
  @UseGuards(ErJwtAccessAuthGuard)
  @TypedException<ER_PATIENT_ERROR.PATIENT_NOT_EXIST>(HttpStatus.BAD_REQUEST, 'ER_PATIENT_ERROR.PATIENT_NOT_EXIST')
  async recordPatientLog(
    @TypedBody() body: ErPatientRequest.RecordPatientLogDto,
    @TypedParam('patient_id') patient_id: string,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<TryCatch<'SUCCESS', ER_PATIENT_ERROR.PATIENT_NOT_EXIST>> {
    const result = await this.erPatientService.recordPatientLog({ patient_id, user, patient_log: body });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }
}
