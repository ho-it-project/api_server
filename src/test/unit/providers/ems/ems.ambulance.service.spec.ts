import { PrismaService } from '@common/prisma/prisma.service';
import { EMS_AMBULANCE_ERROR } from '@config/errors';
import { Test } from '@nestjs/testing';
import { EmsAmbulanceService } from '@src/providers/ems/ems.ambulance.service';
import typia from 'typia';

describe('ems.ambulance.service', () => {
  let emsAmbulanceService: EmsAmbulanceService;
  let mockPrismaService: PrismaService;
  beforeEach(async () => {
    const moudule = await Test.createTestingModule({
      providers: [
        EmsAmbulanceService,
        {
          provide: PrismaService,
          useValue: {
            ems_Ambulance: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();
    emsAmbulanceService = moudule.get<EmsAmbulanceService>(EmsAmbulanceService);
    mockPrismaService = moudule.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAmbulanceDetail', () => {
    it('should be defined', () => {
      expect(emsAmbulanceService.getAmbulanceDetail).toBeDefined();
      expect(emsAmbulanceService.getAmbulanceDetail).toBeInstanceOf(Function);
    });

    beforeEach(() => {
      mockPrismaService.ems_Ambulance.findUnique = jest.fn().mockResolvedValue(null);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should be return EMS_AMBULANCE_ERROR.AMBULANCE_NOT_FOUND', async () => {
      const result = await emsAmbulanceService.getAmbulanceDetail('없는구급차');
      expect(result).toEqual(typia.random<EMS_AMBULANCE_ERROR.AMBULANCE_NOT_FOUND>());
    });
  });
});
