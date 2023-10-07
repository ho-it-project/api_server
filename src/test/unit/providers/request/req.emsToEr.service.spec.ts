import { PrismaService } from '@common/prisma/prisma.service';
import { REQ_EMS_TO_ER_ERROR } from '@config/errors/req.error';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ems_AmbulanceCompany,
  ems_Employee,
  ems_Patient,
  er_EmergencyCenter,
  req_EmsToErRequest,
} from '@prisma/client';
import { EmsAuth, ErAuth } from '@src/auth/interface';
import { EmsPatient } from '@src/providers/interface/ems/ems.patient.interface';
import { ReqEmsToErService } from '@src/providers/req/req.emsToEr.service';
import typia, { tags } from 'typia';

describe('RequestEmsToErService', () => {
  let requestEmsToErService: ReqEmsToErService;
  let prismaService: PrismaService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReqEmsToErService,
        {
          provide: PrismaService,
          useValue: {
            ems_Patient: {
              findFirst: jest.fn().mockResolvedValue({} as ems_Patient),
              update: jest.fn().mockResolvedValue({}),
            },
            ems_AmbulanceCompany: {
              findFirst: jest.fn().mockResolvedValue({}),
            },
            er_EmergencyCenter: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            req_Patient: {
              create: jest.fn().mockResolvedValue({}),
              findMany: jest.fn().mockResolvedValue([]),
              count: jest.fn().mockResolvedValue(0),
            },
            req_EmsToErRequest: {
              create: jest.fn().mockResolvedValue({}),
              findMany: jest.fn().mockResolvedValue([]),
              count: jest.fn().mockResolvedValue(0),
              findFirst: jest.fn().mockResolvedValue({}),
              updateMany: jest.fn().mockResolvedValue({}),
              update: jest.fn().mockResolvedValue({}),
            },
            $transaction: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    requestEmsToErService = module.get<ReqEmsToErService>(ReqEmsToErService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(requestEmsToErService).toBeDefined();
  });

  describe('createEmsToErRequest', () => {
    const patientMock = typia.random<EmsPatient.GetPatientDetailReturn & { employee: ems_Employee }>();
    const ambulanceCompanyMock = typia.random<ems_AmbulanceCompany>();
    const emergencyCenterListMock = typia.random<er_EmergencyCenter[] & tags.MinItems<20>>().map((e) => ({
      ...e,
      emergency_center_latitude: patientMock.patient_latitude,
      emergency_center_longitude: patientMock.patient_longitude,
    }));
    const user = typia.random<EmsAuth.AccessTokenSignPayload>();
    beforeEach(() => {
      jest
        .spyOn(prismaService.ems_Patient, 'findFirst')
        .mockResolvedValue({ ...patientMock, patient_status: 'PENDING' });
      jest.spyOn(prismaService.ems_AmbulanceCompany, 'findFirst').mockResolvedValue(ambulanceCompanyMock);
      jest.spyOn(prismaService.er_EmergencyCenter, 'findMany').mockResolvedValue(emergencyCenterListMock);
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should return error if patient not found', async () => {
      jest.spyOn(prismaService.ems_Patient, 'findFirst').mockResolvedValue(null);
      const result = await requestEmsToErService.createEmsToErRequest(user);
      expect(result).toEqual(typia.random<REQ_EMS_TO_ER_ERROR.PENDING_PATIENT_NOT_FOUND>());
    });

    it('should return error if patient status is not pending', async () => {
      jest
        .spyOn(prismaService.ems_Patient, 'findFirst')
        .mockResolvedValue({ ...patientMock, patient_status: 'REQUESTED' });
      const result = await requestEmsToErService.createEmsToErRequest(user);
      expect(result).toEqual(typia.random<REQ_EMS_TO_ER_ERROR.REQUEST_ALREADY_PROCESSED>());
    });

    it('should return error if ambulance company not found', async () => {
      jest.spyOn(prismaService.ems_AmbulanceCompany, 'findFirst').mockResolvedValue(null);
      const result = await requestEmsToErService.createEmsToErRequest(user);
      expect(result).toEqual(typia.random<REQ_EMS_TO_ER_ERROR.AMBULANCE_COMPANY_NOT_FOUND>());
    });

    it('should return target emergency center info with distance', async () => {
      const result = await requestEmsToErService.createEmsToErRequest(user);

      expect(result).toEqual(
        expect.objectContaining({
          target_emergency_center_list: expect.arrayContaining([
            expect.objectContaining({
              emergency_center_id: expect.any(String),
              emergency_center_name: expect.any(String),
              emergency_center_latitude: expect.any(Number),
              emergency_center_longitude: expect.any(Number),
              distance: expect.any(Number),
            }),
          ]),
        }),
      );
    });
  });

  describe('getEmsToErRequestList', () => {
    const emsUser = typia.random<EmsAuth.AccessTokenSignPayload>();
    const erUesr = typia.random<ErAuth.AccessTokenSignPayload>();
    erUesr;
    beforeEach(() => {
      jest.spyOn(prismaService.req_Patient, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.req_Patient, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService, '$transaction').mockResolvedValue([[], 0]);
    });
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return request_list, count if user is ems user', async () => {
      const result = await requestEmsToErService.getEmsToErRequestList({ user: emsUser, query: {}, type: 'ems' });
      expect(result).toEqual(
        expect.objectContaining({
          request_list: expect.any(Array),
          count: expect.any(Number),
        }),
      );
    });

    it('should return request_list, count if user is er user', async () => {
      const result = await requestEmsToErService.getEmsToErRequestList({ user: erUesr, query: {}, type: 'er' });
      expect(result).toEqual(
        expect.objectContaining({
          request_list: expect.any(Array),
          count: expect.any(Number),
        }),
      );
    });
  });

  describe('respondErToEmsRequest', () => {
    const user = typia.random<ErAuth.AccessTokenSignPayload>();
    const patient_id = typia.random<string>();
    const response = typia.random<'ACCEPTED' | 'REJECTED'>();
    const patientMock = typia.random<ems_Patient>();
    const emsToErRequestMock = typia.random<req_EmsToErRequest>();
    beforeEach(() => {
      jest.spyOn(prismaService.ems_Patient, 'update').mockResolvedValue(patientMock);
      jest
        .spyOn(prismaService.req_EmsToErRequest, 'findFirst')
        .mockResolvedValue({ ...emsToErRequestMock, request_status: 'REQUESTED' });
      jest.spyOn(prismaService.req_Patient, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService, '$transaction').mockResolvedValue([]);
    });
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return error if patient not found', async () => {
      jest.spyOn(prismaService.req_EmsToErRequest, 'findFirst').mockResolvedValue(null);
      const result = await requestEmsToErService.respondEmsToErRequest({ user, patient_id, response });
      expect(result).toEqual(typia.random<REQ_EMS_TO_ER_ERROR.REQUEST_NOT_FOUND>());
    });

    it('should return error if request already processed', async () => {
      jest.spyOn(prismaService.req_EmsToErRequest, 'findFirst').mockResolvedValue({
        ...emsToErRequestMock,
        request_status: 'ACCEPTED',
      });
      const result = await requestEmsToErService.respondEmsToErRequest({ user, patient_id, response });
      expect(result).toEqual(typia.random<REQ_EMS_TO_ER_ERROR.REQUEST_ALREADY_PROCESSED>());
    });

    it('should return success if request is accepted', async () => {
      const result = await requestEmsToErService.respondEmsToErRequest({ user, patient_id, response: 'ACCEPTED' });
      expect(result).toEqual({ success: true });
    });

    it('should return success if request is rejected', async () => {
      const result = await requestEmsToErService.respondEmsToErRequest({ user, patient_id, response: 'REJECTED' });
      expect(result).toEqual({ success: true });
    });
  });
});
