import { PrismaService } from '@common/prisma/prisma.service';
import { excludeKeys } from '@common/util/excludeKeys';
import { ER_EMPLOYEE_ERROR } from '@config/errors';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthService } from '@src/auth/provider/common.auth.service';
import typia from 'typia';
import { v4 } from 'uuid';
import { ErEmployee } from '../interface/er/er.employee.interface';

Injectable();
export class ErEmployeeService {
  private readonly logger = new Logger(ErEmployeeService.name);
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {}

  async createDtoValidation({ employees }: Pick<ErEmployee.CreateManyEmployee, 'employees'>) {
    const errors = employees.filter((employee) => {
      const { employee_doctor_specialization_list, employee_nurse_specialization_list, role } = employee;
      return (
        (!(role === 'NURSE') && employee_nurse_specialization_list) || // 간호사가 아닌데 간호사의 전문분야가 존재할 경우
        (!(role === 'RESIDENT' || role === 'SPECIALIST') && employee_doctor_specialization_list) // 의사가 아닌데 의사의 전문분야가 존재할 경우
      );
    });
    return errors;
  }

  async createManyEmployee({ employees, user }: ErEmployee.CreateManyEmployee) {
    const errors = await this.createDtoValidation({ employees });
    if (errors.length > 0) {
      return typia.random<ER_EMPLOYEE_ERROR.EMPLOYEE_ROLE_SPECIALIZATION_NOT_MATCH>();
    }

    this.logger.debug('createManyEmployee');
    const { hospital_id } = user;
    const existEmployeeIdCards = await this.checkManyEmployeeExist({
      id_cards: employees.map((employee) => employee.id_card),
      hospital_id,
    });
    if (existEmployeeIdCards.length > 0) {
      return typia.random<ER_EMPLOYEE_ERROR.EMPLOYEE_MULTIPLE_ALREADY_EXIST>();
    }

    const employeeInfoWithID = employees.map((employee) => {
      return {
        ...employee,
        employee_id: v4(),
      };
    });

    const hashedPasswords = await Promise.all(
      employeeInfoWithID.map(async (employee) => this.authService.hashPassword({ password: employee.password })),
    );

    const excludes: (keyof (typeof employeeInfoWithID)[0])[] = [
      'employee_doctor_specialization_list',
      'employee_nurse_specialization_list',
      'password',
    ];
    const employeeInfos = employeeInfoWithID.map((employee) => {
      const info = excludeKeys(employee, excludes);
      return {
        hospital_id,
        ...info,
        password: hashedPasswords.shift() || '', // 해싱된 패스워드 할당
      };
    });

    const newEmployeeNurseSpecializationList = employeeInfoWithID.filter(
      (employee) => employee.employee_nurse_specialization_list,
    );
    const newEmployeeDoctorSpecializationList = employeeInfoWithID.filter(
      (employee) => employee.employee_doctor_specialization_list,
    );
    const newEmployeeNurseSpecialization = newEmployeeNurseSpecializationList.map((employee) => {
      if (!employee.employee_nurse_specialization_list) return []; // never
      return employee.employee_nurse_specialization_list.map((nurse_specialization_id) => {
        return {
          employee_id: employee.employee_id,
          nurse_specialization_id,
        };
      });
    });

    const newEmployeeDoctorSpecialization = newEmployeeDoctorSpecializationList.map((employee) => {
      if (!employee.employee_doctor_specialization_list) return []; // never
      return employee.employee_doctor_specialization_list.map((doctor_specialization_id) => {
        return {
          employee_id: employee.employee_id,
          doctor_specialization_id,
        };
      });
    });
    const nurseSpecializationFlat = newEmployeeNurseSpecialization.flat();
    const doctorSpecializationFlat = newEmployeeDoctorSpecialization.flat();
    const nurseSpecializationIdList = nurseSpecializationFlat.map((nurseSpecialization) => {
      return nurseSpecialization.nurse_specialization_id;
    });
    const doctorSpecializationIdList = doctorSpecializationFlat.map((doctorSpecialization) => {
      return doctorSpecialization.doctor_specialization_id;
    });
    const uniqueNurseSpecializationIdList = [...new Set(nurseSpecializationIdList)];
    const uniqueDoctorSpecializationIdList = [...new Set(doctorSpecializationIdList)];
    const existNurseSpecialization = uniqueNurseSpecializationIdList.length
      ? await this.prismaService.er_NurseSpecialization.findMany({
          where: {
            nurse_specialization_id: {
              in: uniqueNurseSpecializationIdList,
            },
          },
        })
      : [];
    const existDoctorSpecialization = uniqueDoctorSpecializationIdList.length
      ? await this.prismaService.er_DoctorSpecialization.findMany({
          where: {
            doctor_specialization_id: {
              in: uniqueDoctorSpecializationIdList,
            },
          },
        })
      : [];

    if (existNurseSpecialization.length !== uniqueNurseSpecializationIdList.length) {
      return typia.random<ER_EMPLOYEE_ERROR.EMPLOYEE_ROLE_SPECIALIZATION_NOT_MATCH>();
    }
    if (existDoctorSpecialization.length !== uniqueDoctorSpecializationIdList.length) {
      return typia.random<ER_EMPLOYEE_ERROR.EMPLOYEE_ROLE_SPECIALIZATION_NOT_MATCH>();
    }

    const createEmployees = this.prismaService.er_Employee.createMany({
      data: employeeInfos,
    });
    const createEmployeeNurseSpecialization = this.prismaService.er_EmployeeNurseSpecialization.createMany({
      data: newEmployeeNurseSpecialization.flat(),
    });
    const createEmployeeDoctorSpecialization = this.prismaService.er_EmployeeDoctorSpecialization.createMany({
      data: newEmployeeDoctorSpecialization.flat(),
    });

    const [newEmployees] = await this.prismaService.$transaction([
      createEmployees,
      createEmployeeNurseSpecialization,
      createEmployeeDoctorSpecialization,
    ]);
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

  async getEmployeeListByQuery({ user, query }: ErEmployee.GetEmployeeList) {
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
    const employees: ErEmployee.GetEmpoyeeWithoutPassword[] = await this.prismaService.er_Employee.findMany(arg);
    const employee_count = await this.prismaService.er_Employee.count({
      where: arg.where,
    });

    return { employee_list: employees, count: employee_count };
  }

  async getNurseSpecialization() {
    const nurseSpecializationList = await this.prismaService.er_NurseSpecialization.findMany();
    return nurseSpecializationList;
  }
}
