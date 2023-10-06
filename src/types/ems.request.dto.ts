import {
  Gender,
  ems_AffectedArea,
  ems_AirwayStatus,
  ems_AmbulanceType,
  ems_BreathingQuality,
  ems_DisabilityAVPU,
  ems_Employee,
  ems_EmployeeRole,
  ems_GuardianRelation,
  ems_IncidentCause,
  ems_PatientStatus,
  ems_Severity,
} from '@prisma/client';
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

  export interface UpdatePasswordDTO {
    /**
     * @type string
     * @title 현재 비밀번호
     */
    now_password: string;
    /**
     * @type string
     * @title 변경할 비밀번호
     */
    password: string;
  }
}

export namespace EmsAmbulanceCompanyRequest {
  export interface GetAmbulanceCompanyListQuery {
    /**
     * @type number
     * @title 페이지 번호
     * @default 1
     * @minimum 1
     */
    page?: number;

    /**
     * @type number
     * @title 페이지당 아이템 갯수
     * @default 10
     * @minimum 1
     */
    limit?: number;

    /**
     * @type string
     * @title 검색어
     */
    search?: string;

    /**
     * 예: 서울, 부산, 충남....
     *
     * @type string[]
     * @title 도시
     */
    city?: string[];

    /**
     * 예: 강남, 가평, 아산 .....
     *
     * @type string[]
     * @title 지역
     */
    area?: string[];

    /**
     * 보유중인 구급차량 타입
     * @type ems_AmbulanceType[]
     * @title 구급차량 타입
     */
    ambulance_type?: ems_AmbulanceType[];
  }
}

export namespace EmsPatientRequest {
  export interface CreatePatientDTO {
    /**
     * 환자이름을 입렵하세요
     * 이름을 모를시 '익명'으로 입력
     * @type string
     * @title 환자 이름
     */
    patient_name: string;

    /**
     * 환자의 생년월일을 입력하세요
     *
     * 혼수상태등의 이유로 알수없는 경우
     * 00000000 으로 입력
     * @type string
     * @title 환자 생년월일
     * @pattern [0-9]{8}
     * @example 19990101
     * @description 생년월일 8자리
     */
    patient_birth: string & tags.Pattern<'[0-9]{8}'>; // 생년월일

    /**
     * 환자의 주민등록번호 뒷자리 7자리를 입력하세요
     *
     * 혼수상태등의 이유로 알수없는 경우
     * 00000000 으로 입력
     * @type string
     * @title 환자 주민등록번호 뒷자리
     * @pattern [0-9]{7}
     * @example 1234567
     * @description 주민등록번호 뒤 7자리
     */
    patient_identity_number: string & tags.Pattern<'[0-9]{7}'>; // 주민등록번호 뒤 7자리

    /**
     * 환자의 성별을 입력하세요
     *
     * @type string
     * @title 환자 성별
     * @enum FEMALE, MALE
     * @example 남자
     * @description 남자, 여자
     */
    patient_gender: Gender;

    /**
     * 환자의 연락처를 입력하세요
     *
     * 혼수상태등의 이유로 알수없는 경우
     * 00000000000 으로 입력
     *
     * @type string
     * @title 환자 연락처
     * @pattern [0-9]{11}
     * @example 01012345678
     */
    patient_phone: string & tags.Pattern<'[0-9]{11}'>; // 핸드폰 번호

    /**
     * 환자의 주소를 입력하세요
     *
     * 혼수상태등의 이유로 알수없는 경우
     * '알수없음' 으로 입력
     *
     * @type string
     * @title 환자 주소
     */
    patient_address: string;

    /**
     * 환자의 위도를 입력하세요
     *
     * @type number
     * @title 환자 위도
     * @minimum -90
     * @maximum 90
     */
    patient_latitude: number & tags.Minimum<-90> & tags.Maximum<90>;

    /**
     * 환자의 경도를 입력하세요
     * @type number
     * @title 환자 경도
     * @minimum -180
     * @maximum 180
     */
    patient_longitude: number & tags.Minimum<-180> & tags.Maximum<180>;

