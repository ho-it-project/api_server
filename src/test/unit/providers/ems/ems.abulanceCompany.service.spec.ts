import { PrismaService } from '@common/prisma/prisma.service';
import { Test } from '@nestjs/testing';
import { ems_AmbulanceCompany } from '@prisma/client';
import { EmsAmbulanceCampanyService } from '@src/providers/ems/ems.ambulanceCampany.service';
import typia, { tags } from 'typia';

describe('ems.abulanceCompany.service', () => {
  let service: EmsAmbulanceCampanyService;
  let mockPrismaService: PrismaService;
  it('should return empty string when input is empty string', () => {
    expect('').toBe('');
  });
  beforeEach(async () => {
    const moudule = await Test.createTestingModule({
      providers: [
        EmsAmbulanceCampanyService,
        {
          provide: PrismaService,
          useValue: {
            ems_AmbulanceCompany: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();
    service = moudule.get<EmsAmbulanceCampanyService>(EmsAmbulanceCampanyService);
    mockPrismaService = moudule.get<PrismaService>(PrismaService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(service.getAmbulanceCampanyList).toBeDefined();
    expect(service.getAmbulanceCampanyList).toBeInstanceOf(Function);
  });

  describe('getAmbulanceCampanyList', () => {
    it('should be defined', () => {
      expect(service.getAmbulanceCampanyList).toBeDefined();
      expect(service.getAmbulanceCampanyList).toBeInstanceOf(Function);
    });

    beforeEach(() => {
      mockPrismaService.ems_AmbulanceCompany.findMany = jest.fn().mockResolvedValue([]);
      mockPrismaService.ems_AmbulanceCompany.groupBy = jest.fn().mockResolvedValue([]);
      mockPrismaService.ems_AmbulanceCompany.count = jest.fn().mockResolvedValue(0);
    });
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should be return empty array', async () => {
      const result = await service.getAmbulanceCampanyList({
        city: ['없는도시'],
        area: ['없는지역'],
      });
      expect(result).toEqual({
        ambulance_company_list: [],
        count: 0,
      });
    });

    it('should be return array length 10 when page is 1 and limit 10', async () => {
      const pageMockData = typia.random<ems_AmbulanceCompany[] & tags.MinItems<10> & tags.MaxItems<10>>();
      mockPrismaService.ems_AmbulanceCompany.findMany = jest.fn().mockResolvedValue(pageMockData);
      mockPrismaService.ems_AmbulanceCompany.count = jest.fn().mockResolvedValue(pageMockData.length);
      const result = await service.getAmbulanceCampanyList({
        city: ['있는도시'],
        area: ['있는지역'],
        page: 1,
        limit: 10,
      });
      expect(result.ambulance_company_list.length).toEqual(10);
      expect(result.count).toEqual(pageMockData.length);
    });
  });
});
