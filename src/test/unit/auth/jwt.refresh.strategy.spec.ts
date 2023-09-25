import { PrismaService } from '@common/prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Auth } from '@src/auth/interface/auth.interface';
import { JwtRefreshStrategy } from '@src/auth/strategy/jwt.refresh.strategy';
import { AUTH_ERROR } from '@src/types/errors';
import typia from 'typia';

describe('JwtRefreshStrategy', () => {
  let Strategy: JwtRefreshStrategy;
  let mockPrismaService: PrismaService;

  beforeEach(async () => {
    mockPrismaService = jest.mocked<PrismaService>(new PrismaService());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtRefreshStrategy,
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
    Strategy = module.get<JwtRefreshStrategy>(JwtRefreshStrategy);
  });
  it('should be defined', () => {
    expect(Strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should be return user if user is found', async () => {
      const mockUser = typia.random<Auth.RefreshTokenSignPayload>();
      mockPrismaService.er_Employee.findFirst = jest.fn().mockResolvedValue(mockUser);
      const result = await Strategy.validate(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockPrismaService.er_Employee.findFirst = jest.fn().mockResolvedValue(null);

      await expect(Strategy.validate(typia.random<Auth.RefreshTokenSignPayload>())).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(Strategy.validate(typia.random<Auth.RefreshTokenSignPayload>())).rejects.toThrow(
        new UnauthorizedException(AUTH_ERROR.REFRESH_TOKEN_FAILURE),
      );
    });
  });
});
