import { PrismaService } from '@common/prisma/prisma.service';
import { AUTH_ERROR, EMS_AMBULANCE_ERROR, isError } from '@config/errors';
import { Injectable } from '@nestjs/common';
import { ems_Ambulance } from '@prisma/client';
import { EmsAuth } from '@src/auth/interface';
import typia from 'typia';

@Injectable()
export class EmsAmbulanceService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAmbulanceDetail(ambulanceId: string) {
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

    return ambulance;
  }

  async setAmbulanceEmployees({
    ambulance_id,
    employee_list,
    user,
  }: {
    ambulance_id: string;
    employee_list: {
      employee_id: string;
      action: 'ADD' | 'REMOVE';
    }[];
    user: EmsAuth.AccessTokenSignPayload;
  }) {
    const ambulance = await this.getAmbulanceDetail(ambulance_id);
    if (isError(ambulance)) {
      return ambulance;
    }
    const ambulanceAccessForUser = await this.checkAmbulanceAccessForUser(ambulance, user);
    if (isError(ambulanceAccessForUser)) {
      return ambulanceAccessForUser;
    }
    // TODO: employee service로 이동
    const addEmployeeIds = employee_list
      .filter((employee) => employee.action === 'ADD')
      .map((employee) => employee.employee_id);

    const removeEmployeeIds = employee_list
      .filter((employee) => employee.action === 'REMOVE')
      .map((employee) => employee.employee_id);

    const addEmployeeManyWithAmbulance = await this.getEmployeeManyWithAmbulance(addEmployeeIds);
    if (isError(addEmployeeManyWithAmbulance)) {
      return addEmployeeManyWithAmbulance;
    }
    if (
      addEmployeeManyWithAmbulance.some(
        (employee) => employee.ambulances.length && employee.ambulances[0].ambulance_id === ambulance_id,
      )
    ) {
      return typia.random<EMS_AMBULANCE_ERROR.EMPLOYEE_ALREADY_ASSIGNED>();
    }

    const removeEmployeeManyWithAmbulance = await this.getEmployeeManyWithAmbulance(removeEmployeeIds);
    if (isError(removeEmployeeManyWithAmbulance)) {
      return removeEmployeeManyWithAmbulance;
    }
    if (
      removeEmployeeManyWithAmbulance.some(
        (employee) => !employee.ambulances.length || employee.ambulances[0].ambulance_id !== ambulance_id,
      )
    ) {
      return typia.random<EMS_AMBULANCE_ERROR.EMPLOYEE_NOT_ASSIGNED>();
    }

    await this.prismaService.$transaction([
      this.createManyAmbulanceEmployee(ambulance_id, addEmployeeIds),
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

  createManyAmbulanceEmployee(ambulance_id: string, employee_id_list: string[]) {
    return this.prismaService.ems_AmbulanceEmployee.createMany({
      data: employee_id_list.map((employee_id) => ({
        ambulance_id,
        employee_id,
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
