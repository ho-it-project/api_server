import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { ER_PATIENT_ERROR, isError, throwError } from '@config/errors';
import { TypedBody } from '@nestia/core';
import { Controller, Post, UseGuards } from '@nestjs/common';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import { ErAuth } from '@src/auth/interface';
import { ErPatientService } from '@src/providers/er/er.patient.service';
import { ErPatientRequest, ErPatientResponse, TryCatch } from '@src/types';

@Controller('/er/patients')
export class ErPatientController {
  constructor(private readonly erPatientService: ErPatientService) {}

  @Post('')
  @UseGuards(ErJwtAccessAuthGuard)
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
}
