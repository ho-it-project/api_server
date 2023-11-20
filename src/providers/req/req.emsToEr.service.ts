import { PrismaService } from '@common/prisma/prisma.service';
import { ER_DEPARTMENT_ERROR, isError } from '@config/errors';
import { REQ_EMS_TO_ER_ERROR } from '@config/errors/req.error';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma, RequestStatus, ems_PatientStatus } from '@prisma/client';
import { EmsAuth } from '@src/auth/interface';
import { ErEmergencyCenterService } from '@src/providers/er/er.emergencyCenter.service';
import { ReqEmsToEr } from '@src/providers/interface/req/req.emsToEr.interface';
import typia from 'typia';
import { EmsPatientService } from '../ems/ems.patient.service';

@Injectable()
export class ReqEmsToErService {
  private readonly logger = new Logger(ReqEmsToErService.name);

  constructor(
    private readonly emsPatinetService: EmsPatientService,
    private readonly erEmergencyCenterService: ErEmergencyCenterService,
    private readonly prismaService: PrismaService,
  ) {}

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
        const arg = {
          user: {
            employee_id: ems_employee_id,
            ambulance_company_id,
          },
          _type: 'BATCH',
        };
        if (!ems_to_er_request.length) return arg;
        const sorted_emergency_center_list_by_distance = ems_to_er_request.sort((a, b) => b.distance - a.distance);
        const last_request = sorted_emergency_center_list_by_distance[0];
        const { request_date } = last_request;
        const diff = now.getTime() - new Date(request_date).getTime();
        const diffMin = Math.floor(diff / 60000);
        if (diffMin > 5) {
          return arg;
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

  /**
   * # 요청관련 로직 개선
   *
   * ## 최대 100km 까지 요청을 보낼 수 있도록 변경
   * 이유: 100km거리는 최소 한시간~한시간 반 정도의 시간이 소요되는 거리이기 때문에
   * 응급상황에서 이보다 더 먼 거리는 의미없다고 판단
   * 이로써 불필요한 요청을 줄일 수 있음, (리소스 절약)
   *
   * ## 10km단위가 아닌 개수 기반으로 변경
   * 의료 낙후 지역의 경우 10km이내에 응급실이 없을 수 있음
   * 이를 해결하기 위해 10km단위가 아닌 개수 기반으로 변경
   *
   *
   *
   */
  async createEmsToErRequest({ user, department_list = [], _type = 'API' }: ReqEmsToEr.CreateEmsToErRequestArg) {
    //TODO: MSA 서버 분리시 api 호출로 변경
    const patient = await this.getOrCreateReqPatient({ user, department_list, _type });
    if (isError(patient)) return patient;

    console.log({ patient });
    //TODO: MSA 서버 분리시 api 호출로 변경 (병원 진료과목 조회)
    const { patient_latitude, patient_longitude } = patient;
    const emergencyCenterList =
      await this.erEmergencyCenterService.getSortedEmergencyCenterListByDistanceFromCurrentLocation({
        latitude: patient_latitude,
        longitude: patient_longitude,
        distance: 100,
      });

    console.log(emergencyCenterList, 'emergencyCenterList');

    const { patient_id, ems_to_er_request: prevRequest, request_department: targetDepartmentList } = patient;
    const filteredEmergencyCenterList = emergencyCenterList.filter((emergencyCenter) => {
      const exist = prevRequest.find((request) => request.emergency_center_id === emergencyCenter.emergency_center_id);
      return !exist;
    });

    const _target_emergency_list = (
      await this.getEmergencyCenterByTakeNumberAndActiveDepartments({
        emergency_center: filteredEmergencyCenterList,
        take: 10,
        department_list: targetDepartmentList.map((department) => department.department_id),
      })
    ).map((emergencyCenter) => {
      return {
        ...emergencyCenter,
        patient_id,
        distance:
          filteredEmergencyCenterList.find((e) => e.emergency_center_id === emergencyCenter.emergency_center_id)
            ?.distance || 0,
      };
    });
    console.log(_target_emergency_list, '_target_emergency_list');
    const createEmsToErRequest = this.prismaService.req_EmsToErRequest.createMany({
      data: _target_emergency_list.map((emergencyCenter) => ({
        patient_id,
        emergency_center_id: emergencyCenter.emergency_center_id,
        emergency_center_name: emergencyCenter.emergency_center_name,
        emergency_center_latitude: emergencyCenter.emergency_center_latitude,
        emergency_center_longitude: emergencyCenter.emergency_center_longitude,
        distance: emergencyCenter.distance,
      })),
    });
    const getNewRmsToErRequest = this.prismaService.req_EmsToErRequest.findMany({
      where: {
        patient_id,
        emergency_center_id: {
          in: _target_emergency_list.map((emergencyCenter) => emergencyCenter.emergency_center_id),
        },
      },
    });
    const [, target_emergency_center_list] = await this.prismaService.$transaction([
      createEmsToErRequest,
      getNewRmsToErRequest,
    ]);
    return { target_emergency_center_list, patient };
  }

  async getOrCreateReqPatient({
    user,
    department_list = [],
    _type,
  }: {
    user: Pick<EmsAuth.AccessTokenSignPayload, 'employee_id' | 'ambulance_company_id'>;
    department_list?: number[];
    _type?: 'BATCH' | 'API';
  }) {
    const emsPatient = await this.emsPatinetService.getPatientDetailwithEmsEmployee({
      ems_employee_id: user.employee_id,
      patient_status: {
        in: [ems_PatientStatus.PENDING, ems_PatientStatus.REQUESTED, ems_PatientStatus.ACCEPTED],
      },
    });
    if (isError(emsPatient)) return emsPatient;

    const exist = await this.prismaService.req_Patient.findUnique({
      where: {
        ems_employee_id: user.employee_id,
        patient_id: emsPatient.patient_id,
      },
      include: {
        ems_to_er_request: true,
        request_department: true,
      },
    });

    if (_type === 'API' && exist) {
      return typia.random<REQ_EMS_TO_ER_ERROR.REQUEST_ALREADY_PROCESSED>();
    }
    if (exist) {
      return exist;
    }

    // TODO: MSA 서버 분리시 api 호출로 변경 (병원 진료과목 조회)

    const existDepartment = await this.prismaService.er_Department.findMany({
      where: {
        department_id: department_list.length
          ? {
              in: department_list,
            }
          : undefined,
      },
    });
    if (existDepartment.length !== department_list.length) {
      return typia.random<ER_DEPARTMENT_ERROR.DEPARTMENT_NOT_EXIST>();
    }

    const {
      patient_gender,
      patient_id: ems_patinet_id,
      patient_latitude,
      patient_longitude,
      patient_severity,
      patient_birth,
      patient_name,
      patient_emergency_cause,
    } = emsPatient;

    const updatedEmsPatinet = this.prismaService.ems_Patient.update({
      where: {
        patient_id: ems_patinet_id,
      },
      data: {
        patient_status: ems_PatientStatus.REQUESTED,
      },
    });

    const createdPatient = this.prismaService.req_Patient.create({
      data: {
        patient_id: ems_patinet_id,
        patient_name,
        patient_birth,
        patient_gender,
        patient_severity,
        patient_symptom_summary: patient_emergency_cause,
        patient_latitude,
        patient_longitude,
        ambulance_company_id: user.ambulance_company_id,
        ambulance_company_name: emsPatient.employee.ambulance_company.ambulance_company_name,
        ems_employee_id: user.employee_id,
        ems_employee_name: emsPatient.employee.employee_name,
        request_department: {
          createMany: {
            data: department_list.map((department_id) => ({
              department_id,
            })),
          },
        },
      },
      include: {
        ems_to_er_request: true,
        request_department: true,
      },
    });
    const [result] = await this.prismaService.$transaction([createdPatient, updatedEmsPatinet]);

    return result;
  }

  async getEmergencyCenterByTakeNumberAndActiveDepartments({
    take,
    department_list,
    emergency_center,
  }: {
    emergency_center: ({
      emergency_center_id: string;
      emergency_center_latitude: number;
      emergency_center_longitude: number;
    } & {
      distance: number;
    })[];
    take: number;
    department_list: number[];
  }) {
    const emergencyCenterList = await this.prismaService.er_EmergencyCenter.findMany({
      where: {
        // hospital: {
        //   hospital_departments: {
        //     some: {
        //       department_id: department_list.length
        //         ? {
        //             in: department_list,
        //           }
        //         : undefined,
        //     },
        //   },
        // },
        hospital: department_list.length
          ? {
              hospital_departments: {
                some: {
                  department_id: {
                    in: department_list,
                  },
                },
              },
            }
          : undefined,
        emergency_center_id: {
          in: emergency_center.map((emergencyCenter) => emergencyCenter.emergency_center_id),
        },
        emergency_rooms: {
          some: {
            emergency_room_beds: {
              some: {
                emergency_room_bed_status: 'AVAILABLE',
              },
            },
          },
        },
      },
    });
    const result = emergencyCenterList
      .map((emergencyCenter) => {
        return {
          ...emergencyCenter,
          distance:
            emergency_center.find((e) => e.emergency_center_id === emergencyCenter.emergency_center_id)?.distance || 0,
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, take);

    return result;
  }
}
