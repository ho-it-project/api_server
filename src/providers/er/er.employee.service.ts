import { PrismaService } from '@common/prisma/prisma.service';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { AuthService } from '@src/auth/provider/auth.service';
import { EMPLOYEE_ERROR } from '@src/types/errors';
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

    const { emergency_center_id } = user;
    const emergencyCenter = await this.prismaService.er_EmergencyCenter.findFirst({ where: { emergency_center_id } });
    if (!emergencyCenter) {
      throw new BadRequestException(EMPLOYEE_ERROR.EMPLOYEE_NOT_FOUND_IN_EMERGENCY_CENTER);
    }
    const { hospital_id } = emergencyCenter;
    const existEmployeeIdCards = await this.prismaService.er_Employee.findMany({
      where: {
        id_card: {
          in: employees.map((employee) => employee.id_card),
        },
        hospital_id,
      },
    });
    if (existEmployeeIdCards.length > 0) {
      throw new BadRequestException(
        EMPLOYEE_ERROR.EMPLOYEE_MULTIPLE_ALREADY_EXIST(existEmployeeIdCards.map((employee) => employee.id_card)),
      );
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
    console.log(employeeInfos);
    const newEmployees = await this.prismaService.er_Employee.createMany({
      data: employeeInfos,
    });
    return newEmployees;
  }
}
