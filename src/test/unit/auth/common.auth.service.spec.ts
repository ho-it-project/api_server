import { JwtOption } from '@config/option/interface';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ErAuth } from '@src/auth/interface';
import { AuthService } from '@src/auth/provider/common.auth.service';
import typia from 'typia';

describe('AuthService', () => {
  let mockAuthService: AuthService;
  const jwtOption: JwtOption = {
    access_secret: 'access_secret',
    access_expires_in: '7200',
    refresh_expires_in: '60000',
    refresh_secret: 'refresh_secret',
  };
  beforeAll(() => {
    mockAuthService = new AuthService(new JwtService(), new ConfigService(), jwtOption);
  });
  it('should be defined', () => {
    expect(mockAuthService).toBeDefined();
    expect(mockAuthService).toBeInstanceOf(AuthService);
    expect(mockAuthService).toHaveProperty('accessTokenSign');
    expect(mockAuthService).toHaveProperty('accessTokenVerify');
    expect(mockAuthService).toHaveProperty('refreshTokenSign');
    expect(mockAuthService).toHaveProperty('refreshTokenVerify');
    expect(mockAuthService).toHaveProperty('tokenSign');
    expect(mockAuthService).toHaveProperty('hashPassword');
    expect(mockAuthService).toHaveProperty('comparePassword');
  });

  describe('accessTokenSign', () => {
    it('should be defined', () => {
      expect(mockAuthService.accessTokenSign).toBeDefined();
      expect(mockAuthService.accessTokenSign).toBeInstanceOf(Function);
    });

    it('should be return access_token', () => {
      const access_token = mockAuthService.accessTokenSign(typia.random<ErAuth.AccessTokenSignPayload>());
      expect(access_token).toBeDefined();
      expect(typeof access_token).toEqual('string');
    });
  });

  describe('accessTokenVerify', () => {
    it('should be defined', () => {
      expect(mockAuthService.accessTokenVerify).toBeDefined();
      expect(mockAuthService.accessTokenVerify).toBeInstanceOf(Function);
    });

    it('should be return access_token_verify', () => {
      const access_token = mockAuthService.accessTokenSign(typia.random<ErAuth.AccessTokenSignPayload>());
      const access_token_verify = mockAuthService.accessTokenVerify({ access_token });
      expect(access_token_verify).toBeDefined();
      expect(access_token_verify).toHaveProperty('emergency_center_id');
      expect(access_token_verify).toHaveProperty('employee_id');
      expect(access_token_verify).toHaveProperty('id_card');
      expect(access_token_verify).toHaveProperty('role');
    });

    it('should be return access_token_verify with error', () => {
      const access_token_verify = mockAuthService.accessTokenVerify({ access_token: 'error' });
      expect(access_token_verify).toBeDefined();
      expect(access_token_verify).toHaveProperty('name');
      expect(access_token_verify).toHaveProperty('message');
    });
  });

  describe('refreshTokenSign', () => {
    it('should be defined', () => {
      expect(mockAuthService.refreshTokenSign).toBeDefined();
      expect(mockAuthService.refreshTokenSign).toBeInstanceOf(Function);
    });

    it('should be return refresh_token', () => {
      const refresh_token = mockAuthService.refreshTokenSign(typia.random<ErAuth.RefreshTokenSignPayload>());
      expect(refresh_token).toBeDefined();
      expect(typeof refresh_token).toEqual('string');
    });
  });

  describe('refreshTokenVerify', () => {
    it('should be defined', () => {
      expect(mockAuthService.refreshTokenVerify).toBeDefined();
      expect(mockAuthService.refreshTokenVerify).toBeInstanceOf(Function);
    });

    it('should be return refresh_token_verify', () => {
      const refresh_token = mockAuthService.refreshTokenSign(typia.random<ErAuth.RefreshTokenSignPayload>());
      const refresh_token_verify = mockAuthService.refreshTokenVerify({ refresh_token });
      expect(refresh_token_verify).toBeDefined();
      expect(refresh_token_verify).toHaveProperty('emergency_center_id');
      expect(refresh_token_verify).toHaveProperty('employee_id');
      expect(refresh_token_verify).toHaveProperty('id_card');
    });

    it('should be return refresh_token_verify with error', () => {
      const refresh_token_verify = mockAuthService.refreshTokenVerify({ refresh_token: 'error' });
      expect(refresh_token_verify).toBeDefined();
      expect(refresh_token_verify).toHaveProperty('name');
      expect(refresh_token_verify).toHaveProperty('message');
    });
  });

  describe('tokenSign', () => {
    it('should be defined', () => {
      expect(mockAuthService.tokenSign).toBeDefined();
      expect(mockAuthService.tokenSign).toBeInstanceOf(Function);
    });

    it('should be return access_token and refresh_token', () => {
      const tokenSign = mockAuthService.tokenSign(typia.random<ErAuth.AccessTokenSignPayload>());
      expect(tokenSign).toBeDefined();
      expect(tokenSign).toHaveProperty('access_token');
      expect(tokenSign).toHaveProperty('refresh_token');
    });
  });
});
