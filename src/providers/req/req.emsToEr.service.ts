import { PrismaService } from '@common/prisma/prisma.service';
import { filterByDistance } from '@common/util/filterByDistance';
import { DEFAULT_REQUEST_DISTANCE } from '@config/constant';
import { EMS_PATIENT_ERROR, isError } from '@config/errors';
import { REQ_EMS_TO_ER_ERROR } from '@config/errors/req.error';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma, RequestStatus, ems_PatientStatus } from '@prisma/client';
import { ErEmergencyCenterService } from '@src/providers/er/er.emergencyCenter.service';
import { ReqEmsToEr } from '@src/providers/interface/req/req.emsToEr.interface';
import typia from 'typia';
import { assertPrune } from 'typia/lib/misc';
import { EmsPatientService } from '../ems/ems.patient.service';

@Injectable()
export class ReqEmsToErService {
  private readonly logger = new Logger(ReqEmsToErService.name);

  constructor(
    private readonly emsPatinetService: EmsPatientService,
    private readonly erEmergencyCenterService: ErEmergencyCenterService,
    private readonly prismaService: PrismaService,
  ) {}

  // TODO: 증상 요약 및 병원 상태에 따른 정리 필요
  /**
   * TODO: 병원 요청 횟수 및 거리 고민 필요 (현재는 5분당 10KM씩 늘려가며 요청)
   *
   * 현재 생기고 있는 문제점
   * 처음 요청시 10km이내에 응급실이 없는경우, 요청이 되고 있지 않음.
   * 이를 개선할 수 있는 방법으로는 요청횟수(N)별 거리를 늘리는 것이 아닌 병원개수를 늘리는 방법이 있음
   * 하지만, 이경우 한번에 요청되는 병원의 수가 정해져 있어 환자와 병원의 매칭이 느려질 수 있음
   *
   */
  async createEmsToErRequest({
    user,
    n = 1,
  }: ReqEmsToEr.CreateEmsToErRequestArg): Promise<
    | ReqEmsToEr.CreateEmsToErRequestReturn
    | REQ_EMS_TO_ER_ERROR.PENDING_PATIENT_NOT_FOUND
    | EMS_PATIENT_ERROR.PATIENT_NOT_FOUND
  > {
    const { employee_id } = user;
    //TODO: MSA 서버 분리시 api 호출로 변경
    const patient = await this.emsPatinetService.getPatientDetailwithEmsEmployee({
      ems_employee_id: employee_id,
      patient_status: n === 1 ? ems_PatientStatus.PENDING : ems_PatientStatus.REQUESTED,
    });
    if (isError(patient)) return patient;

    const { patient_id, patient_latitude, patient_longitude, patient_severity, employee } = patient;
    const { ambulance_company } = employee;

    const emergencyCenterList =
      await this.erEmergencyCenterService.getSortedEmergencyCenterListByDistanceFromCurrentLocation({
        latitude: patient_latitude,
        longitude: patient_longitude,
      });
    const targetEmergencyCenterList = filterByDistance(emergencyCenterList, n, DEFAULT_REQUEST_DISTANCE);

    const createManyRequestInput = targetEmergencyCenterList.map((emergencyCenter) => {
      const {
        emergency_center_id,
        emergency_center_name,
        emergency_center_latitude,
        emergency_center_longitude,
        distance,
      } = emergencyCenter;
      return {
        patient_id,
        emergency_center_id,
        emergency_center_name,
        emergency_center_latitude,
        emergency_center_longitude,
        distance,
      };
    });

    console.log(createManyRequestInput);
    // TODO: 증상 요약 적용 필요
    const createReqPatientInput = {
      patient_id,
      patient_name: patient.patient_name,
      patient_birth: patient.patient_birth,
      patient_gender: patient.patient_gender,
      patient_symptom_summary: '',
      patient_severity: patient_severity,
      patient_latitude: patient.patient_latitude,
      patient_longitude: patient.patient_longitude,
      ambulance_company_id: ambulance_company.ambulance_company_id,
      ambulance_company_name: ambulance_company.ambulance_company_name,
      ems_employee_id: employee_id,
      ems_employee_name: patient.employee.employee_name,
    };

    if (n === 1) {
      //첫번째 요청의 경우 req_patient 생성
      const createReqPatient = this.prismaService.req_Patient.create({
        data: {
          ...createReqPatientInput,
          ems_to_er_request: {
            createMany: {
              data: assertPrune<Prisma.req_EmsToErRequestCreateManyPatientInput[]>(createManyRequestInput),
            },
          },
        },
        include: {
          ems_to_er_request: true,
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
      const [patientInfo] = await this.prismaService.$transaction([createReqPatient, updateEmsPatient]);
      if (!patientInfo) {
        return typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>();
      }
      const { ems_to_er_request, ...patient_info } = patientInfo;
      const target_emergency_center_list = filterByDistance(ems_to_er_request, n, DEFAULT_REQUEST_DISTANCE);

      return { target_emergency_center_list, patient: patient_info };
    }

    const findReqPatient = this.prismaService.req_Patient.findFirst({
      where: {
        patient_id,
      },
      include: {
        ems_to_er_request: true,
      },
    });

    const createReuest = this.prismaService.req_EmsToErRequest.createMany({
      data: createManyRequestInput,
    });

    const updateEmsPatient = this.prismaService.ems_Patient.update({
      where: {
        patient_id: patient.patient_id,
      },
      data: {
        patient_status: ems_PatientStatus.REQUESTED,
      },
    });

    const transactionResult = await this.prismaService.$transaction([createReuest, findReqPatient, updateEmsPatient]);
    const [, patientInfo] = transactionResult;
    if (!patientInfo) {
      return typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>();
    }

    const { ems_to_er_request, ...patient_info } = patientInfo;
    const target_emergency_center_list = filterByDistance(ems_to_er_request, n, DEFAULT_REQUEST_DISTANCE);
    return { target_emergency_center_list, patient: patient_info };
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
    reject_reason,
    response,
  }: ReqEmsToEr.RespondErToEmsRequest): Promise<
    | ReqEmsToEr.ResopndErToEmsRequestReturn
    | REQ_EMS_TO_ER_ERROR.REQUEST_NOT_FOUND
    | REQ_EMS_TO_ER_ERROR.REQUEST_ALREADY_PROCESSED
  > {
    const { emergency_center_id } = user;
    const reqEmsToErRequest = await this.prismaService.req_EmsToErRequest.findFirst({
      where: {
        patient_id,
        emergency_center_id,
      },
      include: {
        patient: true,
      },
    });

    if (!reqEmsToErRequest) {
      return typia.random<REQ_EMS_TO_ER_ERROR.REQUEST_NOT_FOUND>();
    }
    const { request_status, patient } = reqEmsToErRequest;
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
    const [_response] = await this.prismaService.$transaction([
      this.prismaService.req_EmsToErRequest.update({
        where: {
          patient_id_emergency_center_id: {
            patient_id,
            emergency_center_id,
          },
        },
        data: {
          request_status: response,
          response_date: new Date().toISOString(),
          ...(reject_reason && {
            reject_reason,
          }),
        },
      }),
      ...update,
    ]);

    const complete_req_list =
      response === RequestStatus.ACCEPTED
        ? await this.prismaService.req_EmsToErRequest.findMany({
            where: {
              patient_id,
              request_status: RequestStatus.COMPLETED,
            },
          })
        : [];

    return { patient, complete_req_list, response: _response };
  }

  async batchNewEmsToErRequest() {
    const now = new Date();

    /**
     * 기능요구사항
     *
     * 1. 요청이 생성 된 이후 매 1분간격으로 응답을 받지 못한 요청, 완료되지 않은 요청을 조회한다.
     *
     * 2. 그중 5분 이상 응답을 받지 못한 요청은 다음 요청을 생성한다.
     *
     * 3. 마지막 요청한지 5분이 지난 요청을 조회한다.
     *
     * 4. 조회된 요청중 5분이 지난 요청은 다음 요청을 생성한다.
     */

    const requested_patient = await this.prismaService.req_Patient.findMany({
      where: {
        ems_to_er_request: {
          every: {
            request_status: {
              in: ['REQUESTED', 'VIEWED', 'REJECTED'], // 응답을 받지 못한 요청, 완료되지 않은 요청
            },
          },
        },
      },
      include: {
        ems_to_er_request: true,
      },
    });

    const filteredLastredRequestAfter5Min: ReqEmsToEr.CreateEmsToErRequestArg[] = requested_patient
      .map((patient) => {
        const { ems_to_er_request, ems_employee_id, ambulance_company_id } = patient;
        const sorted_emergency_center_list_by_distance = ems_to_er_request.sort((a, b) => b.distance - a.distance);
        const last_request = sorted_emergency_center_list_by_distance[0];
        const { request_date, distance } = last_request;
        const diff = now.getTime() - new Date(request_date).getTime();
        const diffMin = Math.floor(diff / 60000);
        const request_n = Math.floor(distance / DEFAULT_REQUEST_DISTANCE) + 1;
        if (diffMin > 5) {
          return {
            user: {
              employee_id: ems_employee_id,
              ambulance_company_id,
            },
            n: request_n + 1,
            type: 'batch',
          };
        }
        return undefined;
      })
      .filter((r) => r !== undefined) as ReqEmsToEr.CreateEmsToErRequestArg[];
    const newRequest = await Promise.all(
      filteredLastredRequestAfter5Min.map(async (input) => {
        return await this.createEmsToErRequest(input);
      }),
    );
    return newRequest;
  }
}
