import { PrismaService } from '@common/prisma/prisma.service';
import { ER_EMPLOYEE_ERROR, isError } from '@config/errors';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, PrismaPromise, er_Employee, er_EmployeeRole } from '@prisma/client';
import { ErAuth } from '@src/auth/interface';
import { AuthService } from '@src/auth/provider/common.auth.service';
import { ErEmployeeService } from '@src/providers/er/er.employee.service';
import { ErEmployeeRequest } from '@src/types';
import typia, { tags } from 'typia';
import { excludeKeys } from './../../../../common/util/excludeKeys';

describe('ErEmployeeService', () => {
  let erEmployeeService: ErEmployeeService;
  let mockPrismaService: jest.MockedObjectDeep<PrismaService>;
  let mockAuthService: AuthService;

  beforeAll(() => {
    mockPrismaService = jest.mocked(new PrismaService());
  });
  afterAll(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    mockAuthService = new AuthService(new JwtService(), new ConfigService(), {
      refresh_expires_in: '1d',
      refresh_secret: 'refresh_secret',
      access_expires_in: '1d',
      access_secret: 'access_secret',
    });
    erEmployeeService = new ErEmployeeService(mockAuthService, mockPrismaService);
  });

  it('should be defined', () => {
    expect(erEmployeeService).toBeDefined();
  });

  describe('checkManyEmployeeExist', () => {
    beforeEach(() => {
      jest.spyOn(mockPrismaService.er_Employee, 'findMany').mockImplementation(async () => []);
    });
    afterEach(async () => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(erEmployeeService.checkManyEmployeeExist).toBeDefined();
    });

    it('should be return existEmployeeIdCards', async () => {
      const existEmployeeIdCards = await erEmployeeService.checkManyEmployeeExist({
        id_cards: typia.random<string[] & tags.MinItems<10> & tags.MaxItems<10>>(),
        hospital_id: typia.random<string>(),
      });
      expect(existEmployeeIdCards).toBeDefined();
      expect(existEmployeeIdCards).toEqual([]);
    });

    it('should be call er_Employee.findMany', async () => {
      await erEmployeeService.checkManyEmployeeExist({
        id_cards: typia.random<string[] & tags.MinItems<10> & tags.MaxItems<10>>(),
        hospital_id: typia.random<string>(),
      });
      expect(mockPrismaService.er_Employee.findMany).toBeCalled();
    });

    it('should be call er_Employee.findMany with where', async () => {
      const id_cards = typia.random<string[] & tags.MinItems<10> & tags.MaxItems<10>>();
      const hospital_id = typia.random<string>();
      await erEmployeeService.checkManyEmployeeExist({
        id_cards,
        hospital_id,
      });
      expect(mockPrismaService.er_Employee.findMany).toBeCalledWith({
        select: {
          id_card: true,
          password: false,
        },
        where: {
          id_card: {
            in: id_cards,
          },
          hospital_id,
        },
        distinct: 'password',
      });
    });
  });

  describe('createManyEmployee', () => {
    let createManyEmployee: ErEmployeeRequest.CreateManyDTO;
    beforeEach(() => {
      createManyEmployee = {
        employees: typia.random<ErEmployeeRequest.CreateManyDTO['employees']>().map((employee) => ({
          ...excludeKeys(employee, ['employee_doctor_specialization_list', 'employee_nurse_specialization_list']),
        })),
      };
      jest
        .spyOn(mockPrismaService.er_Employee, 'createMany')
        .mockImplementation(async (info: Prisma.er_EmployeeCreateManyArgs) => {
          // 원래의 createMany 메서드를 호출합니다.
          // 결과를 PrismaPromise<BatchPayload> 타입으로 캐스팅하고 반환합니다.
          return {
            count: Array.isArray(info.data) ? info.data.length : 1,
          } as unknown as PrismaPromise<Prisma.BatchPayload>;
        });
      jest.spyOn(mockPrismaService.er_NurseSpecialization, 'findMany').mockImplementation(async () => []);
      jest.spyOn(mockPrismaService.er_DoctorSpecialization, 'findMany').mockImplementation(async () => []);

      jest.spyOn(erEmployeeService, 'checkManyEmployeeExist').mockImplementation(async () => []);
      jest.spyOn(mockAuthService, 'hashPassword').mockImplementation(async () => 'hashedPassword');
      jest.spyOn(mockPrismaService, '$transaction').mockImplementation(async () => [typia.random<er_Employee>()]);
    });
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(erEmployeeService.createManyEmployee).toBeDefined();
    });

    it('should be return newEmployees', async () => {
      const result = await erEmployeeService.createManyEmployee({
        employees: createManyEmployee.employees,
        user: typia.random<ErAuth.AccessTokenSignPayload>(),
      });
      if (isError(result)) {
        throw Error('test fail');
      }
      expect(result).toBeDefined();
    });

    it('should be call checkManyEmployeeExist', async () => {
      await erEmployeeService.createManyEmployee({
        employees: createManyEmployee.employees,
        user: typia.random<ErAuth.AccessTokenSignPayload>(),
      });
      expect(erEmployeeService.checkManyEmployeeExist).toBeCalled();
    });

    it("should be throw BadRequestException when existEmployeeIdCards's length is greater than 0", async () => {
      jest
        .spyOn(erEmployeeService, 'checkManyEmployeeExist')
        .mockImplementation(async () => [...createManyEmployee.employees]);

      const result = await erEmployeeService.createManyEmployee({
        employees: createManyEmployee.employees,
        user: typia.random<ErAuth.AccessTokenSignPayload>(),
      });
      expect(result).toEqual(typia.random<ER_EMPLOYEE_ERROR.EMPLOYEE_MULTIPLE_ALREADY_EXIST>());
    });

    it("should be throw BadRequestException when employee's role and specialization not match", async () => {
      const employee = createManyEmployee.employees[0];
      const result = await erEmployeeService.createManyEmployee({
        employees: [
          {
            ...employee,
            employee_doctor_specialization_list: [typia.random<string>()],
          },
        ],
        user: typia.random<ErAuth.AccessTokenSignPayload>(),
      });
      expect(result).toEqual(typia.random<ER_EMPLOYEE_ERROR.EMPLOYEE_ROLE_SPECIALIZATION_NOT_MATCH>());
    });

    it('should be call hashPassword', async () => {
      await erEmployeeService.createManyEmployee({
        employees: createManyEmployee.employees,
        user: typia.random<ErAuth.AccessTokenSignPayload>(),
      });
      expect(mockAuthService.hashPassword).toBeCalled();
    });

    it('should be call er_Employee.createMany', async () => {
      await erEmployeeService.createManyEmployee({
        employees: createManyEmployee.employees,
        user: typia.random<ErAuth.AccessTokenSignPayload>(),
      });
      expect(mockPrismaService.er_Employee.createMany).toBeCalled();
    });
  });

  describe('updatePassword', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(erEmployeeService.updatePassword).toBeDefined();
    });

    beforeEach(() => {
      jest.spyOn(mockPrismaService.er_Employee, 'findFirst').mockImplementation(async () => null);
    });

    it('should be success', async () => {
      const now_password = typia.random<string>();
      const now_hashedPassword = await mockAuthService.hashPassword({ password: now_password });
      const update_password = typia.random<string>();
      const update_hashedPassword = await mockAuthService.hashPassword({ password: update_password });
      jest
        .spyOn(mockPrismaService.er_Employee, 'findFirst')
        .mockImplementation(async () => ({ ...typia.random<er_Employee>(), password: now_hashedPassword }));

      jest
        .spyOn(mockPrismaService.er_Employee, 'update')
        .mockImplementation(async () => ({ ...typia.random<er_Employee>(), password: update_hashedPassword }));

      const result = await erEmployeeService.updatePassword({
        id_card: typia.random<string>(),
        password: update_password,
        hospital_id: typia.random<string>(),
        now_password,
      });
      if (isError(result)) {
        throw Error('test fail');
      }
      expect(result).toBeDefined();
      expect(result).toHaveProperty('password');
      await expect(
        mockAuthService.comparePassword({ password: update_password, hash: result.password }),
      ).resolves.toBeTruthy();
    });

    it('should be throw BadRequestException when er_Employee is not exist', async () => {
      const result = await erEmployeeService.updatePassword({
        id_card: typia.random<string>(),
        password: typia.random<string>(),
        hospital_id: typia.random<string>(),
        now_password: typia.random<string>(),
      });
      expect(result).toEqual(typia.random<ER_EMPLOYEE_ERROR.EMPLOYEE_NOT_FOUND>());
    });

    it('should be return EMPLOYEE_PASSWORD_INVALID when now_password is invalid', async () => {
      const er = typia.random<er_Employee>();
      jest.spyOn(mockPrismaService.er_Employee, 'findFirst').mockImplementation(async () => er);
      const result = await erEmployeeService.updatePassword({
        id_card: typia.random<string>(),
        password: typia.random<string>(),
        hospital_id: typia.random<string>(),
        now_password: typia.random<string>(),
      });
      expect(result).toEqual(typia.random<ER_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_INVALID>());
    });
  });

  describe('getEmployeeListByQuery', () => {
    beforeEach(() => {
      jest.spyOn(mockPrismaService.er_Employee, 'findMany').mockImplementation(async () => []);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(erEmployeeService.getEmployeeListByQuery).toBeDefined();
    });

    it('should be call er_Employee.findMany with where', async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        search: typia.random<string>(),
        search_type: typia.random<'id_card' | 'employee_name'>(),
        role: typia.random<er_EmployeeRole>(),
      };
      const { page, limit, search, search_type, role } = mockQuery;
      const user = typia.random<ErAuth.AccessTokenSignPayload>();
      const skip = (page - 1) * limit;
      const { hospital_id } = user;
      await erEmployeeService.getEmployeeListByQuery({ query: mockQuery, user });
      const arg: Prisma.er_EmployeeFindManyArgs = {
        skip,
        take: limit,
        where: {
          hospital_id,
          id_card:
            search_type === 'id_card'
              ? {
                  contains: search,
                }
              : undefined,
          employee_name:
            search_type === 'employee_name'
              ? {
                  contains: search,
                }
              : undefined,
          role: role,
        },
        orderBy: {
          created_at: 'desc',
        },
        include: {
          employee_doctor_specializations: {
            include: {
              doctor_specialization: true,
            },
          },
          employee_nurse_specializations: {
            include: {
              nurse_specialization: true,
            },
          },
          department: true,
        },
      };
      expect(mockPrismaService.er_Employee.findMany).toBeCalled();
      expect(mockPrismaService.er_Employee.findMany).toBeCalledWith(arg);
    });

    it('should be return employees', async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        search: typia.random<string>(),
        search_type: typia.random<'id_card' | 'employee_name'>(),
        role: typia.random<er_EmployeeRole>(),
      };
      const user = typia.random<ErAuth.AccessTokenSignPayload>();
      const mockEmployees = typia.random<Omit<er_Employee, 'password'>[]>();
      jest.spyOn(mockPrismaService.er_Employee, 'findMany').mockImplementation(async () => mockEmployees);
      jest.spyOn(mockPrismaService.er_Employee, 'count').mockImplementation(async () => mockEmployees.length);
      const result = await erEmployeeService.getEmployeeListByQuery({ query: mockQuery, user });
      expect(result).toBeDefined();
      expect(result).toEqual({ employee_list: mockEmployees, count: mockEmployees.length });
    });
  });
});
