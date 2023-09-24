import { PrismaService } from '@common/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, PrismaPromise, er_Employee } from '@prisma/client';
import { Auth } from '@src/auth/interface/auth.interface';
import { AuthService } from '@src/auth/provider/auth.service';
import { ErEmployeeService } from '@src/providers/er/er.employee.service';
import { EmployeeRequest } from '@src/types';
import { EMPLOYEE_ERROR } from '@src/types/errors';
import typia, { tags } from 'typia';

describe('ErEmployeeService', () => {
  let erEmployeeService: ErEmployeeService;
  let mockPrismaService: jest.MockedObjectDeep<PrismaService>;
  let mockAuthService: AuthService;
  beforeEach(() => {
    mockPrismaService = jest.mocked(new PrismaService());
    mockAuthService = new AuthService(mockPrismaService, new JwtService(), new ConfigService(), {
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
    afterEach(() => {
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
    let createManyEmployee: EmployeeRequest.CreateManyDTO;
    beforeEach(() => {
      createManyEmployee = typia.random<EmployeeRequest.CreateManyDTO>();
      jest
        .spyOn(mockPrismaService.er_Employee, 'createMany')
        .mockImplementation(async (info: Prisma.er_EmployeeCreateManyArgs) => {
          // 원래의 createMany 메서드를 호출합니다.
          // 결과를 PrismaPromise<BatchPayload> 타입으로 캐스팅하고 반환합니다.
          return {
            count: Array.isArray(info.data) ? info.data.length : 1,
          } as unknown as PrismaPromise<Prisma.BatchPayload>;
        });
      jest.spyOn(erEmployeeService, 'checkManyEmployeeExist').mockImplementation(async () => []);
      jest.spyOn(mockAuthService, 'hashPassword').mockImplementation(async () => 'hashedPassword');
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
        user: typia.random<Auth.AccessTokenSignPayload>(),
      });
      expect(result).toBeDefined();
      expect(result).toHaveProperty('count');
      expect(result.count).toEqual(createManyEmployee.employees.length);
    });

    it('should be call checkManyEmployeeExist', async () => {
      await erEmployeeService.createManyEmployee({
        employees: createManyEmployee.employees,
        user: typia.random<Auth.AccessTokenSignPayload>(),
      });
      expect(erEmployeeService.checkManyEmployeeExist).toBeCalled();
    });

    it("should be throw BadRequestException when existEmployeeIdCards's length is greater than 0", async () => {
      jest
        .spyOn(erEmployeeService, 'checkManyEmployeeExist')
        .mockImplementation(async () => [...createManyEmployee.employees]);

      const result = erEmployeeService.createManyEmployee({
        employees: createManyEmployee.employees,
        user: typia.random<Auth.AccessTokenSignPayload>(),
      });
      await expect(result).rejects.toThrowError();
      await expect(result).rejects.toThrowError(
        new BadRequestException(
          EMPLOYEE_ERROR.EMPLOYEE_MULTIPLE_ALREADY_EXIST(
            createManyEmployee.employees.map((employee) => employee.id_card),
          ),
        ),
      );
    });

    it('should be call hashPassword', async () => {
      await erEmployeeService.createManyEmployee({
        employees: createManyEmployee.employees,
        user: typia.random<Auth.AccessTokenSignPayload>(),
      });
      expect(mockAuthService.hashPassword).toBeCalled();
    });

    it('should be call er_Employee.createMany', async () => {
      await erEmployeeService.createManyEmployee({
        employees: createManyEmployee.employees,
        user: typia.random<Auth.AccessTokenSignPayload>(),
      });
      expect(mockPrismaService.er_Employee.createMany).toBeCalled();
    });

    it('should be call er_Employee.createMany with data', async () => {
      await erEmployeeService.createManyEmployee({
        employees: createManyEmployee.employees,
        user: typia.random<Auth.AccessTokenSignPayload>(),
      });
      expect(mockPrismaService.er_Employee.createMany).toBeCalledWith({
        data: createManyEmployee.employees.map((employee) => ({
          hospital_id: expect.any(String),
          ...employee,
          password: 'hashedPassword',
        })),
      });
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
      expect(result).toBeDefined();
      expect(result).toHaveProperty('password');
      await expect(
        mockAuthService.comparePassword({ password: update_password, hash: result.password }),
      ).resolves.toBeTruthy();
    });

    it('should be throw BadRequestException when er_Employee is not exist', async () => {
      const result = erEmployeeService.updatePassword({
        id_card: typia.random<string>(),
        password: typia.random<string>(),
        hospital_id: typia.random<string>(),
        now_password: typia.random<string>(),
      });
      await expect(result).rejects.toThrowError(BadRequestException);
      await expect(result).rejects.toThrowError(new BadRequestException(EMPLOYEE_ERROR.EMPLOYEE_NOT_FOUND));
    });

    it('should be throw BadRequestionExtion when now_password is invalid', async () => {
      const er = typia.random<er_Employee>();
      jest.spyOn(mockPrismaService.er_Employee, 'findFirst').mockImplementation(async () => er);
      const result = erEmployeeService.updatePassword({
        id_card: typia.random<string>(),
        password: typia.random<string>(),
        hospital_id: typia.random<string>(),
        now_password: typia.random<string>(),
      });
      await expect(result).rejects.toThrowError(BadRequestException);
      await expect(result).rejects.toThrowError(new BadRequestException(EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_INVALID));
    });
  });
});
