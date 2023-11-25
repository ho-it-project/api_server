import { PrismaService } from '@common/prisma/prisma.service';
import { ER_REQUEST_PATIENT_ERROR, isError } from '@config/errors';
import { Injectable } from '@nestjs/common';
import { er_PatientLogType } from '@prisma/client';
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

    const emsPatient = await this.getEmsPatientDetail(patient_id);
    if (isError(emsPatient)) return emsPatient;

    return { patient: emsPatient };
  }

  async assignRequestPatient({
    user,
    patient_id,
    emergency_room_id,
    emergency_room_bed_num,
    doctor_id,
    nurse_id,
  }: ErRequestPatient.AssignRequestPatientArg) {
    const { emergency_center_id, hospital_id } = user;
    const reqPatient = await this.prismaService.req_Patient.findUnique({
      where: {
        patient_id,
        ems_to_er_request: {
          some: {
            emergency_center_id,
            request_status: 'ACCEPTED',
          },
        },
      },
    });
    if (!reqPatient) return typia.random<ER_REQUEST_PATIENT_ERROR.REQUEST_PATIENT_NOT_EXIST>();

    const emsPatient = await this.getEmsPatientDetail(patient_id);
    if (isError(emsPatient)) return emsPatient;

    const emergencyRoom = await this.prismaService.er_EmergencyRoomBed.findUnique({
      where: {
        emergency_room_id_emergency_room_bed_num: {
          emergency_room_id,
          emergency_room_bed_num,
        },
        emergency_room: {
          emergency_center_id,
        },
      },
      include: {
        emergency_room_bed_logs: true,
      },
    });
    if (!emergencyRoom) return typia.random<ER_REQUEST_PATIENT_ERROR.EMERGENCY_BED_NOT_FOUND>();
    if (emergencyRoom.emergency_room_bed_status !== 'AVAILABLE')
      return typia.random<ER_REQUEST_PATIENT_ERROR.ER_BED_NOT_AVAILABLE>();

    const doctorAndNurse = await this.getErDoctorAndNurse({ emergency_center_id, doctor_id, nurse_id });
    if (isError(doctorAndNurse)) return doctorAndNurse;
    const { guardian } = emsPatient;
    const logs = await this.processEmsPatientEvaluationToErLog(emsPatient, user);
    const erPatientCreateData = this.transformEmsPatientToErPatient(emsPatient, doctor_id, nurse_id);

    const createErPatient = this.prismaService.er_Patient.create({
      data: {
        ...erPatientCreateData,
        ...(guardian && {
          guardian: {
            create: {
              guardian_name: guardian.guardian_name,
              guardian_phone: guardian.guardian_phone,
              guardian_address: guardian.guardian_address,
              guardian_relation: guardian.guardian_relation,
            },
          },
        }),
        patient_logs: {
          createMany: {
            data: logs,
          },
        },
        patient_hospitals: {
          create: {
            hospital_id,
            patient_status: 'ADMISSION',
          },
        },
      },
    });
    const createBadLog = this.prismaService.er_EmergencyRoomBedLog.create({
      data: {
        emergency_room_id,
        emergency_room_bed_num,
        emergency_room_bed_status: 'OCCUPIED',
        patient_id,
      },
    });
    const updateEmergencyRoomBed = this.prismaService.er_EmergencyRoomBed.update({
      where: {
        emergency_room_id_emergency_room_bed_num: {
          emergency_room_id,
          emergency_room_bed_num,
        },
      },
      data: {
        patient_id,
        emergency_room_bed_status: 'OCCUPIED',
      },
    });
    const updateEmsPatient = this.prismaService.ems_Patient.update({
      where: {
        patient_id,
      },
      data: {
        patient_status: 'COMPLETED',
      },
    });
    const updateRequest = this.prismaService.req_EmsToErRequest.update({
      where: {
        patient_id_emergency_center_id: {
          patient_id,
          emergency_center_id,
        },
      },
      data: {
        request_status: 'COMPLETED',
      },
    });
    await this.prismaService.$transaction([
      createErPatient,
      createBadLog,
      updateEmergencyRoomBed,
      updateEmsPatient,
      updateRequest,
    ]);

    return 'SUCCESS';
  }

  async getEmsPatientDetail(patient_id: string) {
    const emsPatient = await this.prismaService.ems_Patient.findUnique({
      where: {
        patient_id,
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

    return emsPatient;
  }

  async processEmsPatientEvaluationToErLog(
    emsPatient: ErRequestPatient.GetRequestedPatient['patient'],
    user: ErAuth.AccessTokenSignPayload,
  ) {
    const { rapid, abcde, vs, opqrst, sample, dcap_btls, employee, created_at } = emsPatient;
    const { ambulance_company, employee_name } = employee;
    const { ambulance_company_name } = ambulance_company;
    const emsEmployeeLog = {
      log_type: 'EMS_LOG' as er_PatientLogType,
      log_desc: `[EMS] ${employee_name}(${ambulance_company_name})`,
      log_date: created_at,
      employee_id: user.employee_id,
    };

    const rapidLogs = rapid.map((rapid) => {
      const { trauma, clear, conscious, created_at } = rapid;
      const log_desc = `[RAPID] 외상 : ${trauma}, 의식 : ${conscious}, 피부 : ${clear}`;
      return {
        log_type: 'EMS_LOG' as er_PatientLogType,
        log_desc,
        log_date: created_at,
        employee_id: user.employee_id,
      };
    });

    const abcdeLogs = abcde.map((abcde) => {
      const {
        airway_status,
        breathing_rate,
        breathing_quality,
        circulation_pulse,
        circulation_systolic_blood_pressure,
        circulation_diastolic_blood_pressure,
        disability_avpu,
        exposure_notes,
      } = abcde;
      const log_desc = `
      [ABCDE]
      기도 : ${airway_status}, 
      호흡 : ${breathing_rate}, 
      순환 : ${circulation_pulse}, 
      신경 : ${disability_avpu}, 
      피부 : ${exposure_notes}, 
      통증 : ${breathing_quality}, 
      혈압 : ${circulation_systolic_blood_pressure}/${circulation_diastolic_blood_pressure}`;
      return {
        log_type: 'EMS_LOG' as er_PatientLogType,
        log_desc: log_desc.replace(/\s/g, ''),
        log_date: abcde.created_at,
        employee_id: user.employee_id,
      };
    });

    const vsLogs = vs.map((vs) => {
      const { temperature, heart_rate, respiratory_rate, systolic_blood_pressure, diastolic_blood_pressure } = vs;

      const log_desc = `
      [VS]
      체온 : ${temperature},
      맥박 : ${heart_rate},
      호흡 : ${respiratory_rate},
      혈압 : ${systolic_blood_pressure}/${diastolic_blood_pressure}
      `;
      return {
        log_type: 'EMS_LOG' as er_PatientLogType,
        log_desc: log_desc.replace(/\s/g, ''),
        log_date: vs.created_at,
        employee_id: user.employee_id,
      };
    });

    const opqrstLogs = opqrst.map((opqrst) => {
      const { onset, provocation, quality, radiation, severity, time } = opqrst;
      const log_desc = `
      [OPQRST]
      발병 : ${onset},
      유발 : ${provocation},
      특징 : ${quality},
      방사 : ${radiation},
      심각도 : ${severity},
      시간 : ${new Date(time).toLocaleString()}`;
      return {
        log_type: 'EMS_LOG' as er_PatientLogType,
        log_desc: log_desc.replace(/\s/g, ''),
        log_date: opqrst.created_at,
        employee_id: user.employee_id,
      };
    });

    const sampleLogs = sample.map((sample) => {
      //   sample: {
      //     patient_id: string;
      //     signs_symptoms: string;
      //     allergies: string;
      //     medications: string;
      //     past_medical_history: string;
      //     last_oral_intake: Date;
      //     events_leading_to_illness: string;
      //     created_at: Date;
      //     updated_at: Date;
      //     status: $Enums.Status;
      // }
      const {
        signs_symptoms,
        allergies,
        medications,
        past_medical_history,
        last_oral_intake,
        events_leading_to_illness,
        created_at,
      } = sample;

      const log_desc = `
      [SAMPLE]
      증상 : ${signs_symptoms},
      알레르기 : ${allergies},
      약물 : ${medications},
      과거력 : ${past_medical_history},
      경과 : ${events_leading_to_illness},
      경구 : ${new Date(last_oral_intake).toLocaleString()}`;
      return {
        log_type: 'EMS_LOG' as er_PatientLogType,
        log_desc: log_desc.replace(/\s/g, ''),
        log_date: created_at,
        employee_id: user.employee_id,
      };
    });

    const dcap_btlsLogs = dcap_btls.map((dcap_btls) => {
      const { deformity, contusion, abrasion, puncture, burn, tenderness, laceration, swelling } = dcap_btls;
      const log_desc = `
      [DCAP-BTLS]
      변형 : ${deformity},
      타박상 : ${contusion},
      찰과상 : ${abrasion},
      찔림 : ${puncture},
      화상 : ${burn},
      통증 : ${tenderness},
      찢김 : ${laceration},
      부종 : ${swelling}`;
      return {
        log_type: 'EMS_LOG' as er_PatientLogType,
        log_desc: log_desc.replace(/\s/g, ''),
        log_date: dcap_btls.created_at,
        employee_id: user.employee_id,
      };
    });

    const logs = [emsEmployeeLog, rapidLogs, abcdeLogs, vsLogs, opqrstLogs, sampleLogs, dcap_btlsLogs].flat();
    return logs;
  }

  transformEmsPatientToErPatient(
    emsPatient: ErRequestPatient.GetRequestedPatient['patient'],
    doctor_id: string,
    nurse_id: string,
  ) {
    const {
      patient_id,
      patient_name,
      patient_birth,
      patient_identity_number,
      patient_gender,
      patient_phone,
      patient_address,
      guardian_id,
    } = emsPatient;

    return {
      patient_id,
      patient_name,
      patient_birth,
      patient_identity_number,
      patient_gender,
      patient_phone,
      patient_address,
      guardian_id,
      doctor_id,
      nurse_id,
    };
  }

  async getErDoctorAndNurse({
    emergency_center_id,
    doctor_id,
    nurse_id,
  }: {
    emergency_center_id: string;
    nurse_id: string;
    doctor_id: string;
  }) {
    const doctor = await this.prismaService.er_Employee.findUnique({
      where: {
        employee_id: doctor_id,
        hospital: {
          emergency_center: {
            some: {
              emergency_center_id,
            },
          },
        },
        role: {
          in: ['RESIDENT', 'SPECIALIST'],
        },
      },
    });
    if (!doctor) return typia.random<ER_REQUEST_PATIENT_ERROR.DOCTOR_NOT_EXIST>();

    const nurse = await this.prismaService.er_Employee.findUnique({
      where: {
        employee_id: nurse_id,
        hospital: {
          emergency_center: {
            some: {
              emergency_center_id,
            },
          },
        },
        role: {
          in: ['NURSE'],
        },
      },
    });
    if (!nurse) return typia.random<ER_REQUEST_PATIENT_ERROR.NURCE_NOT_EXIST>();

    return { doctor, nurse };
  }
}
