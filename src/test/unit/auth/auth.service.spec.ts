import { PrismaService } from '@common/prisma/prisma.service';
import { AUTH_ERROR, isError } from '@config/errors';
import { JwtOption } from '@config/option/interface';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { er_Employee } from '@prisma/client';
import { ErAuth } from '@src/auth/interface/er.auth.interface';
import { ErAuthRequest } from '@src/types';
import typia from 'typia';
import { AuthService } from '../../../auth/provider/auth.service';
interface DateString {
  created_at: string;
  updated_at: string;
}

describe('AuthService', () => {
  //prisma mock
  let authService: AuthService;
  let mockPrismaService: jest.MockedObjectDeep<PrismaService>;
  const jwtOption: JwtOption = {
    access_secret: 'access_secret',
    access_expires_in: '7200',
    refresh_expires_in: '60000',
    refresh_secret: 'refresh_secret',
  };
  beforeAll(() => {
    mockPrismaService = jest.mocked<PrismaService>(new PrismaService());
    authService = new AuthService(mockPrismaService, new JwtService(), new ConfigService(), jwtOption);
  });
  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(authService).toBeInstanceOf(AuthService);
    expect(authService).toHaveProperty('login');
    expect(authService).toHaveProperty('logout');
    expect(authService).toHaveProperty('accessTokenSign');
    expect(authService).toHaveProperty('accessTokenVerify');
    expect(authService).toHaveProperty('refreshTokenSign');
    expect(authService).toHaveProperty('refreshTokenVerify');
  });

  describe('login', () => {
    let mockEmployee: er_Employee | DateString;
    let mockLoginDTO: ErAuthRequest.LoginDTO;
    beforeAll(async () => {
      mockEmployee = typia.random<er_Employee>();
      mockLoginDTO = typia.random<ErAuthRequest.LoginDTO>();
      mockPrismaService.er_Employee.findFirst = jest.fn().mockResolvedValue({
        ...mockEmployee,
        password: await authService.hashPassword({
          password: mockLoginDTO.password,
        }),
      });
    });

    it('should be defined', () => {
      expect(authService.login).toBeDefined();
      expect(authService.login).toBeInstanceOf(Function);
    });

    it('should be return access_token and refresh_token', async () => {
      const result = await authService.login(mockLoginDTO);
      if (isError(result)) {
        throw Error('test fail');
      }
      const { access_token, refresh_token } = result;
      expect(access_token).toBeDefined();
      expect(typeof access_token).toEqual('string');
      expect(refresh_token).toBeDefined();
      expect(typeof refresh_token).toEqual('string');
    });

    it("should be return access_token and refresh_token with error [Employee doesn't exist]", async () => {
      mockPrismaService.er_Employee.findFirst = jest.fn().mockResolvedValue(null);
      const result = await authService.login(mockLoginDTO);
      expect(result).toEqual(typia.random<AUTH_ERROR.EMPLOYEE_NOT_FOUND>());
    });
    it('should be return access_token and refresh_token with error [password wrong]', async () => {
      mockPrismaService.er_Employee.findFirst = jest.fn().mockResolvedValue({
        ...mockEmployee,
        password: await authService.hashPassword({
          password: 'wrong',
        }),
      });
      const result = await authService.login(mockLoginDTO);
      expect(result).toEqual(typia.random<AUTH_ERROR.PASSWORD_INCORRECT>());
    });
  });

  describe('logout', () => {});

  describe('accessTokenSign', () => {
    it('should be defined', () => {
      expect(authService.accessTokenSign).toBeDefined();
      expect(authService.accessTokenSign).toBeInstanceOf(Function);
    });

    it('should be return access_token', () => {
      const access_token = authService.accessTokenSign(typia.random<ErAuth.AccessTokenSignPayload>());
      expect(access_token).toBeDefined();
      expect(typeof access_token).toEqual('string');
    });
  });

  describe('accessTokenVerify', () => {
    it('should be defined', () => {
      expect(authService.accessTokenVerify).toBeDefined();
      expect(authService.accessTokenVerify).toBeInstanceOf(Function);
    });

    it('should be return access_token_verify', () => {
      const access_token = authService.accessTokenSign(typia.random<ErAuth.AccessTokenSignPayload>());
      const access_token_verify = authService.accessTokenVerify({ access_token });
      expect(access_token_verify).toBeDefined();
      expect(access_token_verify).toHaveProperty('emergency_center_id');
      expect(access_token_verify).toHaveProperty('employee_id');
      expect(access_token_verify).toHaveProperty('id_card');
      expect(access_token_verify).toHaveProperty('role');
    });

    it('should be return access_token_verify with error', () => {
      const access_token_verify = authService.accessTokenVerify({ access_token: 'error' });
      expect(access_token_verify).toBeDefined();
      expect(access_token_verify).toHaveProperty('name');
      expect(access_token_verify).toHaveProperty('message');
    });
  });

  describe('refreshTokenSign', () => {
    it('should be defined', () => {
      expect(authService.refreshTokenSign).toBeDefined();
      expect(authService.refreshTokenSign).toBeInstanceOf(Function);
    });

    it('should be return refresh_token', () => {
      const refresh_token = authService.refreshTokenSign(typia.random<ErAuth.RefreshTokenSignPayload>());
      expect(refresh_token).toBeDefined();
      expect(typeof refresh_token).toEqual('string');
    });
  });

  describe('refreshTokenVerify', () => {
    it('should be defined', () => {
      expect(authService.refreshTokenVerify).toBeDefined();
      expect(authService.refreshTokenVerify).toBeInstanceOf(Function);
    });

    it('should be return refresh_token_verify', () => {
      const refresh_token = authService.refreshTokenSign(typia.random<ErAuth.RefreshTokenSignPayload>());
      const refresh_token_verify = authService.refreshTokenVerify({ refresh_token });
      expect(refresh_token_verify).toBeDefined();
      expect(refresh_token_verify).toHaveProperty('emergency_center_id');
      expect(refresh_token_verify).toHaveProperty('employee_id');
      expect(refresh_token_verify).toHaveProperty('id_card');
    });

    it('should be return refresh_token_verify with error', () => {
      const refresh_token_verify = authService.refreshTokenVerify({ refresh_token: 'error' });
      expect(refresh_token_verify).toBeDefined();
      expect(refresh_token_verify).toHaveProperty('name');
      expect(refresh_token_verify).toHaveProperty('message');
    });
  });

  describe('tokenSign', () => {
    it('should be defined', () => {
      expect(authService.tokenSign).toBeDefined();
      expect(authService.tokenSign).toBeInstanceOf(Function);
    });

    it('should be return access_token and refresh_token', () => {
      const tokenSign = authService.tokenSign(typia.random<ErAuth.AccessTokenSignPayload>());
      expect(tokenSign).toBeDefined();
      expect(tokenSign).toHaveProperty('access_token');
      expect(tokenSign).toHaveProperty('refresh_token');
    });
  });
});
