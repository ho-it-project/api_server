import { PrismaService } from '@common/prisma/prisma.service';
import { AUTH_ERROR, createError } from '@config/errors';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ErAuth } from '@src/auth/interface/er.auth.interface';
import { JwtAccessStrategy } from '@src/auth/strategy/jwt.access.strategy';
import typia from 'typia';

describe('JwtAccessStrategy', () => {
  let strategy: JwtAccessStrategy;
  let mockPrismaService: jest.MockedObjectDeep<PrismaService>;
  //   let mockEmployee: er_Employee;
  beforeEach(async () => {
    // mockEmployee = typia.random<er_Employee>();
    mockPrismaService = jest.mocked<PrismaService>(new PrismaService());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAccessStrategy,
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
    strategy = module.get<JwtAccessStrategy>(JwtAccessStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should be return user if user is found', async () => {
      const mockUser = typia.random<ErAuth.AccessTokenSignPayload>();
      mockPrismaService.er_Employee.findFirst = jest.fn().mockResolvedValue(mockUser);
      const result = await strategy.validate(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockPrismaService.er_Employee.findFirst = jest.fn().mockResolvedValue(null);
      await expect(strategy.validate(typia.random<ErAuth.AccessTokenSignPayload>())).rejects.toThrow(
        createError(typia.random<AUTH_ERROR.ACCESS_TOKEN_FAILURE>()),
      );
    });
  });
});
