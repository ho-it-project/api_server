import { CryptoService } from '@common/crypto/crypto.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { EMS_PATIENT_ERROR } from '@config/errors';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ems_Patient } from '@prisma/client';
import { EmsPatientService } from '@providers/ems/ems.patient.service';
import { EmsPatient } from '@src/providers/interface/ems/ems.patient.interface';
import { EmsPatientResponse } from '@src/types/ems.response.dto';
import typia from 'typia';
import { assertPrune } from 'typia/lib/misc';
import { v4 } from 'uuid';

describe('EmsPatientService', () => {
  let service: EmsPatientService;
  let prismaService: PrismaService;
  let cryptoService: CryptoService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmsPatientService,
        {
          provide: PrismaService,
          useValue: {
            ems_Patient: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
        CryptoService,
        ConfigService,
      ],
    }).compile();

    service = module.get<EmsPatientService>(EmsPatientService);
    prismaService = module.get<PrismaService>(PrismaService);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createPatient', () => {
    let patientInfo: EmsPatient.CreatePatientDTO['patientInfo'];
    let user: EmsPatient.CreatePatientDTO['user'];
    beforeEach(() => {
      patientInfo = typia.random<EmsPatient.CreatePatientDTO['patientInfo']>();
      user = typia.random<EmsPatient.CreatePatientDTO['user']>();
    });

    it('should create a patient', async () => {
      const patient_id = v4();
      const mockPatient = typia.random<ems_Patient>();
      jest.spyOn(prismaService.ems_Patient, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.ems_Patient, 'create').mockResolvedValue({ ...mockPatient, patient_id });

      const result = await service.createPatient(
        assertPrune<EmsPatient.CreatePatientDTO>({
          patientInfo,
          user,
        }),
      );

      expect(result).toEqual({ patient_id });
    });

    it('should return INCHARGED_PATIENT_ALREADY_EXIST', async () => {
      const mockPatient = typia.random<ems_Patient>();
      jest.spyOn(prismaService.ems_Patient, 'findFirst').mockResolvedValue(mockPatient);
      const result = await service.createPatient(
        assertPrune<EmsPatient.CreatePatientDTO>({
          patientInfo,
          user,
        }),
      );
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.INCHARGED_PATIENT_ALREADY_EXIST>());
    });
  });

  describe('getPatientDetail', () => {
    let mockPatientDetail: EmsPatientResponse.GetPatientDetail & { patient_salt: { salt: string } };

    beforeEach(() => {
      mockPatientDetail = typia.random<typeof mockPatientDetail>();
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(mockPatientDetail);
      cryptoService.decrypt = jest.fn().mockResolvedValue(mockPatientDetail.patient_identity_number);
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    it('should return a patient detail', async () => {
      const patient_id = v4();
      const result = await service.getPatientDetail(patient_id);

      expect(result).toEqual(assertPrune<EmsPatientResponse.GetPatientDetail>(mockPatientDetail));
    });

    it('should return EMS_PATIENT_ERROR.PATIENT_NOT_FOUND', async () => {
      const patient_id = v4();
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(null);
      const result = await service.getPatientDetail(patient_id);
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>());
    });
  });
});
