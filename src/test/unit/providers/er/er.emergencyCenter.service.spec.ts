import { PrismaService } from '@common/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { ErEmergencyCenterService } from '@src/providers/er/er.emergencyCenter.service';
import { ErEmergencyCenter } from '@src/providers/interface/er/er.emergencyCenter.interface';
import typia, { tags } from 'typia';

describe('ErEmergencyCenterService', () => {
  let service: ErEmergencyCenterService;
  let mockPrismaService: PrismaService;
  it('should be defined', () => {
    expect(true).toBeDefined();
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErEmergencyCenterService,
        {
          provide: PrismaService,
          useValue: {
            er_EmergencyCenter: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ErEmergencyCenterService>(ErEmergencyCenterService);
    mockPrismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(service.getEmergencyCenterListByQuery).toBeDefined();
    expect(service.getEmergencyCenterListByQuery).toBeInstanceOf(Function);
  });

  describe('getEmergencyCenterListByQuery', () => {
    it('should be defined', () => {
      expect(service.getEmergencyCenterListByQuery).toBeDefined();
      expect(service.getEmergencyCenterListByQuery).toBeInstanceOf(Function);
    });
    beforeEach(() => {
      mockPrismaService.er_EmergencyCenter.findMany = jest.fn().mockResolvedValue([]);
    });
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should be return empty array', async () => {
      const result = await service.getEmergencyCenterListByQuery({
        city: '없는도시',
        latitude: 37.123,
        longitude: 127.123,
      });
      expect(result).toEqual({
        emergency_center_list: [],
        count: 0,
      });
    });
    it('should be return array length 10 when page is 1 and limit 10', async () => {
      const pageMockData = typia.random<
        ErEmergencyCenter.GetEmergentcyCenterListQueryFindManyOuput[] & tags.MinItems<20> & tags.MaxItems<20>
      >();
      mockPrismaService.er_EmergencyCenter.findMany = jest.fn().mockResolvedValue(pageMockData);
      const result = await service.getEmergencyCenterListByQuery({
        city: '있는도시',
        latitude: 37.123,
        longitude: 127.123,
        page: 1,
        limit: 10,
      });
      expect(result.emergency_center_list.length).toEqual(10);
      expect(result.count).toEqual(pageMockData.length);
    });
    it('should be return array length 10 when page is 2 and limit 10', async () => {
      const pageMockData = typia.random<
        ErEmergencyCenter.GetEmergentcyCenterListQueryFindManyOuput[] & tags.MinItems<20> & tags.MaxItems<20>
      >();
      mockPrismaService.er_EmergencyCenter.findMany = jest.fn().mockResolvedValue(pageMockData);
      const result = await service.getEmergencyCenterListByQuery({
        city: '있는도시',
        latitude: 37.123,
        longitude: 127.123,
        page: 2,
        limit: 10,
      });
      expect(result.emergency_center_list.length).toEqual(10);
      expect(result.count).toEqual(pageMockData.length);
    });
    it('should be array length less than 10 when last page and limit 10', async () => {
      const pageMockData = typia.random<
        ErEmergencyCenter.GetEmergentcyCenterListQueryFindManyOuput[] & tags.MinItems<20> & tags.MaxItems<30>
      >();
      mockPrismaService.er_EmergencyCenter.findMany = jest.fn().mockResolvedValue(pageMockData);
      const result = await service.getEmergencyCenterListByQuery({
        city: '있는도시',
        latitude: 37.123,
        longitude: 127.123,
        page: 3,
        limit: 10,
      });
      expect(result.emergency_center_list.length).toBeLessThan(10);
      expect(result.count).toEqual(pageMockData.length);
    });
  });
});
