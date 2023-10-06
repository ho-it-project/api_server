import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { EMS_PATIENT_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedQuery, TypedRoute } from '@nestia/core';
import { Controller, Param, UseGuards } from '@nestjs/common';
import { EmsJwtAccessAuthGuard } from '@src/auth/guard/ems.jwt.access.guard';
import { EmsAuth } from '@src/auth/interface';
import { TryCatch } from '@src/types';
import { EmsPatientResponse } from '@src/types/ems.response.dto';
import { EmsPatientService } from './../../providers/ems/ems.patient.service';
import { EmsPatientRequest } from './../../types/ems.request.dto';
@Controller('/ems/patient')
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
   * @returns {EmsPatientResponse.CreatePatient} 생성된 환자 id
   */
  @TypedRoute.Post('/')
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
  @UseGuards(EmsJwtAccessAuthGuard)
  async getPatientList(
    @TypedQuery() query: EmsPatientRequest.GetPatientListQuery,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
  ) {
    const result = await this.emsPatientService.getPatientList({ query, user });
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
  @TypedException<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>(404, 'EMS_PATIENT_ERROR.PATIENT_NOT_FOUND')
  @UseGuards(EmsJwtAccessAuthGuard)
  async getPatientDetail(
    @Param('patient_id') patient_id: string,
  ): Promise<TryCatch<EmsPatientResponse.GetPatientDetail, EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>> {
    const result = await this.emsPatientService.getPatientDetail(patient_id);
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  // @TypedRoute.Post('/:patient_id/abcde')
  // @UseGuards(EmsJwtAccessAuthGuard)
  // async createABCDEAssessment() {}

  // @TypedRoute.Post('/:patient_id/dcap_btls')
  // @UseGuards(EmsJwtAccessAuthGuard)
  // async createDCAP_BTLSAssessment() {}

  // @TypedRoute.Post('/:patient_id/vs')
  // @UseGuards(EmsJwtAccessAuthGuard)
  // async createVSAssessment() {}

  // @TypedRoute.Post('/:patient_id/sample')
  // @UseGuards(EmsJwtAccessAuthGuard)
  // async createSAMPLEAssessment() {}

  // @TypedRoute.Post('/:patient_id/opqrst')
  // @UseGuards(EmsJwtAccessAuthGuard)
  // async createOPQRSTAssessment() {}
}
