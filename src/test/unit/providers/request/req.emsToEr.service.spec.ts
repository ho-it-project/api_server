import { REQ_EMS_TO_ER_ERROR } from '@config/errors/req.error';
import { Test, TestingModule } from '@nestjs/testing';
import { ems_AmbulanceCompany, ems_Employee, ems_Patient, er_EmergencyCenter } from '@prisma/client';
import { EmsAuth } from '@src/auth/interface';
import { EmsPatient } from '@src/providers/interface/ems/ems.patient.interface';
import { ReqEmsToErService } from '@src/providers/req/req.emsToEr.service';
import typia, { tags } from 'typia';
import { PrismaService } from './../../../../common/prisma/prisma.service';

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
            },
            ems_AmbulanceCompany: {
              findFirst: jest.fn().mockResolvedValue({}),
            },
            er_EmergencyCenter: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            req_Patient: {
              create: jest.fn().mockResolvedValue({}),
            },
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
      jest.spyOn(prismaService.ems_Patient, 'findFirst').mockResolvedValue(patientMock);
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

    it('should return error if ambulance company not found', async () => {
      jest.spyOn(prismaService.ems_AmbulanceCompany, 'findFirst').mockResolvedValue(null);
      const result = await requestEmsToErService.createEmsToErRequest(user);
      expect(result).toEqual(typia.random<REQ_EMS_TO_ER_ERROR.AMBULANCE_COMPANY_NOT_FOUND>());
    });

    it('should return target emergency center', async () => {
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
});
