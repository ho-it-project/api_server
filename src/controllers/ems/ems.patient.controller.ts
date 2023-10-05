import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { EMS_PATIENT_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { EmsJwtAccessAuthGuard } from '@src/auth/guard/ems.jwt.access.guard';
import { EmsAuth } from '@src/auth/interface';
import { TryCatch } from '@src/types';
import { EmsPatientResponse } from '@src/types/ems.response.dto';
import { EmsPatientService } from './../../providers/ems/ems.patient.service';
import { EmsPatientRequest } from './../../types/ems.request.dto';
@Controller('/ems/patient')
export class EmsPatientController {
  constructor(private readonly emsPatientService: EmsPatientService) {}

  /**
   * 환자 생성 API
   *
   * 환자를 생성합니다.
   * 만약 대기중인 환자가 있다면 생성할 수 없습니다.
   * PENDING 상태인 환자에대한 처리를 완료하거나, CANCLED 상태로 변경해야 합니다.
   *
   * ## body
   * - patient_name : 환자 이름 (익명으로 입력 가능)
   * - patient_birth : 환자 생년월일 (모를시 00000000) 8자리
   *    - YYYYMMDD
   * - patient_identity_number : 환자 주민등록번호 뒷자리 (암호화) 7자리
   *    - 암호화는 서버에서 진행합니다.
   *    - 알수없는경우 0000000
   * - patient_gender : 환자 성별 (FEMALE, MALE)
   * - patient_address : 환자 주소
   *    - 알수없는경우 '알수없음'
   * - patient_phone : 환자 전화번호
   *    - 알수없는경우 '00000000000'
   * - patient_latitude : 환자 위도
   * - patient_longitude : 환자 경도
   * - patient_severity : 환자 중증도
   *    - SEVERE /// 중증
   *    - MILD /// 경증
   *    - NONE /// 없음, 정상
   *    - UNKNOW /// 미상, 판단 불가한 경우
   * - patient_emergency_cause : 환자 응급사유
   *    - TRAFFIC_ACCIDENT /// 교통사고
   *    - FIRE /// 화재
   *    - CRIMINAL /// 범죄
   *    - DISASTER /// 재난
   *    - DISEASE /// 질병
   *    - OTHER /// 기타
   * - patient_guardian : 보호자 정보
   *    - guardian_name : 보호자 이름
   *    - guardian_phone : 보호자 전화번호
   *    - guardian_address : 보호자 주소
   *    - guardian_relation : 보호자와의 관계
   *      - FATHER /// 아버지
   *      - PARENT /// 부모
   *      - SPOUSE /// 배우자
   *      - CHILD /// 자녀
   *      - SIBLING ///  형제자매
   *      - FRIEND /// 친구
   *      - OTHER /// 기타
   *
   * @author de-novo
   * @tags ems_patient
   * @summary 2023-10-05 - 환자 생성 API
   *
   * @security access_token
   * @param createPatientDTO
   * @returns {EmsPatientResponse.CreatePatient} 생성된 환자 id
   */
  @TypedRoute.Post('/')
  @TypedException<EMS_PATIENT_ERROR.INCHARGED_PATIENT_ALREADY_EXIST>(
    400,
    'EMS_PATIENT_ERROR.INCHARGED_PATIENT_ALREADY_EXIST',
  )
  @UseGuards(EmsJwtAccessAuthGuard)
  async createPatient(
    @TypedBody() createPatientDTO: EmsPatientRequest.CreatePatientDTO,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
  ): Promise<TryCatch<EmsPatientResponse.CreatePatient, EMS_PATIENT_ERROR.INCHARGED_PATIENT_ALREADY_EXIST>> {
    const result = await this.emsPatientService.createPatient({ patientInfo: createPatientDTO, user });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }
}
