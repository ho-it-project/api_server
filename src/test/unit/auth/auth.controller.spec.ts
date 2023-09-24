import { createResponse } from '@common/interceptor/createResponse';
import { PrismaService } from '@common/prisma/prisma.service';
import { JWT_OPTIONS } from '@config/constant';
import { jwtOption } from '@config/option';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { er_Employee } from '@prisma/client';
import { AuthController } from '@src/auth/auth.controller';
import { Auth } from '@src/auth/interface/auth.interface';
import { AuthService } from '@src/auth/provider/auth.service';
import { JwtAccessStrategy } from '@src/auth/strategy/jwt.access.strategy';
import { JwtRefreshStrategy } from '@src/auth/strategy/jwt.refresh.strategy';
import { AuthRequest } from '@src/types';
import { AUTH_ERROR } from '@src/types/errors';
import Express from 'express';
import typia from 'typia';
describe('authController', () => {
  let authController: AuthController;
  let mockPrismaService: PrismaService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        JwtAccessStrategy,
        JwtRefreshStrategy,
        AuthService,
        { provide: JWT_OPTIONS, useValue: jwtOption },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],

      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        JwtModule,
      ],
    }).compile();
    authController = app.get<AuthController>(AuthController);
  });

  describe('GET: /api/auth checkAuthStatus', () => {
    beforeEach(() => {
      mockPrismaService = jest.mocked<PrismaService>(new PrismaService());
    });

    it('should be defined', () => {
      expect(authController.checkAuthStatus).toBeDefined();
      expect(authController.checkAuthStatus).toBeInstanceOf(Function);
    });

    it("should return 'is_login: true' when user is logged in", async () => {
      const user = typia.random<Auth.AccessTokenSignPayload>();
      const res = jest.mocked<Express.Response>(Express.response);
      res.cookie = jest.fn().mockReturnValue(res);
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      const result = await authController.checkAuthStatus(user, res);

      // 이제 authControlle
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.any(String),
        expect.objectContaining({
          sameSite: 'none',
          httpOnly: true,
          secure: expect.any(Boolean),
        }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        expect.any(String),
        expect.objectContaining({
          sameSite: 'none',
          httpOnly: true,
          secure: expect.any(Boolean),
        }),
      );
      expect(result).toEqual(createResponse({ is_login: true, employee: user }));
      // expect(result).toEqual({ is_login: true, employee: user });
    });

    it('should return { is_login: false } when user is not logged in', async () => {
      const user = null as unknown as Auth.AccessTokenSignPayload;
      const res = jest.mocked<Express.Response>(Express.response);
      res.cookie = jest.fn().mockReturnValue(res);
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      res.clearCookie = jest.fn().mockReturnValue(res);
      const result = await authController.checkAuthStatus(user, res);
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(res.clearCookie).toHaveBeenCalledWith('access_token');
      expect(result).toEqual(createResponse({ is_login: false, employee: null }));
    });
  });

  describe('POST: /api/auth/login', () => {
    beforeEach(() => {
      const mockUser = typia.random<er_Employee>();

      mockPrismaService = jest.mocked<PrismaService>(new PrismaService());
      mockPrismaService.er_Employee.findFirst = jest.fn().mockResolvedValue(mockUser);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });
    it('should be defined', () => {
      expect(authController.login).toBeDefined();
      expect(authController.login).toBeInstanceOf(Function);
    });

    it('should return { is_login: true, employee: user } when user is logged in', async () => {
      const loginDTO = typia.random<AuthRequest.LoginDTO>();
      const employee = { ...typia.random<er_Employee>(), ...loginDTO };
      const res = jest.mocked<Express.Response>(Express.response);
      res.cookie = jest.fn().mockReturnValue(res);
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      mockPrismaService.er_Employee.findFirst = jest.fn().mockResolvedValue(employee);
      AuthService.prototype.comparePassword = jest.fn().mockResolvedValue(true);
      const result = await authController.login(loginDTO, res);
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.any(String),
        expect.objectContaining({
          sameSite: 'none',
          httpOnly: true,
          secure: expect.any(Boolean),
        }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        expect.any(String),
        expect.objectContaining({
          sameSite: 'none',
          httpOnly: true,
          secure: expect.any(Boolean),
        }),
      );
      expect(result).toHaveProperty('is_success');
      expect(result).toHaveProperty('result');
      expect(result.result).toHaveProperty('is_login');
      expect(result.result).toHaveProperty('employee');
      expect(result.result.employee).toHaveProperty('employee_id');
      expect(result.result.employee).toHaveProperty('emergency_center_id');
      expect(result.result.employee).toHaveProperty('id_card');
      expect(result.result.employee).toHaveProperty('role');
    });

    it('wrong password throw UnauthorizedException', async () => {
      const loginDTO = typia.random<AuthRequest.LoginDTO>();
      const employee = { ...typia.random<er_Employee>(), ...loginDTO };
      const res = jest.mocked<Express.Response>(Express.response);
      res.cookie = jest.fn().mockReturnValue(res);
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      mockPrismaService.er_Employee.findFirst = jest.fn().mockResolvedValue(employee);
      AuthService.prototype.comparePassword = jest.fn().mockResolvedValue(false);
      const result = authController.login(loginDTO, res);
      await expect(result).rejects.toThrow(UnauthorizedException);
      await expect(result).rejects.toThrow(new UnauthorizedException(AUTH_ERROR.PASSWORD_INCORRECT));
    });
  });

  describe('POST: /api/auth/logout', () => {
    it('should be defined', () => {
      expect(authController.logout).toBeDefined();
      expect(authController.logout).toBeInstanceOf(Function);
    });

    it('should return { is_login: false}', async () => {
      const res = jest.mocked<Express.Response>(Express.response);
      res.cookie = jest.fn().mockReturnValue(res);
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      res.clearCookie = jest.fn().mockReturnValue(res);
      const result = await authController.logout(res);
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(res.clearCookie).toHaveBeenCalledWith('access_token');
      expect(result).toEqual(createResponse({ is_login: false }));
    });
  });
});