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
    role: er_EmployeeRole;
  }

  export interface CreateManyDTO {
    /**
     * 직원들을 한번에 많이 생성할때 사용
     * @title CreateManyDTO
     * @type CreateDTO[]
     */
    employees: Array<CreateDTO> & tags.MinItems<1>;
  }

  export interface CheckManyExistDTO {
    /**
     * 중복체크할 직원의 고유 아이디 리스트
     * @type string[]
     * @title 직원의 고유 아이디 리스트
     */
    id_cards: string[] & tags.MinItems<1>;
  }

  export interface UpdatePasswordDTO {
    /**
     * 변경할 직원 비밀번호
     * @type string
     * @title 변경할 직원 비밀번호
     */
    password: string & tags.MinLength<8>;

    /**
     * 현재 직원의 비밀번호 - 비밀번호가 틀릴경우 에러
     * @type string
     * @title 현재 직원 비밀번호
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
     * 응급센터가 있는 도시
     * @type string
     * @title 응급센터가 있는 도시
     */
    city?: string;
  }
  export interface GetEmergencyCenterListByLocationQuery {
    /**
     * @type number
     * @description 위도 - 경도와 함께 사용
     * @min -90
     * @max 90
     * @title 위도
     */
    latitude: number & tags.Minimum<-90> & tags.Maximum<90>;

    /**
     * @type number
     * @description 경도 - 위도와 함께 사용
     * @min -180
     * @max 180
     * @title 경도
     */
    longitude: number & tags.Minimum<-180> & tags.Maximum<180>;
  }
  export interface GetEmergencyCenterListQueryDefault {
    /**
     * @default 1
     */
    page?: number & tags.Minimum<1>;

    /**
     * @type number
     * @description limit
     * @default 10
     */
    limit?: number & tags.Minimum<1>;

    /**
     * @type string
     * @description search - 병원이름
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
  /**
   * test
   *
   */
  export type GetEmergencyCenterListQuery = GetEmergencyCenterListQueryDefault &
    GetEmergencyCenterListByCityQuery &
    GetEmergencyCenterListByLocationQuery;
}