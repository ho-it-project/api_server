import { PrismaService } from '@common/prisma/prisma.service';
import { AUTH_ERROR, createError } from '@config/errors';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EmsAuth } from '@src/auth/interface';
import { EmsJwtAccessStrategy } from '@src/auth/strategy/ems.jwt.access.strategy';
import typia from 'typia';

describe('EmsJwtAccessStrategy', () => {
  let strategy: EmsJwtAccessStrategy;
  let mockPrismaService: jest.MockedObjectDeep<PrismaService>;
  //   let mockEmployee: er_Employee;
  beforeEach(async () => {
    // mockEmployee = typia.random<er_Employee>();
    mockPrismaService = jest.mocked<PrismaService>(new PrismaService());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmsJwtAccessStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();
    strategy = module.get<EmsJwtAccessStrategy>(EmsJwtAccessStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should be return user if user is found', async () => {
      const mockUser = typia.random<EmsAuth.AccessTokenSignPayload>();
      mockPrismaService.ems_Employee.findFirst = jest.fn().mockResolvedValue(mockUser);
      const result = await strategy.validate(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockPrismaService.ems_Employee.findFirst = jest.fn().mockResolvedValue(null);
      await expect(strategy.validate(typia.random<EmsAuth.AccessTokenSignPayload>())).rejects.toThrow(
        createError(typia.random<AUTH_ERROR.ACCESS_TOKEN_FAILURE>()),
      );
    });
  });
});
