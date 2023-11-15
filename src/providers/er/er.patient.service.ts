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
    private readonly cryptoService: CryptoService, // private readonly eventEmitter: EventEmitter2,
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

  async recordPatientLog({ user, patient_id, patient_log }: ErPatient.RecordPatientLog) {
    const { hospital_id, employee_id } = user;
    const { log_type } = patient_log;
    const existPatient = await this.prismaService.er_PatientHospital.findUnique({
      where: { patient_id_hospital_id: { patient_id, hospital_id } },
    });
    if (!existPatient) return typia.random<ER_PATIENT_ERROR.PATIENT_NOT_EXIST>();
    // if (log_type === 'DISCHARGE') {
    //   // TODO : 환자 퇴원 이벤트 onEvent
    //   this.eventEmitter.emit('DISCHARGE', { patient_id, hospital_id }); // 환자 퇴원 이벤트
    //   // 만약 환자가 퇴원하면 환자의 병상을 비워줘야한다.
    //   // 병상 비우는 것에 실패하면 ??
    //   // 배치 작업으로 비워줘야한다.
    // }
    // if (log_type === 'TRANSFER') {
    //   // TODO : 환자 전원 이벤트 onEvent
    //   this.eventEmitter.emit('TRANSFER', { patient_id, hospital_id }); // 환자 전원 이벤트
    // }

    const emergencyBed = await this.prismaService.er_EmergencyRoom.findFirst({
      where: {
        emergency_room_beds: {
          some: {
            emergency_room_bed_status: 'OCCUPIED',
            emergency_room_bed_logs: {
              some: {
                patient_id,
                emergency_room_bed_status: 'OCCUPIED',
              },
            },
          },
        },
      },
      include: {
        emergency_room_beds: {
          include: {
            emergency_room_bed_logs: {
              where: {
                patient_id,
                emergency_room_bed_status: 'OCCUPIED',
              },
            },
          },
        },
      },
    });
    const createPatientLog = this.prismaService.er_PatientLog.create({
      data: {
        ...patient_log,
        patient_id,
        employee_id,
      },
    });

    // 아래 로직을 이벤트로 처리해야함. 만약 해당 이벤트가 실패할시 주기적으로 배치작업으로 처리해야함.
    // 이유: 환자에대한 로직을 처리하는 service에서 병상에 대한 로직을 처리하는 service를 호출하면 의존성이 생기기 때문에
    // TODO: REFACOTRING 필요 (의존성 제거 및 이벤트 처리, 배치처리)
    const changeBedStatus =
      (log_type === 'DISCHARGE' || log_type === 'TRANSFER') && emergencyBed
        ? [
            this.prismaService.er_EmergencyRoomBed.update({
              where: {
                emergency_room_id_emergency_room_bed_num: {
                  emergency_room_id: emergencyBed.emergency_room_id,
                  emergency_room_bed_num: emergencyBed.emergency_room_beds[0].emergency_room_bed_num,
                },
              },
              data: {
                emergency_room_bed_status: 'AVAILABLE',
                emergency_room_bed_logs: {
                  create: {
                    patient_id,
                    emergency_room_bed_status: 'AVAILABLE',
                  },
                },
              },
            }),
          ]
        : [];

    await this.prismaService.$transaction([...changeBedStatus, createPatientLog]);
    return 'SUCCESS';
  }
}
