import { PrismaService } from '@common/prisma/prisma.service';
import { AUTH_ERROR, isError } from '@config/errors';
import { JwtOption } from '@config/option/interface';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { er_Employee } from '@prisma/client';
import { AuthService } from '@src/auth/provider/common.auth.service';
import { ErAuthService } from '@src/auth/provider/er.auth.service';
import { ErAuthRequest } from '@src/types';
import typia from 'typia';
interface DateString {
  created_at: string;
  updated_at: string;
}

describe('ErAuthService', () => {
  //prisma mock
  let mockErAuthService: ErAuthService;
  let mockAuthService: AuthService;
  let mockPrismaService: jest.MockedObjectDeep<PrismaService>;
  const jwtOption: JwtOption = {
    access_secret: 'access_secret',
    access_expires_in: '7200',
    refresh_expires_in: '60000',
    refresh_secret: 'refresh_secret',
  };
  beforeAll(() => {
    mockPrismaService = jest.mocked<PrismaService>(new PrismaService());
    mockAuthService = new AuthService(new JwtService(), new ConfigService(), jwtOption);
    mockErAuthService = new ErAuthService(mockPrismaService, mockAuthService);
  });
  it('should be defined', () => {
    expect(mockErAuthService).toBeDefined();
    expect(mockErAuthService).toBeInstanceOf(ErAuthService);
    expect(mockErAuthService).toHaveProperty('login');
  });

  describe('login', () => {
    let mockEmployee: er_Employee | DateString;
    let mockLoginDTO: ErAuthRequest.LoginDTO;
    beforeAll(async () => {
      mockEmployee = typia.random<er_Employee>();
      mockLoginDTO = typia.random<ErAuthRequest.LoginDTO>();
      mockPrismaService.er_Employee.findFirst = jest.fn().mockResolvedValue({
        ...mockEmployee,
        password: await mockAuthService.hashPassword({
          password: mockLoginDTO.password,
        }),
      });
    });

    it('should be defined', () => {
      expect(mockErAuthService.login).toBeDefined();
      expect(mockErAuthService.login).toBeInstanceOf(Function);
    });

    it('should be return access_token and refresh_token', async () => {
      const result = await mockErAuthService.login(mockLoginDTO);
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
      const result = await mockErAuthService.login(mockLoginDTO);
      expect(result).toEqual(typia.random<AUTH_ERROR.EMPLOYEE_NOT_FOUND>());
    });
    it('should be return access_token and refresh_token with error [password wrong]', async () => {
      mockPrismaService.er_Employee.findFirst = jest.fn().mockResolvedValue({
        ...mockEmployee,
        password: await mockAuthService.hashPassword({
          password: 'wrong',
        }),
      });
      const result = await mockErAuthService.login(mockLoginDTO);
      expect(result).toEqual(typia.random<AUTH_ERROR.PASSWORD_INCORRECT>());
    });
  });
});
