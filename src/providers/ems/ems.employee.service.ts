import { PrismaService } from '@common/prisma/prisma.service';
import { EMS_EMPLOYEE_ERROR } from '@config/errors';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AuthService } from '@src/auth/provider/common.auth.service';
import typia from 'typia';
import { EmsEmployee } from '../interface/ems/ems.employee.interface';

@Injectable()
export class EmsEmployeeService {
  private readonly logger = new Logger(EmsEmployeeService.name);
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {}

  async createManyEmployee({ employees, user }: EmsEmployee.CreateManyEmployee) {
    const existEmployeeIdCards = await this.checkManyEmployeeExist({
      id_cards: employees.map((employee) => employee.id_card),
      ambulance_company_id: user.ambulance_company_id,
    });
    if (existEmployeeIdCards.length > 0) {
      this.logger.error('createManyEmployee', typia.random<EMS_EMPLOYEE_ERROR.EMPLOYEE_MULTIPLE_ALREADY_EXIST>());
      return typia.random<EMS_EMPLOYEE_ERROR.EMPLOYEE_MULTIPLE_ALREADY_EXIST>();
    }
    const employeeInfos = await Promise.all(
      employees.map(async (employee) => {
        const hashedPassword = await this.authService.hashPassword({ password: employee.password });
        return {
          ambulance_company_id: user.ambulance_company_id,
          ...employee,
          password: hashedPassword,
        };
      }),
    );
    const newEmployees = await this.prismaService.ems_Employee.createMany({
      data: employeeInfos,
    });
    return newEmployees;
  }

  async checkManyEmployeeExist({ id_cards, ambulance_company_id }: EmsEmployee.CheckManyEmployeeExist) {
    const employee_list = await this.prismaService.ems_Employee.findMany({
      select: {
        id_card: true,
        password: false,
      },
      where: {
        id_card: {
          in: id_cards,
        },
        ambulance_company_id,
      },
    });
    return employee_list;
  }

  async getEmployeeList({ query, user }: EmsEmployee.GetEmployeeList) {
    const { page = 1, limit = 10, role, search, search_type } = query;

    const skip = (page - 1) * limit;

    const where = {
      ambulance_company_id: user.ambulance_company_id,
      ...(role && { role: { in: role } }),
      ...(search && search_type && { [search_type]: { contains: search } }),
    };
    const arg = {
      where,
      skip,
      take: limit,
    };
    const employee_list = await this.prismaService.ems_Employee.findMany(arg);
    const count = await this.prismaService.ems_Employee.count({
      where: arg.where,
    });

    return { employee_list, count };
  }

  async updatePassword({ ambulance_company_id, id_card, password, now_password }: EmsEmployee.UpdatePassword) {
    console.log('updatePassword', { ambulance_company_id, id_card, password, now_password });
    const employee = await this.prismaService.ems_Employee.findFirst({
      where: {
        ambulance_company_id,
        id_card,
      },
    });
    if (!employee) {
      return typia.random<EMS_EMPLOYEE_ERROR.EMPLOYEE_NOT_FOUND>();
    }
    const beforeComparePassword = await this.authService.comparePassword({
      password,
      hash: employee.password,
    });
    if (beforeComparePassword) {
      return typia.random<EMS_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_SAME>();
    }

    const nowComparePassword = await this.authService.comparePassword({
      password: now_password,
      hash: employee.password,
    });
    if (!nowComparePassword) {
      return typia.random<EMS_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_INVALID>();
    }
    const updatedEmployee = await this.prismaService.ems_Employee.update({
      where: {
        id_card_ambulance_company_id: {
          id_card,
          ambulance_company_id,
        },
      },
      data: {
        password: await this.authService.hashPassword({ password }),
      },
    });
    return updatedEmployee;
  }
}