    /**
     * 환자의 상태를 입력하세요
     * @type ems_Severity
     * @title 환자 상태
     */
    patient_severity: ems_Severity;

    /**
     * 환자의 응급사유를 입력하세요
     * @type ems_IncidentCause
     * @title 환자 응급사유
     */
    patient_emergency_cause: ems_IncidentCause;

    /**
     * 환자의 보호자 정보를 입력하세요
     * @type PatientGuardianDTO
     * @title 환자 보호자 정보
     * @description 보호자 정보
     */
    patient_guardian?: PatientGuardianDTO;
  }

  export interface PatientGuardianDTO {
    /**
     * 보호자 이름을 입력하세요
     * @type string
     * @title 보호자 이름
     * @description 보호자 이름
     */
    guardian_name: string;
    /**
     * 보호자 연락처를 입력하세요
     * @type string
     * @title 보호자 연락처
     * @description 보호자 연락처
     */
    guardian_phone: string;
    /**
     * 보호자 주소를 입력하세요
     * @type string
     * @title 보호자 주소
     * @description 보호자 주소
     */
    guardian_address: string;
    /**
     * 보호자 관계를 입력하세요
     * @type ems_GuardianRelation
     * @title 보호자 관계
     * @description 보호자 관계
     */
    guardian_relation: ems_GuardianRelation;
  }

  export interface GetPatientListQuery {
    page?: number & tags.Minimum<1>;
    limit?: number & tags.Minimum<1>;
    search?: string;
    search_type?: 'patient_name' | 'patient_birth' | 'patient_phone';
    patient_status?: ems_PatientStatus[]; // 환자 진행상태 필터
    patient_severity?: ems_Severity[]; // 환자 중증도 필터
    patient_emergency_cause?: ems_IncidentCause[]; // 환자 응급사유 필터
    gender?: Gender; // 환자 성별 필터
  }

  export interface CreateABCDEAssessmentDTO {
    airway_status: ems_AirwayStatus;
    /**
     * 호흡수 //단위 횟수/분
     * @type number
     * @title 분당 호흡수
     * @minimum 0
     */
    breathing_rate: number & tags.Type<'int32'> & tags.Minimum<0>;
    /**
     * 호흡 품질 //정상, 불규칙, 얕음, 느림, 빠름, 기타호흡에 대한 상세 내용
     * @type ems_BreathingQuality
     * @title 호흡 품질
     * @enum NORMAL, IRREGULAR, SHALLOW, SLOW, FAST, OTHER
     */
    breathing_quality: ems_BreathingQuality;

    /**
     * 심장박동수 //단위 횟수/분
     * @type number
     * @title 분당 심장박동수
     * @minimum 0
     */
    circulation_pulse: number & tags.Type<'int32'> & tags.Minimum<0>;
    /**
     * 수축기 혈압 //단위 mmHg
     * @type number
     * @title 수축기 혈압
     * @minimum 0
     * @maximum 300
     */
    circulation_systolic_blood_pressure: number & tags.Type<'int32'> & tags.Minimum<0>;
    /**
     * 이완기 혈압 //단위 mmHg
     * @type number
     * @title 이완기 혈압
     * @minimum 0
     * @maximum 300
     */
    circulation_diastolic_blood_pressure: number & tags.Type<'int32'> & tags.Minimum<0>;
    /**
     * 의식 상태
     * @type ems_DisabilityAVPU
     * @title 의식 상태
     * @enum ALERT, VERBAL, PAIN, UNRESPONSIVE
     * @description 의식 상태
     */
    disability_avpu: ems_DisabilityAVPU;
    /**
     * 노출 상태 : 외상, 화상, 발진, 저체온, 기타노출에 대한 상세 내용
     * @type string
     * @title 노출 상태
     * @description 노출 상태
     */
    exposure_notes: string;
  }

