import { PrismaService } from '@common/prisma/prisma.service';
import { AUTH_ERROR, isError } from '@config/errors';
import { JwtOption } from '@config/option/interface';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ems_Employee } from '@prisma/client';
import { AuthService } from '@src/auth/provider/common.auth.service';
import { EmsAuthService } from '@src/auth/provider/ems.auth.service';
import { EmsAuthRequest } from '@src/types/ems.request.dto';
import typia from 'typia';
interface DateString {
  created_at: string;
  updated_at: string;
}

describe('EmsAuthService', () => {
  //prisma mock
  let mockEmsAuthService: EmsAuthService;
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
    mockEmsAuthService = new EmsAuthService(mockAuthService, mockPrismaService);
  });
  it('should be defined', () => {
    expect(mockEmsAuthService).toBeDefined();
    expect(mockEmsAuthService).toBeInstanceOf(EmsAuthService);
    expect(mockEmsAuthService).toHaveProperty('login');
  });

  describe('login', () => {
    let mockEmployee: ems_Employee | DateString;
    let mockLoginDTO: EmsAuthRequest.LoginDTO;
    beforeAll(async () => {
      mockEmployee = typia.random<ems_Employee>();
      mockLoginDTO = typia.random<EmsAuthRequest.LoginDTO>();
      mockPrismaService.ems_Employee.findFirst = jest.fn().mockResolvedValue({
        ...mockEmployee,
        password: await mockAuthService.hashPassword({
          password: mockLoginDTO.password,
        }),
      });
    });

    it('should be defined', () => {
      expect(mockEmsAuthService.login).toBeDefined();
      expect(mockEmsAuthService.login).toBeInstanceOf(Function);
    });

    it('should be return access_token and refresh_token', async () => {
      const result = await mockEmsAuthService.login(mockLoginDTO);
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
      mockPrismaService.ems_Employee.findFirst = jest.fn().mockResolvedValue(null);
      const result = await mockEmsAuthService.login(mockLoginDTO);
      expect(result).toEqual(typia.random<AUTH_ERROR.EMPLOYEE_NOT_FOUND>());
    });
    it('should be return access_token and refresh_token with error [password wrong]', async () => {
      mockPrismaService.ems_Employee.findFirst = jest.fn().mockResolvedValue({
        ...mockEmployee,
        password: await mockAuthService.hashPassword({
          password: 'wrong',
        }),
      });
      const result = await mockEmsAuthService.login(mockLoginDTO);
      expect(result).toEqual(typia.random<AUTH_ERROR.PASSWORD_INCORRECT>());
    });
  });
});
