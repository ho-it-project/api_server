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

  export interface CreateManyDTO {
    /**
     * @type CreateDTO[]
     * @description 직원들
     */
    employees: Array<CreateDTO> & tags.MinItems<1>;
  }

  export interface CheckManyExistDTO {
    /**
     * @type string[]
     * @description 직원 고유아이디들
     */
    id_cards: string[] & tags.MinItems<1>;
  }

  export interface UpdatePasswordDTO {
    /**
     * @type string
     * @description 직원 비밀번호
     */
    password: string;

    /**
     * @type string
     * @description 현재 직원 비밀번호
     */
    now_password: string;
  }

  export interface GetEmployeeListQuery {
    /**
     * @type number
     * @description page
     * @default 1
     */
    page?: number;
    /**
     * @type number
     * @description  limit
     * @default 10
     */
    limit?: number;

    /**
     * @type string
     * @description  search
     * @default ''
     */
    search?: string;

    /**
     * @type string
     * @description  employee_role
     * @default ''
     */
    role?: er_EmployeeRole;

    /**
     * @type string
     * @description search_type
     */
    search_type?: 'id_card' | 'employee_name';
  }
}
