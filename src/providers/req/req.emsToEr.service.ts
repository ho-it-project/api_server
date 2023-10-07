import { PrismaService } from '@common/prisma/prisma.service';
import { sortByDistanceFromCurrentLocation } from '@common/util/sortByDistanceFromCurrentLocation';
import { REQ_EMS_TO_ER_ERROR } from '@config/errors/req.error';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma, RequestStatus, ems_PatientStatus } from '@prisma/client';
import { EmsAuth } from '@src/auth/interface';
import typia from 'typia';
import { ReqEmsToEr } from '../interface/req/req.emsToEr.interface';

@Injectable()
export class ReqEmsToErService {
  private readonly logger = new Logger(ReqEmsToErService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async createEmsToErRequest(
    user: EmsAuth.AccessTokenSignPayload,
  ): Promise<
    | ReqEmsToEr.createEmsToErRequestReturn
    | REQ_EMS_TO_ER_ERROR.PENDING_PATIENT_NOT_FOUND
    | REQ_EMS_TO_ER_ERROR.AMBULANCE_COMPANY_NOT_FOUND
    | REQ_EMS_TO_ER_ERROR.REQUEST_ALREADY_PROCESSED
  > {
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
    if (patient.patient_status !== ems_PatientStatus.PENDING) {
      return typia.random<REQ_EMS_TO_ER_ERROR.REQUEST_ALREADY_PROCESSED>();
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

    const createReqPatient = this.prismaService.req_Patient.create({
      data: {
        ...createReqPatientInput,
        ems_to_er_request: {
          createMany: {
            data: createManyRequestInput.map(({ emergency_center_id, distance }) => ({
              emergency_center_id,
              distance,
            })),
          },
        },
      },
    });
    const updateEmsPatient = this.prismaService.ems_Patient.update({
      where: {
        patient_id: patient.patient_id,
      },
      data: {
        patient_status: ems_PatientStatus.REQUESTED,
      },
    });

    await this.prismaService.$transaction([createReqPatient, updateEmsPatient]);

    // TODO: 카프카로 전송 필요

    return { target_emergency_center_list: createManyRequestInput };
  }

  async getEmsToErRequestList({
    user,
    query,
    type,
  }: ReqEmsToEr.GetEmsToErRequestList): Promise<ReqEmsToEr.GetEmsToErRequestListReturn> {
    const {
      page = 1,
      limit = 10,
      search,
      search_type,
      request_status,
      patient_gender,
      patient_severity,
      request_start_date,
    } = query;
    const skip = (page - 1) * limit;
    const patientWhere = {
      patient_gender: patient_gender && {
        in: patient_gender,
      },
      patient_severity: patient_severity && {
        in: patient_severity,
      },
      ...(search_type &&
        search && {
          [search_type]: {
            contains: search,
          },
        }),
    };
    const targetWhere: Prisma.req_EmsToErRequestFindManyArgs['where'] =
      type === 'ems'
        ? {
            patient: {
              ems_employee_id: user.employee_id,
              ...patientWhere,
            },
          }
        : {
            emergency_center_id: user.emergency_center_id,
          };

    const where: Prisma.req_EmsToErRequestFindManyArgs['where'] = {
      request_status: request_status && {
        in: request_status,
      },
      request_date: request_start_date && {
        gte: new Date(request_start_date),
      },
      patient: patientWhere,
      ...targetWhere,
    };
    const findmanyEmsToErRequest = this.prismaService.req_EmsToErRequest.findMany({
      where,
      skip,
      take: limit,
      include: {
        patient: true,
      },
    });
    const getCount = this.prismaService.req_EmsToErRequest.count({
      where,
    });

    const [request_list, count] = await this.prismaService.$transaction([findmanyEmsToErRequest, getCount]);
    //ER 요청일 경우 조회된 요청들중 요청상태가 REQUESTED인 요청들은 VIEWED로 변경
    return { request_list, count };
  }

  async updateEmsToErRequestStatusAfterView({
    reqList,
    status,
  }: {
    reqList: { patient_id: string; emergency_center_id: string }[];
    status: RequestStatus;
  }) {
    //요청 상태 변경은 실패해도 무시
    //실패해도 무시하는 이유는 이미 요청이 처리되었거나, 요청이 취소되었을 수 있기 때문

    //TODO: reqList 카프카로 전송 필요
    //변경된 요청 상태를 카프카로 전송하여 ER에게 알림

    try {
      await this.prismaService.req_EmsToErRequest.updateMany({
        where: {
          OR: reqList,
        },
        data: {
          request_status: status,
        },
      });
    } catch {
      this.logger.error('updateEmsToErRequestStatusAfterView error');
      return;
    }
  }

  async respondEmsToErRequest({
    user,
    patient_id,
    response,
  }: ReqEmsToEr.RespondErToEmsRequest): Promise<
    { success: true } | REQ_EMS_TO_ER_ERROR.REQUEST_NOT_FOUND | REQ_EMS_TO_ER_ERROR.REQUEST_ALREADY_PROCESSED
  > {
    const { emergency_center_id } = user;
    const reqEmsToErRequest = await this.prismaService.req_EmsToErRequest.findFirst({
      where: {
        patient_id,
        emergency_center_id,
      },
    });

    if (!reqEmsToErRequest) {
      return typia.random<REQ_EMS_TO_ER_ERROR.REQUEST_NOT_FOUND>();
    }
    const { request_status } = reqEmsToErRequest;
    // 이미 처리된 요청이거나, 취소된 요청이거나 완료된 요청이면 에러

    if (request_status === 'ACCEPTED' || request_status === 'CANCELED' || request_status === 'COMPLETED') {
      return typia.random<REQ_EMS_TO_ER_ERROR.REQUEST_ALREADY_PROCESSED>();
    }
    const update =
      response === RequestStatus.ACCEPTED
        ? [
            //요청이 수락되면 다른 요청들은 모두 완료처리
            this.prismaService.req_EmsToErRequest.updateMany({
              where: {
                patient_id,
                NOT: {
                  emergency_center_id,
                },
              },
              data: {
                request_status: RequestStatus.COMPLETED,
              },
            }),
            //환자 상태 변경
            this.prismaService.ems_Patient.update({
              where: {
                patient_id,
              },
              data: {
                patient_status: ems_PatientStatus.ACCEPTED,
              },
            }),
          ]
        : [];

    await this.prismaService.$transaction([
      this.prismaService.req_EmsToErRequest.update({
        where: {
          patient_id_emergency_center_id: {
            patient_id,
            emergency_center_id,
          },
        },
        data: {
          request_status: response,
        },
      }),
      ...update,
    ]);

    return { success: true };
  }
}
