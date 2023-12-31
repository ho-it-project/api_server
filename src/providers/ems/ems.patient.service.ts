import { CryptoService } from '@common/crypto/crypto.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { EMS_PATIENT_ERROR, isError } from '@config/errors';
import { Injectable } from '@nestjs/common';
import { Prisma, RequestStatus, ems_Patient } from '@prisma/client';
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
    const { patient_identity_number, patient_guardian, rapid_evaluation, ...patient } = patientInfo;
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
        ...(rapid_evaluation && {
          rapid: {
            create: { ...rapid_evaluation },
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
        rapid: true,
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

  async updatePatientStatus({
    user,
    patient_id,
    patient_status,
  }: EmsPatient.UpdatePatientStatus): Promise<
    | true
    | EMS_PATIENT_ERROR.PATIENT_NOT_FOUND
    | EMS_PATIENT_ERROR.FORBIDDEN
    | EMS_PATIENT_ERROR.PATIENT_NOT_ACCEPTED
    | EMS_PATIENT_ERROR.PATIENT_CANCEL_NOT_ALLOWED
    | EMS_PATIENT_ERROR.PATIENT_CANCEL_ALREADY
    | EMS_PATIENT_ERROR.PATIENT_COMPLETE_ALREADY
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
    const { ems_employee_id, patient_status: exist_patient_status } = existPatient;
    if (ems_employee_id !== employee_id) {
      return typia.random<EMS_PATIENT_ERROR.FORBIDDEN>();
    }

    if (exist_patient_status === 'CANCELED') {
      // 이미 취소된 환자는 상태를 변경할 수 없다.
      return typia.random<EMS_PATIENT_ERROR.PATIENT_CANCEL_ALREADY>();
    }
    if (exist_patient_status === 'COMPLETED') {
      return typia.random<EMS_PATIENT_ERROR.PATIENT_COMPLETE_ALREADY>();
    }
    if (patient_status === 'COMPLETED' && exist_patient_status !== 'ACCEPTED') {
      return typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_ACCEPTED>();
    }
    if (patient_status === 'CANCELED' && exist_patient_status === 'REQUESTED') {
      // 요청진행중인 환자 취소는 불가능 하다.
      return typia.random<EMS_PATIENT_ERROR.PATIENT_CANCEL_NOT_ALLOWED>();
    }

    const updateData = {
      patient_status: patient_status,
      ...(patient_status === 'COMPLETED' && {
        complete_date: new Date().toISOString(),
      }),
    };

    const emsPatientUpdate = this.prismaService.ems_Patient.update({
      where: {
        patient_id,
      },
      data: updateData,
    });

    const reqEmsToErRequestUpdata = this.prismaService.req_EmsToErRequest.updateMany({
      where: {
        patient_id,
        request_status: 'ACCEPTED' as RequestStatus,
      },
      data: {
        request_status: 'COMPLETED' as RequestStatus,
      },
    });

    await this.prismaService.$transaction([emsPatientUpdate, reqEmsToErRequestUpdata]);

    return true;
  }

  async getPatientDetailwithEmsEmployee(where: Prisma.ems_PatientFindFirstArgs['where']) {
    const patient = await this.prismaService.ems_Patient.findFirst({
      where,
      include: {
        employee: {
          include: {
            ambulance_company: true,
          },
        },
        abcde: true,
        sample: true,
        vs: true,
        dcap_btls: true,
        opqrst: true,
      },
    });
    if (!patient) {
      return typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>();
    }
    return patient;
  }
}
