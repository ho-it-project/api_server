import { er_EmergencyRoomType, er_Employee, er_EmployeeRole, er_MedicalInstitutionType } from '@prisma/client';
import { tags } from 'typia';

export namespace ErAuthRequest {
  export interface LoginDTO {
    /**
     * 응급센터 id - 주의 : 병원 아이디가 아닌 응급센터 고유 아이디
     * @type string
     * @title 응급센터 id
     */
    emergency_center_id: string;

    /**
     * 직원 고유 아이디
     * @type string
     * @title 직원 고유 아이디
     */
    id_card: string;

    /**
     * @title 비밀번호
     * @type string
     */
    password: string;
  }
}

export namespace ErEmployeeRequest {
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

export namespace ErEmergencyCenterRequest {
  export interface GetEmergencyCenterListByCityQuery {
    /**
     * @type string
     * @description 도시
     */
    city?: string;
  }
  export interface GetEmergencyCenterListByLocationQuery {
    /**
     * @type number
     * @description 위도 - 경도와 함께 사용
     * @min -90
     * @max 90
     */
    latitude: number & tags.Minimum<-90> & tags.Maximum<90>;

    /**
     * @type number
     * @description 경도 - 위도와 함께 사용
     * @min -180
     * @max 180
     */
    longitude: number & tags.Minimum<-180> & tags.Maximum<180>;
  }
  export interface GetEmergencyCenterListQueryDefault {
    /**
     * @type number
     * @description page
     * @default 1
     * @minimum 1
     */
    page?: number;

    /**
     * @type number
     * @description limit
     * @default 10
     */
    limit?: number;

    /**
     * @type string
     * @description search - 병원이름
     * @default ''
     * @example '서울'
     */
    search?: string;

    /**
     * @type stirng
     * @description emergency_center_type_filter
     */
    emergency_center_type?: er_MedicalInstitutionType[];

    /**
     * @type string[]
     */
    emergency_room_available?: er_EmergencyRoomType[];
  }
  export type GetEmergencyCenterListQuery = GetEmergencyCenterListQueryDefault &
    GetEmergencyCenterListByCityQuery &
    GetEmergencyCenterListByLocationQuery;
}
