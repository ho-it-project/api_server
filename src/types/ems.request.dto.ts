import { ems_Employee, ems_EmployeeRole } from '@prisma/client';
import { tags } from 'typia';

export namespace EmsAuthRequest {
  export interface LoginDTO {
    /**
     * 구급업체 이름 - 추후 변경 가능성 있음
     * @type string
     * @title 구급업체 이름
     */
    ambulance_company_name: string;

    /**
     * 구급업체 직원 고유 아이디
     * @type string
     * @title 구급업체 직원 고유 아이디
     */
    id_card: string;

    /**
     * @title 비밀번호
     * @type string
     */
    password: string;
  }
}

export namespace EmsEmployeeRequest {
  export interface CreateDTO extends Partial<ems_Employee> {
    /**
     * 지원 이름
     * @type string
     * @title 지원 이름
     */
    employee_name: string;
    /**
     * 지원 고유 아이디, 각 병워별로 중복되지 않아야함
     * @type string
     * @title 직원 고유 아이디
     */
    id_card: string;
    /**
     * @type string
     * @title 비밀번호
     */
    password: string;

    /**
     * 직원의 ROLE - ADMIN, DOCTOR, NURSE, EMT
     * @title 직원의 역할
     * @type er_EmployeeRole
     */
    role: ems_EmployeeRole;
  }

  export interface CreateManyDTO {
    /**
     * 직원들을 한번에 많이 생성할때 사용
     * @title CreateManyDTO
     * @type CreateDTO[]
     */
    employees: CreateDTO[] & tags.MinItems<1>;
  }
}
