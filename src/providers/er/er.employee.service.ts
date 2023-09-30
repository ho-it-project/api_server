import { PrismaService } from '@common/prisma/prisma.service';
import { ER_EMPLOYEE_ERROR } from '@config/errors';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthService } from '@src/auth/provider/auth.service';
import typia from 'typia';
import { ErEmployee } from '../interface/er/er.employee.interface';

Injectable();
export class ErEmployeeService {
  private readonly logger = new Logger(ErEmployeeService.name);
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {}

  async createManyEmployee({ employees, user }: ErEmployee.CreateManyEmployee) {
    this.logger.debug('createManyEmployee');
    const { hospital_id } = user;
    const existEmployeeIdCards = await this.checkManyEmployeeExist({
      id_cards: employees.map((employee) => employee.id_card),
      hospital_id,
    });
    if (existEmployeeIdCards.length > 0) {
      return typia.random<ER_EMPLOYEE_ERROR.EMPLOYEE_MULTIPLE_ALREADY_EXIST>();
    }
    const employeeInfos = await Promise.all(
      employees.map(async (employee) => {
        const hashedPassword = await this.authService.hashPassword({ password: employee.password });
        return {
          hospital_id,
          ...employee,
          password: hashedPassword,
        };
      }),
    );
    const newEmployees = await this.prismaService.er_Employee.createMany({
      data: employeeInfos,
    });
    return newEmployees;
  }

  async checkManyEmployeeExist({ id_cards, hospital_id }: ErEmployee.CheckManyEmployeeExist) {
    this.logger.debug('checkManyEmployeeExist');
    const existEmployeeIdCards = await this.prismaService.er_Employee.findMany({
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
    return existEmployeeIdCards;
  }

  async updatePassword({ id_card, password, hospital_id, now_password }: ErEmployee.UpdatePassword) {
    this.logger.debug('updatePassword');
    const existEmployee = await this.prismaService.er_Employee.findFirst({
      where: {
        id_card,
        hospital_id,
      },
    });
    if (!existEmployee) {
      return typia.random<ER_EMPLOYEE_ERROR.EMPLOYEE_NOT_FOUND>();
    }
    const beforeComparePassword = await this.authService.comparePassword({
      password,
      hash: existEmployee.password,
    });
    if (beforeComparePassword) {
      return typia.random<ER_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_SAME>();
    }

    const nowComparePassword = await this.authService.comparePassword({
      password: now_password,
      hash: existEmployee.password,
    });
    if (!nowComparePassword) {
      return typia.random<ER_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_INVALID>();
    }
    const updatedEmployee = await this.prismaService.er_Employee.update({
      where: {
        id_card_hospital_id: {
          id_card,
          hospital_id,
        },
      },
      data: {
        password: await this.authService.hashPassword({ password }),
      },
    });

    return updatedEmployee;
  }

  async getEmployeeListByQuery({
    user,
    query,
  }: ErEmployee.GetEmployeeList): Promise<ErEmployee.GetEmployeeListQueryReturn> {
    const { hospital_id } = user;
    const { page = 1, limit = 10, search = '', role, search_type } = query;

    const skip = (page - 1) * limit;

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
    };
    const employees: ErEmployee.GetEmpoyeeWithoutPassword[] = await this.prismaService.er_Employee.findMany(arg);
    const employee_count = await this.prismaService.er_Employee.count({
      where: arg.where,
    });

    return { employee_list: employees, count: employee_count };
  }
}
