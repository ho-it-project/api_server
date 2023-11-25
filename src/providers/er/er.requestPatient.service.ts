import { PrismaService } from '@common/prisma/prisma.service';
import { ER_REQUEST_PATIENT_ERROR } from '@config/errors';
import { Injectable } from '@nestjs/common';
import { ErAuth } from '@src/auth/interface';
import typia from 'typia';
import { ErRequestPatient } from '../interface/er/er.requestPatient.interface';

/**
 * ER - EMS 간의 환자 요청 서비스
 *
 * 1. 요청된 환자 정보 조회 (EMS 에서 작성된 환자 정보를 ER 에서 조회한다.)
 * 2. 요청을 수학한 환자 이력 migration (EMS 에서 작성된 환자 정보를 ER에 생성한다.)
 */
@Injectable()
export class ErRequestPatientService {
  constructor(
    private readonly prismaService: PrismaService, // private readonly cryptoService: CryptoService,
  ) {}

  /**
   * EMS 에서 요청된 환자 정보 조회 API
   *
   * 
   * 
   * 
   * @returns EMS에서 요청된 환자 정보
   */
  async getRequestedPatient(
    patient_id: string,
    user: ErAuth.AccessTokenSignPayload,
  ): Promise<ErRequestPatient.GetRequestedPatient | ER_REQUEST_PATIENT_ERROR.REQUEST_PATIENT_NOT_EXIST> {
    const { emergency_center_id } = user;

    const reqPatient = await this.prismaService.req_Patient.findUnique({
      where: {
        patient_id,
        ems_to_er_request: {
          some: {
            emergency_center_id,
            request_status: {
              not: 'CANCELED',
            },
          },
        },
      },
    });
    if (!reqPatient) return typia.random<ER_REQUEST_PATIENT_ERROR.REQUEST_PATIENT_NOT_EXIST>();

    const { patient_id: req_patient_id } = reqPatient;
    const emsPatient = await this.prismaService.ems_Patient.findUnique({
      where: {
        patient_id: req_patient_id,
      },
      include: {
        rapid: true,
        abcde: true,
        vs: true,
        opqrst: true,
        sample: true,
        dcap_btls: true,
        guardian: true,
        employee: {
          select: {
            employee_id: true,
            employee_name: true,
            ambulance_company: {
              select: {
                ambulance_company_name: true,
                ambulance_company_id: true,
                ambulance_company_phone: true,
              },
            },
          },
        },
      },
    });
    if (!emsPatient) return typia.random<ER_REQUEST_PATIENT_ERROR.REQUEST_PATIENT_NOT_EXIST>();

    return { patient: emsPatient };
  }





}
