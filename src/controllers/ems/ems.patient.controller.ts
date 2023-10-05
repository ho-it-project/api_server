import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { EMS_PATIENT_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
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
}
