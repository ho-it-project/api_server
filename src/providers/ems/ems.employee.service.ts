import { PrismaService } from '@common/prisma/prisma.service';
import { EMS_EMPLOYEE_ERROR } from '@config/errors';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Status } from '@prisma/client';
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
    console.log(employeeInfos);
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
      status: 'ACTIVE' as Status,
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
    const employee = await this.prismaService.ems_Employee.findFirst({
      where: {
        ambulance_company_id,
        id_card,
      },
    });
    if (!employee) {
      return typia.random<EMS_EMPLOYEE_ERROR.EMPLOYEE_NOT_FOUND>();
    }
    const nowComparePassword = await this.authService.comparePassword({
      password: now_password,
      hash: employee.password,
    });
    if (!nowComparePassword) {
      return typia.random<EMS_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_INVALID>();
    }
    const beforeComparePassword = await this.authService.comparePassword({
      password,
      hash: employee.password,
    });
    if (beforeComparePassword) {
      return typia.random<EMS_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_SAME>();
    }
    const updateHashedPassword = await this.authService.hashPassword({ password });

    const updatedEmployee = await this.prismaService.ems_Employee.update({
      where: {
        id_card_ambulance_company_id: {
          id_card,
          ambulance_company_id,
        },
      },
      data: {
        password: updateHashedPassword,
      },
    });
    return updatedEmployee;
  }

  async delete({ employee_id, user }: EmsEmployee.DeleteEmployee) {
    const deleted_at = new Date().getTime().toString();

    const employee = await this.prismaService.ems_Employee.findFirst({
      where: {
        employee_id,
        ambulance_company_id: user.ambulance_company_id,
      },
    });
    if (!employee) {
      return typia.random<EMS_EMPLOYEE_ERROR.EMPLOYEE_NOT_FOUND>();
    }
    if (employee.id_card === 'admin') {
      return typia.random<EMS_EMPLOYEE_ERROR.EMPLOYEE_ADMIN_NOT_DELETE>();
    }

    await this.prismaService.ems_Employee.update({
      where: {
        employee_id,
      },
      data: {
        id_card: deleted_at,
        status: 'DELETED',
      },
    });

    return 'SUCCESS';
  }

  async getEmployeeDetail({ employee_id, user }: EmsEmployee.GetEmployeeDetailArg) {
    const employee = await this.prismaService.ems_Employee.findFirst({
      where: {
        employee_id,
        ambulance_company_id: user.ambulance_company_id,
      },
      include: {
        ambulance_company: true,
      },
    });
    if (!employee) {
      return typia.random<EMS_EMPLOYEE_ERROR.EMPLOYEE_NOT_FOUND>();
    }
    return employee;
  }
}
