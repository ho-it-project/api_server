import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { AUTH_ERROR, EMS_PATIENT_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedParam, TypedQuery, TypedRoute } from '@nestia/core';
import { Controller, Param, UseGuards } from '@nestjs/common';
import {
  ems_ABCDE_Assessment,
  ems_DCAP_BTLS_Assessment,
  ems_OPQRST_Assessment,
  ems_SAMPLE_Assessment,
  ems_VS_Assessment,
} from '@prisma/client';
import { EmsJwtAccessAuthGuard } from '@src/auth/guard/ems.jwt.access.guard';
import { EmsAuth } from '@src/auth/interface';
import { EmsPatientService } from '@src/providers/ems/ems.patient.service';
import { Try, TryCatch } from '@src/types';
import { EmsPatientRequest } from '@src/types/ems.request.dto';
import { EmsPatientResponse } from '@src/types/ems.response.dto';
@Controller('/ems/patients')
export class EmsPatientController {
  constructor(private readonly emsPatientService: EmsPatientService) {}

  /**
   * 환자 생성 API
   *
   * 환자를 생성합니다.
   * 만약 대기중인 환자가 있다면 생성할 수 없습니다.
   * PENDING 상태인 환자에대한 처리를 완료하거나, CANCLED 상태로 변경해야 합니다.
   *
   *
   * @author de-novo
   * @tag ems_patient
   * @summary 2023-10-05 - 환자 생성 API
   *
   * @security access_token
   * @param createPatientDTO
   * @returns 생성된 환자 id
   */
  @TypedRoute.Post('/')
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  @TypedException<EMS_PATIENT_ERROR.INCHARGED_PATIENT_ALREADY_EXIST>(
    400,
    'EMS_PATIENT_ERROR.INCHARGED_PATIENT_ALREADY_EXIST',
  )
  @UseGuards(EmsJwtAccessAuthGuard)
  async createPatient(
    @TypedBody() createPatientDTO: EmsPatientRequest.CreatePatientDTO,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
  ): Promise<TryCatch<EmsPatientResponse.CreatePatient, EMS_PATIENT_ERROR.INCHARGED_PATIENT_ALREADY_EXIST>> {
    const result = await this.emsPatientService.createPatient({ patientInfo: createPatientDTO, user });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * 환자 목록 조회 API
   *
   *
   * 환자 목록을 조회합니다.
   * 담당한 환자만 조회할 수 있습니다.
   * 주민등록번호 뒷자리는 반환되지 않습니다.
   *
   * 현재 담당중인 환자조회가 필요할 경우 query를 통해 검색할수 있습니다.
   *
   * ## query
   *    - page?: number & tags.Minimum<1>;
   *        - default: 1
   *        - minimum: 1
   *    - limit?: number & tags.Minimum<1>;
   *        - default: 10
   *    - search?: string;
   *        - 검색어
   *    - search_type?: 'patient_name' | 'patient_birth' | 'patient_phone';
   *    - patient_status?: ems_PatientStatus[]; // 환자 진행상태 필터
   *    - patient_severity?: ems_Severity[]; // 환자 중증도 필터
   *    - patient_emergency_cause?: ems_IncidentCause[]; // 환자 응급사유 필터
   *    - gender?: Gender; // 환자 성별 필터
   *
   * @author de-novo
   * @tag ems_patient
   * @summary 2023-10-06 - 환자 목록 조회 API
   *
   * @security access_token
   * @param query
   * @returns 환자 목록 및 환자 수
   */
  @TypedRoute.Get('/')
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  @UseGuards(EmsJwtAccessAuthGuard)
  async getPatientList(
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
    @TypedQuery() query: EmsPatientRequest.GetPatientListQuery,
  ): Promise<Try<EmsPatientResponse.GetPatientList>> {
    const result = await this.emsPatientService.getPatientList({ query: query, user });
    return createResponse(result);
  }

  /**
   * 환자 상세 조회 API
   *
   * 환자의 상세 정보를 조회합니다.
   * 주민등록번호 뒷자리는 복호화되어 반환됩니다.
   * @author de-novo
   * @tag ems_patient
   * @summary 2023-10-06 - 환자 상세 조회 API
   *
   * @security access_token
   * @param patient_id
   * @returns 환자 상세 정보
   */
  @TypedRoute.Get('/:patient_id')
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>(404, 'EMS_PATIENT_ERROR.PATIENT_NOT_FOUND')
  @UseGuards(EmsJwtAccessAuthGuard)
  async getPatientDetail(
    @Param('patient_id') patient_id: string,
  ): Promise<TryCatch<EmsPatientResponse.GetPatientDetail, EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>> {
    const result = await this.emsPatientService.getPatientDetail(patient_id);
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * ABCDE 평가 생성 API
   *
   * ABCDE 평가를 생성합니다.
   * figma에있는 플로우 ABSc에대한 평가를 생성합니다.
   *
   * @author de-novo
   * @tag ems_patient
   * @summary 2023-10-06 - ABCDE 평가 생성 API - 사용안 할수도 있음
   *
   * @security access_token
   * @param createABCDEAssessmentDTO
   * @param user
   * @param patient_id
   * @returns 생성된 ABCDE 평가
   */
  @TypedRoute.Post('/:patient_id/abcde')
  @TypedException<EMS_PATIENT_ERROR.FORBIDDEN>(403, 'EMS_PATIENT_ERROR.FORBIDDEN')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>(404, 'EMS_PATIENT_ERROR.PATIENT_NOT_FOUND')
  @UseGuards(EmsJwtAccessAuthGuard)
  async createABCDEAssessment(
    @TypedBody() createABCDEAssessmentDTO: EmsPatientRequest.CreateABCDEAssessmentDTO,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
    @Param('patient_id') patient_id: string,
  ): Promise<TryCatch<ems_ABCDE_Assessment, EMS_PATIENT_ERROR.FORBIDDEN | EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>> {
    const result = await this.emsPatientService.createABCDEAssessment({
      patient_id,
      ems_employee_id: user.employee_id,
      abcde_assessment: createABCDEAssessmentDTO,
    });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * DCAP_BTLS 평가 생성 API
   *
   * DCAP_BTLS 평가를 생성합니다.
   * figma에있는 플로우 DCAP_BTLS에대한 평가를 생성합니다.
   *
   * DCAP_BTLS 평가를 진행하는 경우
   * 1. 외상환자 - 손상기전 명확
   * 2. 비외상환자
   *    - 무의식 환자인 경우 첫번째 단계
   *    - 의식 환자인 경우 4번째(마지막) 단계
   *
   * @author de-novo
   * @tag ems_patient
   * @summary 2023-10-06 - DCAP_BTLS 평가 생성 API
   *
   * @security access_token
   * @param createDCAP_BTLSAssessmentDTO
   * @param user
   * @param patient_id
   * @returns 생성된 DCAP_BTLS 평가
   */
  @TypedRoute.Post('/:patient_id/dcap_btls')
  @TypedException<EMS_PATIENT_ERROR.FORBIDDEN>(403, 'EMS_PATIENT_ERROR.FORBIDDEN')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>(404, 'EMS_PATIENT_ERROR.PATIENT_NOT_FOUND')
  @UseGuards(EmsJwtAccessAuthGuard)
  async createDCAP_BTLSAssessment(
    @TypedBody() createDCAP_BTLSAssessmentDTO: EmsPatientRequest.CreateDCAP_BTLSAssessmentDTO,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
    @Param('patient_id') patient_id: string,
  ): Promise<TryCatch<ems_DCAP_BTLS_Assessment, EMS_PATIENT_ERROR.FORBIDDEN | EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>> {
    const result = await this.emsPatientService.createDCAP_BTLSAssessment({
      patient_id,
      ems_employee_id: user.employee_id,
      dcap_btls_assessment: createDCAP_BTLSAssessmentDTO,
    });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * VS 평가 생성 API
   *
   *
   * VS 평가를 생성합니다.
   * figma에있는 플로우 VS에대한 평가를 생성합니다.
   *
   * VS 평가는 모든 환자에게 진행되어야 합니다.
   *
   * @author de-novo
   * @tag ems_patient
   * @summary 2023-10-06 - VS 평가 생성 API
   *
   * @security access_token
   * @param createVSAssessmentDTO
   * @param user
   * @param patient_id
   * @returns 생성된 VS 평가
   */
  @TypedRoute.Post('/:patient_id/vs')
  @TypedException<EMS_PATIENT_ERROR.FORBIDDEN>(403, 'EMS_PATIENT_ERROR.FORBIDDEN')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>(404, 'EMS_PATIENT_ERROR.PATIENT_NOT_FOUND')
  @TypedException<ems_VS_Assessment>(201, 'ems_VS_Assessment')
  @UseGuards(EmsJwtAccessAuthGuard)
  async createVSAssessment(
    @TypedBody() createVSAssessmentDTO: EmsPatientRequest.CreateVSAssessmentDTO,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
    @Param('patient_id') patient_id: string,
  ): Promise<TryCatch<ems_VS_Assessment, EMS_PATIENT_ERROR.FORBIDDEN | EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>> {
    const result = await this.emsPatientService.createVSAssessment({
      patient_id,
      ems_employee_id: user.employee_id,
      vs_assessment: createVSAssessmentDTO,
    });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * SAMPLE 평가 생성 API
   *
   *
   * SAMPLE 평가를 생성합니다.
   * figma에있는 플로우 SAMPLE에대한 평가를 생성합니다.
   *
   * SAMPLE 평가는 모든 환자에게 진행되어야 합니다.
   *
   * @author de-novo
   * @tag ems_patient
   * @summary 2023-10-06 - SAMPLE 평가 생성 API
   *
   * @security access_token
   * @param createSAMPLEAssessmentDTO
   * @param user
   * @param patient_id
   * @returns 생성된 SAMPLE 평가
   */
  @TypedRoute.Post('/:patient_id/sample')
  @TypedException<EMS_PATIENT_ERROR.FORBIDDEN>(403, 'EMS_PATIENT_ERROR.FORBIDDEN')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>(404, 'EMS_PATIENT_ERROR.PATIENT_NOT_FOUND')
  @UseGuards(EmsJwtAccessAuthGuard)
  async createSAMPLEAssessment(
    @TypedBody() createSAMPLEAssessmentDTO: EmsPatientRequest.CreateSAMPLEAssessmentDTO,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
    @Param('patient_id') patient_id: string,
  ): Promise<TryCatch<ems_SAMPLE_Assessment, EMS_PATIENT_ERROR.FORBIDDEN | EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>> {
    const result = await this.emsPatientService.createSAMPLEAssessment({
      patient_id,
      ems_employee_id: user.employee_id,
      sample_assessment: createSAMPLEAssessmentDTO,
    });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * OPQRST 평가 생성 API
   *
   *
   * OPQRST 평가를 생성합니다.
   *
   * OPQRST 평가를 진행해야하는 경우
   * 1. 비외상환자
   *    - 의식환자의 경우 1번째 단계
   *    - 무의식환자의 경우 3번째 (보호자/신고자등) 단계
   *
   * @author de-novo
   * @tag ems_patient
   * @summary 2023-10-06 - OPQRST 평가 생성 API
   *
   * @security access_token
   * @param createOPQRSTAssessmentDTO
   * @param user
   * @param patient_id
   * @returns 생성된 OPQRST 평가
   */
  @TypedRoute.Post('/:patient_id/opqrst')
  @TypedException<EMS_PATIENT_ERROR.FORBIDDEN>(403, 'EMS_PATIENT_ERROR.FORBIDDEN')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>(404, 'EMS_PATIENT_ERROR.PATIENT_NOT_FOUND')
  @UseGuards(EmsJwtAccessAuthGuard)
  async createOPQRSTAssessment(
    @TypedBody() createOPQRSTAssessmentDTO: EmsPatientRequest.CreateOPQRSTAssessmentDTO,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
    @Param('patient_id') patient_id: string,
  ): Promise<TryCatch<ems_OPQRST_Assessment, EMS_PATIENT_ERROR.FORBIDDEN | EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>> {
    const result = await this.emsPatientService.createOPQRSTAssessment({
      patient_id,
      ems_employee_id: user.employee_id,
      opqrst_assessment: createOPQRSTAssessmentDTO,
    });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * 환자 완료 처리 API
   *
   *
   * 환자를 완료처리합니다.
   * 완료처리된 환자는 더이상 수정할 수 없습니다.
   *
   *
   * # 주의
   *
   * - 환자를 완료처리 하기 위해서는 병원으로부터 승인을 받아야합니다.
   * - 만약 승인을 받지 않은 상태에서 완료처리를 하면 400 에러가 발생합니다.
   *
   * - 담당 환자에대한 취소는 취소 API를 이용해주세요.
   *
   * @author de-novo
   * @tag ems_patient
   * @summary 2023-10-08 - 환자 완료 처리 API
   *
   * @security access_token
   * @param user
   * @returns 없음
   */
  @TypedRoute.Post('/:patient_id')
  @TypedException<EMS_PATIENT_ERROR.FORBIDDEN>(403, 'EMS_PATIENT_ERROR.FORBIDDEN')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>(404, 'EMS_PATIENT_ERROR.PATIENT_NOT_FOUND')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_NOT_ACCEPTED>(400, 'EMS_PATIENT_ERROR.PATIENT_NOT_ACCEPTED')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_CANCEL_NOT_ALLOWED>(400, 'EMS_PATIENT_ERROR.PATIENT_CANCEL_NOT_ALLOWED')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_CANCEL_ALREADY>(400, 'EMS_PATIENT_ERROR.PATIENT_CANCEL_ALREADY')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_COMPLETE_ALREADY>(400, 'EMS_PATIENT_ERROR.PATIENT_COMPLETE_ALREADY')
  @UseGuards(EmsJwtAccessAuthGuard)
  async completePatient(
    @TypedParam('patient_id') patient_id: string,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
  ): Promise<
    TryCatch<
      undefined,
      | EMS_PATIENT_ERROR.PATIENT_NOT_FOUND
      | EMS_PATIENT_ERROR.FORBIDDEN
      | EMS_PATIENT_ERROR.PATIENT_NOT_ACCEPTED
      | EMS_PATIENT_ERROR.PATIENT_CANCEL_NOT_ALLOWED
      | EMS_PATIENT_ERROR.PATIENT_CANCEL_ALREADY
      | EMS_PATIENT_ERROR.PATIENT_COMPLETE_ALREADY
    >
  > {
    const result = await this.emsPatientService.updatePatientStatus({ user, patient_id, patient_status: 'COMPLETED' });
    if (isError(result)) return throwError(result);
    return createResponse(undefined);
  }

  /**
   * 환자 취소 처리 API
   *
   *
   * 부득이하게 환자를 취소해야하는 경우 사용합니다.
   * - 환자 정보는 수정할 수 없습니다. (환자 정보 수정은 별도의 API를 사용해주세요)
   *
   *
   *
   * @param patient_id
   * @param user
   * @returns
   */
  @TypedRoute.Put('/:patient_id')
  @TypedException<EMS_PATIENT_ERROR.FORBIDDEN>(403, 'EMS_PATIENT_ERROR.FORBIDDEN')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>(404, 'EMS_PATIENT_ERROR.PATIENT_NOT_FOUND')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_NOT_ACCEPTED>(400, 'EMS_PATIENT_ERROR.PATIENT_NOT_ACCEPTED')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_CANCEL_NOT_ALLOWED>(400, 'EMS_PATIENT_ERROR.PATIENT_CANCEL_NOT_ALLOWED')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_CANCEL_ALREADY>(400, 'EMS_PATIENT_ERROR.PATIENT_CANCEL_ALREADY')
  @TypedException<EMS_PATIENT_ERROR.PATIENT_COMPLETE_ALREADY>(400, 'EMS_PATIENT_ERROR.PATIENT_COMPLETE_ALREADY')
  @UseGuards(EmsJwtAccessAuthGuard)
  async cancelPatient(
    @TypedParam('patient_id') patient_id: string,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
  ): Promise<
    TryCatch<
      undefined,
      | EMS_PATIENT_ERROR.PATIENT_NOT_FOUND
      | EMS_PATIENT_ERROR.FORBIDDEN
      | EMS_PATIENT_ERROR.PATIENT_NOT_ACCEPTED
      | EMS_PATIENT_ERROR.PATIENT_CANCEL_NOT_ALLOWED
      | EMS_PATIENT_ERROR.PATIENT_CANCEL_ALREADY
      | EMS_PATIENT_ERROR.PATIENT_COMPLETE_ALREADY
    >
  > {
    const result = await this.emsPatientService.updatePatientStatus({ user, patient_id, patient_status: 'CANCELED' });
    if (isError(result)) return throwError(result);
    return createResponse(undefined);
  }
}
