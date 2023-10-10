import { PrismaService } from '@common/prisma/prisma.service';
import { isError } from '@config/errors';
import { REQ_EMS_TO_ER_ERROR } from '@config/errors/req.error';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ems_AmbulanceCompany,
  ems_Employee,
  ems_Patient,
  er_EmergencyCenter,
  req_EmsToErRequest,
  req_Patient,
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
    const reqPatientMock = typia.random<req_Patient & { ems_to_er_request: req_EmsToErRequest[] }>();

    const user = typia.random<EmsAuth.AccessTokenSignPayload>();
    beforeEach(() => {
      jest
        .spyOn(prismaService.ems_Patient, 'findFirst')
        .mockResolvedValue({ ...patientMock, patient_status: 'PENDING' });
      jest.spyOn(prismaService.ems_AmbulanceCompany, 'findFirst').mockResolvedValue(ambulanceCompanyMock);
      jest.spyOn(prismaService.er_EmergencyCenter, 'findMany').mockResolvedValue(emergencyCenterListMock);
      jest
        .spyOn(prismaService.ems_Patient, 'findFirst')
        .mockResolvedValue({ ...patientMock, patient_status: 'PENDING' });
      jest.spyOn(prismaService.req_Patient, 'create').mockResolvedValue(reqPatientMock);
      jest.spyOn(prismaService, '$transaction').mockResolvedValue([reqPatientMock, typia.random<number>()]);
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

    it('should return patient and target_emergency_center_list ', async () => {
      const result = await requestEmsToErService.createEmsToErRequest(user);

      expect(result).toEqual(
        expect.objectContaining({
          patient: expect.any(Object),
          target_emergency_center_list: expect.any(Array),
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
    const reqPatientMock = typia.random<req_Patient>();
    const emsToErRequestMock = { ...typia.random<req_EmsToErRequest>(), patient: reqPatientMock };
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
      if (isError(result)) {
        throw new Error('test fail');
      }

      expect(result).toEqual({ patient: reqPatientMock });
    });

    it('should return success if request is rejected', async () => {
      const result = await requestEmsToErService.respondEmsToErRequest({ user, patient_id, response: 'REJECTED' });
      expect(result).toEqual({ patient: reqPatientMock });
    });
  });
});
