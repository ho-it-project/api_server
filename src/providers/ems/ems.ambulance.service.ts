import { PrismaService } from '@common/prisma/prisma.service';
import { AUTH_ERROR, EMS_AMBULANCE_ERROR, isError } from '@config/errors';
import { Injectable } from '@nestjs/common';
import { ems_Ambulance } from '@prisma/client';
import { Auth, EmsAuth } from '@src/auth/interface';
import typia from 'typia';
import { EmsAbulance } from '../interface/ems/ems.ambulance.interface';

@Injectable()
export class EmsAmbulanceService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAmbulanceDetail(ambulanceId: string, user?: Auth.CommonPayload) {
    const ambulance = await this.prismaService.ems_Ambulance.findUnique({
      where: {
        ambulance_id: ambulanceId,
      },
      include: {
        ambulance_company: true,
        employees: {
          include: {
            employee: {
              select: {
                employee_id: true,
                employee_name: true,
                id_card: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!ambulance) {
      return typia.random<EMS_AMBULANCE_ERROR.AMBULANCE_NOT_FOUND>();
    }

    const result = {
      ...ambulance,
      employees:
        user && user._type === 'EMS' && ambulance.ambulance_company_id === user.ambulance_company_id
          ? ambulance.employees
          : [],
    };

    return result;
  }

  async setAmbulanceEmployees({
    ambulance_id,
    removal_employee_list = [],
    additional_employee_list = [],
    user,
  }: EmsAbulance.SetAmbulanceEmployees) {
    const ambulance = await this.getAmbulanceDetail(ambulance_id, { ...user, _type: 'EMS' });
    if (isError(ambulance)) {
      return ambulance;
    }
    const { employees } = ambulance;
    const ambulanceAccessForUser = await this.checkAmbulanceAccessForUser(ambulance, user);
    if (isError(ambulanceAccessForUser)) {
      return ambulanceAccessForUser;
    }
    // TODO: employee service로 이동
    const addEmployeeIds = additional_employee_list.map((employee) => employee.employee_id);

    const removeEmployeeIds = removal_employee_list.map((employee) => employee.employee_id);

    const verifyEmployeesForAddition = await this.getEmployeeManyWithAmbulance(addEmployeeIds);
    if (isError(verifyEmployeesForAddition)) {
      return verifyEmployeesForAddition;
    }
    if (
      verifyEmployeesForAddition.some((employee) =>
        employee.ambulances.find((ambulance) => ambulance.ambulance_id === ambulance_id),
      )
    ) {
      return typia.random<EMS_AMBULANCE_ERROR.EMPLOYEE_ALREADY_ASSIGNED>();
    }

    const additionalDriverEmployee = additional_employee_list.filter((employee) => employee.team_role === 'DRIVER');
    if (additionalDriverEmployee.length > 1) {
      return typia.random<EMS_AMBULANCE_ERROR.DRIVER_EMPLOYEE_ONLY>();
    }

    // 만약 추가하려는 직원이 운전기사라면, 기존 직원 중 운전기사가 있는지 확인한다
    // 운전기사가 있다면 추가할 수 없다
    // 하지만 운전기사가 없거나 삭제하려는 직원이 운전기사라면 추가할 수 있다
    const driverEmployee = employees.find((employee) => employee.employee.role === 'DRIVER');
    const driverEmployeeRemoval = removal_employee_list.find((employee) => {
      if (driverEmployee) {
        return employee.employee_id === driverEmployee.employee_id;
      }
      return false;
    });
    if (driverEmployee && !driverEmployeeRemoval && additionalDriverEmployee.length > 0) {
      return typia.random<EMS_AMBULANCE_ERROR.DRIVER_EMPLOYEE_ALREADY_ASSIGNED>();
    }

    const verifyTeamRoleEmployeeForAddition = verifyEmployeesForAddition.filter((employee) => {
      const { role } = employee;
      const additionalEmployee = additional_employee_list.find(
        (employee) => employee.employee_id === employee.employee_id,
      );
      if (!additionalEmployee) return false;
      const { team_role } = additionalEmployee;
      // 응급구조사는 운전기사만 추가할 수 없다
      if (role === 'DRIVER' && team_role === 'EMERGENCY_MEDICAL_TECHNICIAN') {
        return false;
      }
      return true;
    });

    if (verifyTeamRoleEmployeeForAddition.length !== additional_employee_list.length) {
      return typia.random<EMS_AMBULANCE_ERROR.EMPLOYEE_TEAM_ROLE_INVALID>();
    }

    const verifyEmployeesForRemoval = await this.getEmployeeManyWithAmbulance(removeEmployeeIds);
    if (isError(verifyEmployeesForRemoval)) {
      return verifyEmployeesForRemoval;
    }
    if (
      verifyEmployeesForRemoval.some(
        (employee) => employee.ambulances.find((ambulance) => ambulance.ambulance_id === ambulance_id) === undefined,
      )
    ) {
      return typia.random<EMS_AMBULANCE_ERROR.EMPLOYEE_NOT_ASSIGNED>();
    }

    await this.prismaService.$transaction([
      this.createManyAmbulanceEmployee(ambulance_id, additional_employee_list),
      this.deleteManyAmbulanceEmployee(ambulance_id, removeEmployeeIds),
    ]);
    return 'SUCCESS';
  }

  async getAmbulance(ambulanceId: string) {
    const ambulance = await this.prismaService.ems_Ambulance.findUnique({
      where: {
        ambulance_id: ambulanceId,
      },
    });
    if (!ambulance) {
      return typia.random<EMS_AMBULANCE_ERROR.AMBULANCE_NOT_FOUND>();
    }

    return ambulance;
  }

  async checkAmbulanceAccessForUser(ambulance: ems_Ambulance, user: EmsAuth.AccessTokenSignPayload) {
    if (ambulance.ambulance_company_id !== user.ambulance_company_id) {
      return typia.random<AUTH_ERROR.FORBIDDEN>();
    }
    return true;
  }

  createManyAmbulanceEmployee(
    ambulance_id: string,
    additional_employee_list: EmsAbulance.SetAmbulanceEmployees['additional_employee_list'] = [],
  ) {
    return this.prismaService.ems_AmbulanceEmployee.createMany({
      data: additional_employee_list.map((employee) => ({
        ...employee,
        ambulance_id,
      })),
    });
  }

  deleteManyAmbulanceEmployee(ambulance_id: string, employee_id_list: string[]) {
    return this.prismaService.ems_AmbulanceEmployee.deleteMany({
      where: {
        ambulance_id,
        employee_id: {
          in: employee_id_list,
        },
      },
    });
  }

  async getEmployeeManyWithAmbulance(employee_id_list: string[]) {
    const result = await this.prismaService.ems_Employee.findMany({
      where: {
        employee_id: {
          in: employee_id_list,
        },
      },
      include: {
        ambulances: true,
      },
    });
    if (result.length !== employee_id_list.length) {
      return typia.random<EMS_AMBULANCE_ERROR.EMPLOYEE_NOT_FOUND>();
    }
    return result;
  }
}
