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

  export interface CheckManyExistDTO {
    /**
     * 중복체크할 직원의 고유 아이디 리스트
     * @type string[]
     * @title 직원의 고유 아이디 리스트
     */
    id_cards: string[] & tags.MinItems<1>;
  }

  export interface GetEmployeeListQuery {
    /**
     * @type number
     * @title 페이지 번호
     * @default 1
     */
    page?: number & tags.Minimum<1>;
    /**
     * @type number
     * @title 페이지당 아이템 갯수
     * @default 10
     */
    limit?: number & tags.Minimum<1>;
    /**
     * role filter
     * @type string
     * @title 직원 role
     */
    role?: ems_EmployeeRole[];
    /**
     * @type string
     * @title 검색 타입
     */
    search_type?: 'id_card' | 'employee_name';
    /**
     * @type string
     * @title 검색어
     */
    search?: string;
  }
}