  export interface CreateDCAP_BTLSAssessmentDTO {
    /**
     * 부위
     * @type ems_AffectedArea
     * @title 부위
     */
    affected_area: ems_AffectedArea;
    /**
     * 변형
     * @type string
     * @title 변형
     */
    deformity: string;
    /**
     * 멍
     * @type string
     * @title 멍
     */
    contusion: string;
    /**
     * 찰과상
     * @type string
     * @title 찰과상
     */
    abrasion: string;
    /**
     * 찔림상
     * @type string
     * @title 찔림상
     */
    puncture: string;
    /**
     * 화상
     * @type string
     * @title 화상
     */
    burn: string;
    /**
     * 통증
     * @type string
     * @title 통증
     */
    tenderness: string;
    /**
     * 찢김상
     * @type string
     * @title 찢김상
     */
    laceration: string;
    /**
     * 부어오름
     * @type string
     * @title 부어오름
     */
    swelling: string;
  }

  export interface CreateOPQRSTAssessmentDTO {
    /**
     * 증상이 시작되었을 때 와 무엇을 하고있었는지
     * @type string
     * @title 발병상황 - 증상이 시작되었을 때 와 무엇을 하고있었고, 통증은 언제부터 시작됬는지
     */
    onset: string;

    /**
     * 유발요인
     * @type string
     * @title 유발요인
     */
    provocation: string;

    /**
     * 통증의 특징
     * @type string
     * @title 통증의 특징
     */
    quality: string;

    /**
     * 통증의 위치
     * @type string
     * @title 통증의 위치
     */
    radiation: string;

    /**
     * 통증의 강도
     * 심각도 1~10
     * @type string
     * @title 통증의 강도
     * @minimum 1
     * @maximum 10
     */
    severity: number & tags.Type<'int32'> & tags.Minimum<1> & tags.Maximum<10>;

    /**
     * 통증 발현시간 //유닉스 타임스탬프 "1970-01-01T00:00:00Z" = 미상
     * @type string
     * @title 통증 발현시간
     */
    time: Date;
  }

  export interface CreateSAMPLEAssessmentDTO {
    /**
     *증상 및 증후
     * @type string
     * @title 증상 및 증후
     */
    sings_symptoms: string;

    /**
     * 알레르기
     * @type string
     * @title 알레르기
     */
    allergies: string;

    /**
     * 복용중인 약물
     * @type string
     * @title 복용중인 약물
     */
    medications: string;

    /**
     * 과거 병력
     * @type string
     * @title 과거 병력
     */
    past_medical_history: string;

    /**
     * 마지막 경구 섭취
     * @type string
     * @title 마지막 경구 섭취
     */
    last_oral_intake: Date;

    /**
     * 발병 전 사건 - 무엇을 하고있었는지.
     * @type string
     * @title 발병 전 사건
     */
    events_leading_to_illness: string;
  }

  export interface CreateVSAssessmentDTO {
    // heart_rate               Int /// 심박수 맥박 //단위 횟수/분
    // respiratory_rate         Int /// 호흡수  //단위 횟수/분
    // systolic_blood_pressure  Int /// 수축기 혈압 //단위 mmHg
    // diastolic_blood_pressure Int /// 이완기 혈압 //단위 mmHg
    // temperature              Float /// 체온 //단위 ℃

    /**
     * 심박수 맥박 //단위 횟수/분
     * @type number
     * @title 심박수 맥박
     * @minimum 0
     */
    heart_rate: number & tags.Type<'int32'> & tags.Minimum<0>;
    /**
     * 호흡수  //단위 횟수/분
     * @type number
     * @title 호흡수
     * @minimum 0
     */
    respiratory_rate: number & tags.Type<'int32'> & tags.Minimum<0>;
    /**
     * 수축기 혈압 //단위 mmHg
     * @type number
     * @title 수축기 혈압
     * @minimum 0
     * @maximum 300
     */
    systolic_blood_pressure: number & tags.Type<'int32'> & tags.Minimum<0>;
    /**
     * 이완기 혈압 //단위 mmHg
     * @type number
     * @title 이완기 혈압
     * @minimum 0
     * @maximum 300
     */
    diastolic_blood_pressure: number & tags.Type<'int32'> & tags.Minimum<0>;
    /**
     * 체온 //단위 ℃
     * @type number
     * @title 체온
     * @minimum 0
     * @maximum 50
     */
    temperature: number & tags.Type<'float'> & tags.Minimum<0>;
  }
}
