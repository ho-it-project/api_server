import { er_Employee, er_EmployeeRole } from '@prisma/client';
import { tags } from 'typia';

export namespace AuthRequest {
  export interface LoginDTO {
    /**
     * @type string
     * @description 응급센터 아이디
     */
    emergency_center_id: string;

    /**
     * @type string
     * @description 직원 고유아이디
     */
    id_card: string;

    /**
     * @type string
     * @description 직원 비밀번호
     */
    password: string;
  }
}

export namespace EmployeeRequest {
  export interface CreateDTO extends Partial<er_Employee> {
    /**
     * @type string
     * @description 직원 이름
     */
    employee_name: string;
    /**
     * @type string
     * @description 직원 고유아이디
     */
    id_card: string;
    /**
     * @type string
     * @description 직원 비밀번호
     */
    password: string;

    /**
     * @type er_EmployeeRole
     * @description 직원 역할
     */
    role: er_EmployeeRole;
  }

  export interface createManyDTO {
    /**
     * @type CreateDTO[]
     * @description 직원들
     */
    employees: Array<CreateDTO> & tags.MinItems<1>;
  }
}
