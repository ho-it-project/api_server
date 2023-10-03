import { PrismaService } from '@common/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { ErDepartmentI } from '../interface/er/er.department.interface';
import typia from 'typia';
import { ER_DEPARTMENT_ERROR } from '@config/errors';
// import typia from 'typia';
// import { ER_DEPARTMENT_ERROR } from '@config/errors';
// import { AuthService } from '@src/auth/provider/auth.service';

@Injectable()
export class ErDepartmentService {
  private readonly logger = new Logger(ErDepartmentService.name);
  constructor(private readonly prismaService: PrismaService) {}

  // GET: full
  async getFullDepartmentList(): Promise<ErDepartmentI.GetFullDepartmentListReturn> {
    this.logger.debug('getFullDepartmentList');
    const result = await this.prismaService.er_Department.findMany({
      where: { parent_department_id: { equals: null } },
      include: {
        sub_departments: { select: { department_id: true, department_name: true } },
      },
    });
    return result.map(({ department_id, department_name, sub_departments }) => ({
      department_id,
      department_name,
      sub_departments,
    }));
  }

  // GET: status
  async getDepartmentStatusList({
    user,
  }: ErDepartmentI.GetDepartmentStatusListRequest): Promise<ErDepartmentI.GetDepartmentStatusListReturn> {
    this.logger.debug('getDepartmentStatusList');
    const { hospital_id } = user;
    const result = await this.prismaService.er_HospitalDepartment.findMany({
      where: { hospital_id, status: 'ACTIVE' },
      include: { department: true },
    });
    const formatted_result = result.map(({ department }) => ({
      department_id: department.department_id,
      department_name: department.department_name,
      parent_department_id: department.parent_department_id,
    }));
    return formatted_result;
  }

  // POST: status
  async addAvailableDepartment({
    user,
    department_id,
  }: ErDepartmentI.AddAvailableDepartmentRequest): Promise<ErDepartmentI.AddAvailableDepartmentResponse> {
    this.logger.debug('addAvailableDepartment');
    const { hospital_id } = user;

    const isDepartmentIDExist = await this.prismaService.er_Department.findFirst({ where: { department_id } });
    if (isDepartmentIDExist === null) return typia.random<ER_DEPARTMENT_ERROR.DEPARTMENT_NOT_EXIST>();

    const hospital_id_department_id = { hospital_id, department_id };
    //기존 상태에 상관없이(active였어도) active상태로 설정.
    const result = await this.prismaService.er_HospitalDepartment.upsert({
      where: { hospital_id_department_id },
      create: { hospital_id, department_id, status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
      include: { department: { select: { parent_department_id: true, department_name: true } } },
    });

    const formatted_result = {
      department_id: result.department_id,
      department_name: result.department.department_name,
      parent_department_id: result.department.parent_department_id,
    };

    return formatted_result;
  }

  // DELETE: status
  async removeAvailableDepartment({
    user,
    department_id,
  }: ErDepartmentI.RemoveAvailableDepartmentRequest): Promise<ErDepartmentI.RemoveAvailableDepartmentResponse> {
    this.logger.debug('RemoveAvailableDepartment');
    const { hospital_id } = user;

    const isDepartmentIDExist = await this.prismaService.er_Department.findFirst({ where: { department_id } });
    if (isDepartmentIDExist === null) return ER_DEPARTMENT_ERROR.departmentNotExist;

    const hospital_id_department_id = { hospital_id, department_id };
    //기존 상태에 관계없이(관계가 아예 없었거나, inactive였어도) inactive로 설정.
    await this.prismaService.er_HospitalDepartment.upsert({
      where: { hospital_id_department_id },
      create: { hospital_id, department_id, status: 'INACTIVE' },
      update: { status: 'INACTIVE' },
      include: { department: { select: { parent_department_id: true, department_name: true } } },
    });

    return 'NO_CONTENT';
  }
}
