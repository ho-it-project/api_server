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
}
