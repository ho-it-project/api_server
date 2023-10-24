import { PrismaService } from '@common/prisma/prisma.service';
import { ER_DEPARTMENT_ERROR } from '@config/errors';
import { Injectable, Logger } from '@nestjs/common';
import typia from 'typia';
import { ErDepartment } from '../interface/er/er.department.interface';

@Injectable()
export class ErDepartmentService {
  private readonly logger = new Logger(ErDepartmentService.name);
  constructor(private readonly prismaService: PrismaService) {}

  async getDepartmentStatusList({
    user,
  }: ErDepartment.GetDepartmentStatusListArg): Promise<ErDepartment.GetDepartmentStatusListReturn> {
    this.logger.debug('getDepartmentStatusList');
    const { hospital_id } = user;

    const result = await this.prismaService.er_Department.findMany({
      where: { parent_department_id: { equals: null } },
      include: {
        hospital_departments: {
          where: { hospital: { hospital_id } },
        },
        sub_departments: {
          include: {
            hospital_departments: {
              where: { hospital: { hospital_id } },
            },
          },
        },
      },
    });

    const formatted_result = result.map((v) => ({
      department_id: v.department_id,
      department_name: v.department_name,
      ...(v.sub_departments.length
        ? {
            sub_departments: v.sub_departments.map((s) => ({
              department_id: s.department_id,
              department_name: s.department_name,
              status: s.hospital_departments.length ? s.hospital_departments[0].status : 'INACTIVE',
            })),
          }
        : {}),
      status: v.hospital_departments.length ? v.hospital_departments[0].status : 'INACTIVE',
    }));

    return formatted_result;
  }

  async validatePatchDocument(
    patchDocument: ErDepartment.UpdateAvailableDepartmentArg['patchDocument'],
  ): Promise<ErDepartment.ValidatePatchDocumentReturn> {
    const ids = patchDocument.map((v) => v.department_id);
    const validate = await this.prismaService.er_Department.findMany({
      where: {
        department_id: { in: ids },
        OR: [{ sub_departments: { every: { department_id: { in: ids } } } }, { sub_departments: { none: {} } }],
      },
      include: { sub_departments: { select: { department_id: true } } },
    });

    const ids_in_db = validate.map((v) => v.department_id);
    const result = ids.filter((v) => !ids_in_db.includes(v));
    if (result.length == 0) return true;
    return result;
  }

  async updateAvailableDepartments({
    user,
    patchDocument,
  }: ErDepartment.UpdateAvailableDepartmentArg): Promise<ErDepartment.UpdateAvailableDepartmentReturn> {
    this.logger.debug('addAvailableDepartment');

    const validation = await this.validatePatchDocument(patchDocument);
    if (validation !== true) {
      const error = typia.random<ER_DEPARTMENT_ERROR.INVALID_PATCH_DATA>();
      error.message += validation;
      return error;
    }

    const { hospital_id } = user;

    const patchedData = await this.prismaService.$transaction(
      patchDocument.map((v) =>
        this.prismaService.er_HospitalDepartment.upsert({
          where: { hospital_id_department_id: { hospital_id, department_id: v.department_id } },
          create: { hospital_id, department_id: v.department_id, status: v.status },
          update: { status: v.status },
          include: { department: { select: { department_name: true } } },
        }),
      ),
    );

    const result = patchedData.map((v) => ({
      department_id: v.department_id,
      department_name: v.department.department_name,
      status: v.status,
    }));

    return result;
  }
}
