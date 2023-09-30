import { PrismaService } from '@common/prisma/prisma.service';
import { EMS_EMPLOYEE_ERROR, isError } from '@config/errors';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, PrismaPromise } from '@prisma/client';
import { EmsAuth } from '@src/auth/interface';
import { AuthService } from '@src/auth/provider/common.auth.service';
import { EmsEmployeeService } from '@src/providers/ems/ems.employee.service';
import { EmsEmployeeRequest } from '@src/types/ems.request.dto';
import typia, { tags } from 'typia';

describe('EmsEmployeeService', () => {
  let mockEmsEmployeeService: EmsEmployeeService;
  let mockPrismaService: jest.MockedObjectDeep<PrismaService>;
  let mockAuthService: AuthService;

  it('should be sucess', () => {
    expect(true).toBeTruthy();
  });
  afterAll(() => {
    jest.clearAllMocks();
  });
  beforeAll(() => {
    mockPrismaService = jest.mocked(new PrismaService());
  });
  beforeEach(async () => {
    mockAuthService = new AuthService(new JwtService(), new ConfigService(), {
      refresh_expires_in: '1d',
      refresh_secret: 'refresh_secret',
      access_expires_in: '1d',
      access_secret: 'access_secret',
    });

    mockEmsEmployeeService = new EmsEmployeeService(mockAuthService, mockPrismaService);
  });

  it('should be defined', () => {
    expect(mockEmsEmployeeService).toBeDefined();
  });

  describe('checkManyEmployeeExist', () => {
    beforeEach(() => {
      jest.spyOn(mockPrismaService.ems_Employee, 'findMany').mockResolvedValue([]);
    });
    afterEach(async () => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(mockEmsEmployeeService.checkManyEmployeeExist).toBeDefined();
    });

    it('should be call ems_Employee.findMany', async () => {
      await mockEmsEmployeeService.checkManyEmployeeExist({
        id_cards: [],
        ambulance_company_id: '',
      });
      expect(mockPrismaService.ems_Employee.findMany).toBeCalled();
    });

    it('should be return employee_list', async () => {
      const employee_list = await mockEmsEmployeeService.checkManyEmployeeExist({
        id_cards: typia.random<string[] & tags.MinItems<10> & tags.MaxItems<10>>(),
        ambulance_company_id: typia.random<string>(),
      });
      expect(employee_list).toBeDefined();
      expect(employee_list).toEqual([]);
    });
  });

  describe('createManyEmployee', () => {
    let createManyEmployee: EmsEmployeeRequest.CreateManyDTO;
    beforeEach(() => {
      createManyEmployee = typia.random<EmsEmployeeRequest.CreateManyDTO>();
      jest.spyOn(mockPrismaService.ems_Employee, 'createMany').mockResolvedValue({
        count: createManyEmployee.employees.length,
      } as unknown as PrismaPromise<Prisma.BatchPayload>);

      jest.spyOn(mockEmsEmployeeService, 'checkManyEmployeeExist').mockImplementation(async () => []);
      jest.spyOn(mockAuthService, 'hashPassword').mockImplementation(async () => 'hashedPassword');
    });
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(mockEmsEmployeeService.createManyEmployee).toBeDefined();
    });

    it('should be call checkManyEmployeeExist', async () => {
      await mockEmsEmployeeService.createManyEmployee({
        employees: createManyEmployee.employees,
        user: typia.random<EmsAuth.AccessTokenSignPayload>(),
      });
      expect(mockEmsEmployeeService.checkManyEmployeeExist).toBeCalled();
    });

    it('should be call hashPassword ', async () => {
      await mockEmsEmployeeService.createManyEmployee({
        employees: createManyEmployee.employees,
        user: typia.random<EmsAuth.AccessTokenSignPayload>(),
      });
      expect(mockAuthService.hashPassword).toBeCalled();
    });

    it('should be call ems_Employee.createMany', async () => {
      await mockEmsEmployeeService.createManyEmployee({
        employees: createManyEmployee.employees,
        user: typia.random<EmsAuth.AccessTokenSignPayload>(),
      });
      expect(mockPrismaService.ems_Employee.createMany).toBeCalled();
    });

    it('should be return newEmployees count', async () => {
      const result = await mockEmsEmployeeService.createManyEmployee({
        employees: createManyEmployee.employees,
        user: typia.random<EmsAuth.AccessTokenSignPayload>(),
      });
      if (isError(result)) {
        throw new Error('test fail');
      }
      expect(result).toBeDefined();
      expect(result).toHaveProperty('count');
      expect(result.count).toEqual(createManyEmployee.employees.length);
    });

    it('should be return EMPLOYEE_MULTIPLE_ALREADY_EXIST', async () => {
      jest
        .spyOn(mockEmsEmployeeService, 'checkManyEmployeeExist')
        .mockImplementation(async () => [{ id_card: 'test' }]);

      const result = await mockEmsEmployeeService.createManyEmployee({
        employees: createManyEmployee.employees,
        user: typia.random<EmsAuth.AccessTokenSignPayload>(),
      });
      expect(result).toEqual(typia.random<EMS_EMPLOYEE_ERROR.EMPLOYEE_MULTIPLE_ALREADY_EXIST>());
    });
  });
});
