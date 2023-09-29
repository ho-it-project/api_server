import { PrismaService } from '@common/prisma/prisma.service';
import { AUTH_ERROR, createError } from '@config/errors';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ErAuth } from '@src/auth/interface/er.auth.interface';
import { ErJwtRefreshStrategy } from '@src/auth/strategy/er.jwt.refresh.strategy';
import typia from 'typia';

describe('ErJwtRefreshStrategy', () => {
  let Strategy: ErJwtRefreshStrategy;
  let mockPrismaService: PrismaService;

  beforeEach(async () => {
    mockPrismaService = jest.mocked<PrismaService>(new PrismaService());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErJwtRefreshStrategy,
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
    Strategy = module.get<ErJwtRefreshStrategy>(ErJwtRefreshStrategy);
  });
  it('should be defined', () => {
    expect(Strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should be return user if user is found', async () => {
      const mockUser = typia.random<ErAuth.RefreshTokenSignPayload>();
      mockPrismaService.er_Employee.findFirst = jest.fn().mockResolvedValue(mockUser);
      const result = await Strategy.validate(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockPrismaService.er_Employee.findFirst = jest.fn().mockResolvedValue(null);

      await expect(Strategy.validate(typia.random<ErAuth.RefreshTokenSignPayload>())).rejects.toThrow(
        // new UnauthorizedException(AUTH_ERROR.REFRESH_TOKEN_FAILURE),
        createError(typia.random<AUTH_ERROR.REFRESH_TOKEN_FAILURE>()),
      );
    });
  });
});
