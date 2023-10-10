import { PrismaService } from '@common/prisma/prisma.service';
import { ER_DEPARTMENT_ERROR } from '@config/errors';
import { Injectable, Logger } from '@nestjs/common';
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

  /**
   * 부모 진료과에 대한 업데이트 명령을 자식으로 전파하기 위한 작업을 진행한다.
   * @param data
   * @returns 부모 진료과에 대한 업데이트 명령이 자식으로 전파된 결과를 포함한 업데이트 명령
   */
  expandParent(data: ErDepartment.UpdateAvailableDepartmentArg['data']) {
    const int_id = 1; //department id of internal medicine
    const ext_id = 13; //department id of external medicine
    const end_of_int_id = ext_id;
    const end_of_ext_id = 21 + 1;
    const childInfo = {
      [int_id]: Array.from({ length: end_of_int_id - (int_id + 1) }, (_, index) => index + (int_id + 1)),
      [ext_id]: Array.from({ length: end_of_ext_id - (ext_id + 1) }, (_, index) => index + (ext_id + 1)),
    };
    const data_obj: { [k: (typeof data)[number]['department_id']]: (typeof data)[number]['status'] } = {};
    data.forEach((v) => {
      data_obj[v.department_id] = v.status;
    });
    //부모 진료과가 존재하고, 자식의 진료과가 정의되지 않은 경우, 부모의 값을 따라간다. 내과, 외과 각각 진행한다.
    //1:'ACTIVE', 2:'INACTIVE' 인 경우, 1:'INACTIVE', 2:'INACTIVE', 3:'ACTIVE' ... 12:'ACTIVE가 된다.
    //부모가 ACTIVE, 자식이 INACTIVE인 경우에만 부모를 INACTIVE로 바꿔야할 필요가 있다. 그 외의 경우에는 변경할 필요가 없다.
    let flag: boolean = false;
    if (data_obj[int_id]) {
      childInfo[int_id].forEach((child_id) => {
        if (!data_obj[child_id]) data_obj[child_id] = data_obj[int_id];
        else if (data_obj[int_id] == 'ACTIVE' && data_obj[child_id] == 'INACTIVE') flag = true;
      });
      if (flag) data_obj[int_id] = 'INACTIVE';
    }
    flag = false;
    if (data_obj[ext_id]) {
      childInfo[ext_id].forEach((child_id) => {
        if (!data_obj[child_id]) data_obj[child_id] = data_obj[ext_id];
        else if (data_obj[int_id] == 'ACTIVE' && data_obj[child_id] == 'INACTIVE') flag = true;
      });
      if (flag) data_obj[ext_id] = 'INACTIVE';
    }
    const result: typeof data = [];
    for (const key in data_obj) {
      result.push({ department_id: Number.parseInt(key), status: data_obj[key] });
    }
    return result;
  }

  async updateAvailableDepartments({
    user,
    data,
  }: ErDepartment.UpdateAvailableDepartmentArg): Promise<ErDepartment.UpdateAvailableDepartmentReturn> {
    this.logger.debug('addAvailableDepartment');
    const updated_list: ErDepartment.UpdateAvailableDepartmentReturn = [];

    const expandedData = this.expandParent(data);

    const { hospital_id } = user;
    //에러 발생시, transaction을 벗어나기 위해 error를 throw함. error 메시지에, 에러가 발생한 리소스 값을 포함하여,
    //service가 정보와함께 에러를 return할 수 있도록 함.
    //ref: https://woolen-stetson-9c6.notion.site/prisma-transaction-3b2fff0999b9402590f14ae1977c2268?pvs=4
    try {
      await this.prismaService.$transaction(async (db) => {
        for (const { department_id, status } of expandedData) {
          //department id가 잘못되었을 경우
          const isDepartmentIDExist = await db.er_Department.findFirst({ where: { department_id } });
          if (isDepartmentIDExist === null) throw new Error(`${department_id}`);

          const hospital_id_department_id = { hospital_id, department_id };
          const result = await db.er_HospitalDepartment.upsert({
            where: { hospital_id_department_id },
            create: { hospital_id, department_id, status },
            update: { status },
            include: { department: { select: { department_name: true } } },
          });
          updated_list.push({
            department_id: result.department_id,
            department_name: result.department.department_name,
            status: result.status,
          });
        }
      });
    } catch (e) {
      if (e instanceof Error) {
        const err = ER_DEPARTMENT_ERROR.departmentNotExist;
        err['message'] += e.message;
        return err;
      }
    }

    return updated_list;
  }
}
