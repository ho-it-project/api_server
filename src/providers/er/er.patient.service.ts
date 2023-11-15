import { CryptoService } from '@common/crypto/crypto.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { isDoctor } from '@common/util/isDoctor';
import { ER_PATIENT_ERROR } from '@config/errors';
import { Injectable } from '@nestjs/common';
import typia from 'typia';
import { v4 } from 'uuid';
import { ErPatient } from '../interface/er/er.patient.interface';

@Injectable()
export class ErPatientService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}
  async createPatient({
    user,
    patient_info,
  }: ErPatient.CreatePatient): Promise<
    ER_PATIENT_ERROR.NURCE_NOT_EXIST | ER_PATIENT_ERROR.DOCTOR_NOT_EXIST | ErPatient.CreatePatientReturn
  > {
    const { hospital_id } = user;
    const { guardian, doctor_id, nurse_id, patient_identity_number, ...patient } = patient_info;

    const nurse = await this.prismaService.er_Employee.findUnique({
      where: { employee_id: nurse_id, hospital_id },
    });
    if (!nurse) return typia.random<ER_PATIENT_ERROR.NURCE_NOT_EXIST>();
    if (nurse.role !== 'NURSE') return typia.random<ER_PATIENT_ERROR.NURCE_NOT_EXIST>();

    const doctor = await this.prismaService.er_Employee.findUnique({
      where: { employee_id: doctor_id, hospital_id },
    });
    if (!doctor) return typia.random<ER_PATIENT_ERROR.DOCTOR_NOT_EXIST>();
    if (!isDoctor(doctor.role)) return typia.random<ER_PATIENT_ERROR.DOCTOR_NOT_EXIST>();

    const salt = v4();
    // 주민등록번호 뒷자리 암호화
    const encryptedIdentityNumber = await this.cryptoService.encrypt({
      data: patient_identity_number,
      salt,
    });

    // const patient_id = v4();
    const newPatient = await this.prismaService.er_Patient.create({
      data: {
        ...patient,
        patient_identity_number: encryptedIdentityNumber,
        nurse: {
          connect: { employee_id: nurse_id },
        },
        doctor: {
          connect: { employee_id: doctor_id },
        },
        ...(guardian && {
          guardian_id: v4(),
          guardian: {
            create: { ...guardian },
          },
        }),
        patient_hospitals: {
          create: {
            hospital: {
              connect: { hospital_id },
            },
          },
        },
        patient_salt: {
          create: {
            salt,
          },
        },
      },
      include: {
        guardian: true,
      },
    });
    return newPatient;
  }
}
