import { PrismaService } from '@common/prisma/prisma.service';
import { sortByDistanceFromCurrentLocation } from '@common/util/sortByDistanceFromCurrentLocation';
import { REQ_EMS_TO_ER_ERROR } from '@config/errors/req.error';
import { Injectable } from '@nestjs/common';
import { ems_PatientStatus } from '@prisma/client';
import { EmsAuth } from '@src/auth/interface';
import typia from 'typia';

@Injectable()
export class ReqEmsToErService {
  constructor(private readonly prismaService: PrismaService) {}

  async createEmsToErRequest(user: EmsAuth.AccessTokenSignPayload) {
    const { employee_id, ambulance_company_id } = user;

    //TODO: 서버 분리시 api 호출로 변경
    const patient = await this.prismaService.ems_Patient.findFirst({
      where: {
        ems_employee_id: employee_id,
        patient_status: ems_PatientStatus.PENDING,
      },
      include: {
        employee: true,
        abcde: true,
        sample: true,
        vs: true,
        dcap_btls: true,
        opqrst: true,
      },
    });
    //TODO: 서버 분리시 api 호출로 후 캐시로 변경
    const ambulanceCompany = await this.prismaService.ems_AmbulanceCompany.findFirst({
      where: {
        ambulance_company_id,
      },
    });
    if (!patient) {
      return typia.random<REQ_EMS_TO_ER_ERROR.PENDING_PATIENT_NOT_FOUND>();
    }

    if (!ambulanceCompany) {
      return typia.random<REQ_EMS_TO_ER_ERROR.AMBULANCE_COMPANY_NOT_FOUND>();
    }

    const { patient_latitude, patient_longitude, patient_severity } = patient;
    //TODO: 캐시로 변경
    const emergencyCenterList = await this.prismaService.er_EmergencyCenter.findMany({});

    //TODO: 진료가능, 응급실 여부 .... 등등 적용필요
    const sortedEmergencyCenterList = sortByDistanceFromCurrentLocation({
      latitude: patient_latitude,
      longitude: patient_longitude,
      list: emergencyCenterList,
      objLatitudeKey: 'emergency_center_latitude',
      objLongitudeKey: 'emergency_center_longitude',
    }).filter((emergencyCenter) => emergencyCenter.distance <= 10000); // 10km 이내

    const createManyRequestInput = sortedEmergencyCenterList.map((emergencyCenter) => {
      const {
        emergency_center_id,
        emergency_center_name,
        emergency_center_latitude,
        emergency_center_longitude,
        distance,
      } = emergencyCenter;
      return {
        emergency_center_id,
        emergency_center_name,
        emergency_center_latitude,
        emergency_center_longitude,
        distance,
      };
    });

    // TODO: 증상 요약 적용 필요
    const createReqPatientInput = {
      patient_id: patient.patient_id,
      patient_name: patient.patient_name,
      patient_birth: patient.patient_birth,
      patient_gender: patient.patient_gender,
      patient_symptom_summary: '',
      patient_severity: patient_severity,
      patient_latitude: patient.patient_latitude,
      patient_longitude: patient.patient_longitude,

      ambulance_company_id: ambulanceCompany.ambulance_company_id,
      ambulance_company_name: ambulanceCompany.ambulance_company_name,
      ems_employee_id: employee_id,
      ems_employee_name: patient.employee.employee_name,
    };

    await this.prismaService.req_Patient.create({
      data: {
        ...createReqPatientInput,
        ems_to_er_request: {
          createMany: {
            data: createManyRequestInput.map(({ emergency_center_id }) => ({
              emergency_center_id,
            })),
          },
        },
      },
    });

    // TODO: 카프카로 전송 필요

    return { target_emergency_center_list: createManyRequestInput };
  }
}
