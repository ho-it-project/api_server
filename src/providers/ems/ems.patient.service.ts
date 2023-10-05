import { CryptoService } from '@common/crypto/crypto.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { EMS_PATIENT_ERROR } from '@config/errors';
import { Injectable } from '@nestjs/common';
import { ems_Patient } from '@prisma/client';
import typia from 'typia';
import { assertPrune } from 'typia/lib/misc';
import { v4 } from 'uuid';
import { EmsPatient } from '../interface/ems/ems.patient.interface';

@Injectable()
export class EmsPatientService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  async createPatient(
    createPatientDTO: EmsPatient.CreatePatientDTO,
  ): Promise<Pick<ems_Patient, 'patient_id'> | EMS_PATIENT_ERROR.INCHARGED_PATIENT_ALREADY_EXIST> {
    const { patientInfo, user } = createPatientDTO;
    const { patient_identity_number, patient_guardian, ...patient } = patientInfo;
    const salt = v4();

    // 주민등록번호 뒷자리 암호화
    const encryptedIdentityNumber = await this.cryptoService.encrypt({
      data: patient_identity_number,
      salt,
    });

    const { employee_id } = user;
    const inchargePatient = await this.prismaService.ems_Patient.findFirst({
      where: {
        ems_employee_id: employee_id,
        patient_status: {
          notIn: ['COMPLETED', 'CANCELED'],
        },
      },
    });
    if (inchargePatient) {
      return typia.random<EMS_PATIENT_ERROR.INCHARGED_PATIENT_ALREADY_EXIST>();
    }

    // TODO : 주석 제거
    const newPatient = await this.prismaService.ems_Patient.create({
      select: {
        patient_id: true,
      },
      data: {
        ...patient,
        ems_employee_id: employee_id,
        patient_identity_number: encryptedIdentityNumber,
        patient_salt: {
          create: {
            salt,
          },
        },
        ...(patient_guardian && {
          guardian_id: v4(),
          guardian: {
            create: { ...patient_guardian },
          },
        }),
      },
    });

    return newPatient;
  }

  async getPatientDetail(patient_id: string) {
    const patient = await this.prismaService.ems_Patient.findUnique({
      where: {
        patient_id,
      },
      include: {
        guardian: true,
        abcde: true,
        dcap_btls: true,
        vs: true,
        sample: true,
        opqrst: true,
        patient_salt: true,
      },
    });
    if (!patient) return typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>();
    const { patient_salt, ...patientWithoutSalt } = patient;
    if (!patient_salt) {
      return typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>();
    }
    const { salt } = patient_salt;
    const decryptedIdentityNumber = await this.cryptoService.decrypt({
      hash: patientWithoutSalt.patient_identity_number,
      salt,
    });

    const patientWithoutIdNumber = assertPrune<EmsPatient.GetPatientDetailDTO>({
      ...patient,
      patient_identity_number: decryptedIdentityNumber,
    });
    return patientWithoutIdNumber;
  }

  async getPatientList() {
    const patientList = await this.prismaService.ems_Patient.findMany({
      include: {},
    });
    return patientList;
  }
}
