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
    const { hospital_id } = user;
    const existEmployeeIdCards = await this.checkManyEmployeeExist({
      id_cards: employees.map((employee) => employee.id_card),
      hospital_id,
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
      throw new BadRequestException(EMPLOYEE_ERROR.EMPLOYEE_NOT_FOUND);
    }
    const comparePassword = await this.authService.comparePassword({
      password: now_password,
      hash: existEmployee.password,
    });
    if (!comparePassword) {
      throw new BadRequestException(EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_INVALID);
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
}
