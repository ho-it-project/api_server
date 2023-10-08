import { CryptoService } from '@common/crypto/crypto.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { EMS_PATIENT_ERROR, isError } from '@config/errors';
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
    const { patient_id } = newPatient;
    return { patient_id };
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

    const patientWithoutIdNumber = assertPrune<EmsPatient.GetPatientDetailReturn>({
      ...patient,
      patient_identity_number: decryptedIdentityNumber,
    });
    return patientWithoutIdNumber;
  }

  async getPatientList({ query, user }: EmsPatient.GetPatientListDTO): Promise<EmsPatient.GetPatientListReturn> {
    const {
      page = 1,
      limit = 10,
      patient_emergency_cause = [],
      patient_severity = [],
      patient_status = [],
      search_type,
      search,
      gender,
    } = query;
    const skip = (page - 1) * limit;
    const { employee_id } = user;

    const where = {
      ems_employee_id: employee_id,
      ...(patient_status.length > 0 && {
        patient_status: {
          in: patient_status,
        },
      }),
      ...(patient_emergency_cause.length > 0 && {
        patient_emergency_cause: {
          in: patient_emergency_cause,
        },
      }),
      ...(patient_severity.length > 0 && {
        patient_severity: {
          in: patient_severity,
        },
      }),
      ...(search_type &&
        search && {
          [search_type]: {
            contains: search,
          },
        }),
      ...(gender && {
        patient_gender: gender,
      }),
    };
    const patientList = await this.prismaService.ems_Patient.findMany({ where, skip, take: limit });
    const count = await this.prismaService.ems_Patient.count({ where });
    const patient_list = assertPrune<EmsPatient.GetPatientListReturn['patient_list']>(patientList);
    return {
      patient_list,
      count,
    };
  }

  async createABCDEAssessment({ ems_employee_id, patient_id, abcde_assessment }: EmsPatient.CreateABCDEAssessment) {
    const checkExistAndIncharge = await this.checkPaitentIncharge(patient_id, ems_employee_id);
    if (isError(checkExistAndIncharge)) return checkExistAndIncharge;
    const newAssessment = await this.prismaService.ems_ABCDE_Assessment.create({
      data: {
        ...abcde_assessment,
        patient_id,
      },
    });
    return newAssessment;
  }

  async createDCAP_BTLSAssessment({
    ems_employee_id,
    patient_id,
    dcap_btls_assessment,
  }: EmsPatient.CreateDCAP_BTLSAssessment) {
    const checkExistAndIncharge = await this.checkPaitentIncharge(patient_id, ems_employee_id);
    if (isError(checkExistAndIncharge)) return checkExistAndIncharge;

    const newAssessment = await this.prismaService.ems_DCAP_BTLS_Assessment.create({
      data: {
        ...dcap_btls_assessment,
        patient_id,
      },
    });
    return newAssessment;
  }
  async createVSAssessment({ ems_employee_id, patient_id, vs_assessment }: EmsPatient.CreateVSAssessment) {
    const checkExistAndIncharge = await this.checkPaitentIncharge(patient_id, ems_employee_id);
    if (isError(checkExistAndIncharge)) return checkExistAndIncharge;

    const newAssessment = await this.prismaService.ems_VS_Assessment.create({
      data: {
        ...vs_assessment,
        patient_id,
      },
    });
    return newAssessment;
  }
  async createSAMPLEAssessment({ ems_employee_id, patient_id, sample_assessment }: EmsPatient.CreateSAMPLEAssessment) {
    const checkExistAndIncharge = await this.checkPaitentIncharge(patient_id, ems_employee_id);
    if (isError(checkExistAndIncharge)) return checkExistAndIncharge;
    const newAssessment = await this.prismaService.ems_SAMPLE_Assessment.create({
      data: {
        patient_id,
        ...sample_assessment,
      },
    });
    return newAssessment;
  }
  async createOPQRSTAssessment({ ems_employee_id, patient_id, opqrst_assessment }: EmsPatient.CreateOPQRSTAssessment) {
    const checkExistAndIncharge = await this.checkPaitentIncharge(patient_id, ems_employee_id);
    if (isError(checkExistAndIncharge)) return checkExistAndIncharge;

    const newAssessment = await this.prismaService.ems_OPQRST_Assessment.create({
      data: {
        ...opqrst_assessment,
        patient_id,
      },
    });
    return newAssessment;
  }

  async checkPaitentIncharge(patient_id: string, employee_id: string) {
    const existPatient = await this.prismaService.ems_Patient.findUnique({
      where: {
        patient_id,
      },
    });
    if (!existPatient) {
      return typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>();
    }
    if (existPatient.ems_employee_id !== employee_id) {
      return typia.random<EMS_PATIENT_ERROR.FORBIDDEN>();
    }
    return true;
  }

  async completePatient({
    user,
    patient_id,
  }: EmsPatient.CompletePatient): Promise<
    true | EMS_PATIENT_ERROR.PATIENT_NOT_FOUND | EMS_PATIENT_ERROR.FORBIDDEN | EMS_PATIENT_ERROR.PATIENT_NOT_ACCEPTED
  > {
    const { employee_id } = user;

    const existPatient = await this.prismaService.ems_Patient.findUnique({
      where: {
        patient_id,
      },
    });

    if (!existPatient) {
      return typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>();
    }
    const { ems_employee_id, patient_status } = existPatient;
    if (ems_employee_id !== employee_id) {
      return typia.random<EMS_PATIENT_ERROR.FORBIDDEN>();
    }
    if (patient_status !== 'ACCEPTED') {
      return typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_ACCEPTED>();
    }

    await this.prismaService.ems_Patient.update({
      where: {
        patient_id,
      },
      data: {
        patient_status: 'COMPLETED',
        complete_date: new Date().toISOString(),
      },
    });

    return true;
  }
}
