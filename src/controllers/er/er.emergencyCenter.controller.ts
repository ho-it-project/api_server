import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { ER_EMERGENCY_CENTER_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedParam, TypedQuery, TypedRoute } from '@nestia/core';
import { Controller, HttpStatus, UseGuards } from '@nestjs/common';
import { CommonAuthGuard } from '@src/auth/guard/common.guard';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import { Auth, ErAuth } from '@src/auth/interface';
import { ErEmergencyCenterService } from '@src/providers/er/er.emergencyCenter.service';
import { ErEmergencyCenterRequest, ErEmergencyCenterResponse, Try, TryCatch } from '@src/types';

@Controller('/er/emergency-centers')
export class ErEmergencyCenterController {
  constructor(private readonly erEmergencyCenterService: ErEmergencyCenterService) {}

  /**
   * 응급의료기관 리스트 조회 API
   * 응급의료기관 리스트가 필요한 경우에 사용한다.
   *
   * 필수값 : [latitude, longitude]
   *
   * ## query
   * - page : 조회할 페이지
   *    - default : 1
   * - limit : 한 페이지에 보여줄 응급의료기관 수
   *    - default : 10
   * - search : 응급의료기관 이름으로 검색
   *    - default : '' - 전체
   * - emergency_center_type : 응급의료기관 타입 필터 - 복수 선택 가능
   *    - default : [] - 전체
   * - city : 도시로 검색
   *    - default : '' - 전체
   * - latitude : 위도
   * - longitude : 경도
   *
   * @author de-novo
   * @tag er_emergency_center
   * @summary 2023-09-30 - 응급의료기관 리스트 조회 API
   * @param query
   * @returns 응급의료기관 리스트 조회
   */
  @TypedRoute.Get('')
  async getEmergencyCenterList(
    @TypedQuery()
    query: ErEmergencyCenterRequest.GetEmergencyCenterListQuery,
  ): Promise<Try<ErEmergencyCenterResponse.GetEmergencyCenterList>> {
    const result = await this.erEmergencyCenterService.getEmergencyCenterListByQuery(query);
    return createResponse(result);
  }

  /**
   * 응급실 정보(병상) 조회 API
   *
   * 응급실 정보(병상)를 조회한다.
   * 필수값 : [emergency_room_id]
   * 응급실의 병상과 환자정보를 응답한다.
   * 만약, 병상에 환자정보가 없다면 null을 응답한다.
   *
   * @author de-novo
   * @tag er_emergency_center
   * @summary 2023-11-15 - 응급실 정보(병상) 조회 API
   * @param query
   * @returns 응급실 정보
   */
  @TypedRoute.Get('/emergency-room/:emergency_room_id')
  @UseGuards(CommonAuthGuard)
  @TypedException<ER_EMERGENCY_CENTER_ERROR.EMERGENCY_ROOM_NOT_FOUND>(
    HttpStatus.NOT_FOUND,
    'ER_EMERGENCY_CENTER_ERROR.EMERGENCY_ROOM_NOT_FOUND',
  )
  async getEmergencyRoom(
    @TypedParam('emergency_room_id') emergency_room_id: string,
    @CurrentUser() user?: Auth.CommonPayload,
  ): Promise<TryCatch<ErEmergencyCenterResponse.GetEmergencyRoom, ER_EMERGENCY_CENTER_ERROR.EMERGENCY_ROOM_NOT_FOUND>> {
    //user를 받는경우는 익명처리를 하냐 마냐 결정
    const result = await this.erEmergencyCenterService.getEmergencyRoomById(emergency_room_id, user);
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * 응급의료기관 상세 조회 API
   *
   * emergency_center_id를 이용하여 응급의료기관 상세 정보를 조회한다.
   * 필수값 : [emergency_center_id]
   *
   * 병상정보, 치료가능 질환등 응급실 정보를 조회한다.
   *
   *
   * @author de-novo
   * @tag er_emergency_center
   * @summary 2023-11-12 - 응급의료기관 상세 조회 API
   * @param query
   * @returns 응급의료기관 조회
   */
  @TypedRoute.Get('/:emergency_center_id')
  @TypedException<ER_EMERGENCY_CENTER_ERROR.EMERGENCY_CENTER_NOT_FOUND>(
    HttpStatus.NOT_FOUND,
    'ER_EMERGENCY_CENTER_ERROR.EMERGENCY_CENTER_NOT_FOUND',
  )
  async getEmergencyCenter(
    @TypedParam('emergency_center_id') emergency_center_id: string,
  ): Promise<
    TryCatch<ErEmergencyCenterResponse.GetEmergencyCenterDetail, ER_EMERGENCY_CENTER_ERROR.EMERGENCY_CENTER_NOT_FOUND>
  > {
    const result = await this.erEmergencyCenterService.getEmergencyCenterById(emergency_center_id);
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * 환자 병상 배정 API
   *
   * 환자를 병상에 배정한다.
   *
   * 필수값 : [patient_id, emergency_room_id, emergency_room_bed_num]
   * - patient_id : 환자 id (body)
   * - emergency_room_id : 응급실 id (param)
   * - emergency_room_bed_num : 응급실 병상 번호 (param)
   *
   * @author de-novo
   * @tag er_emergency_center
   * @summary 2023-11-15 - 환자 병상 배정 API
   *
   * @security access_token
   * @returns 성공여부
   */
  @TypedRoute.Post('/emergency-room/:emergency_room_id/beds/:emergency_room_bed_num')
  @UseGuards(ErJwtAccessAuthGuard)
  @TypedException<ER_EMERGENCY_CENTER_ERROR.EMERGENCY_ROOM_NOT_FOUND>(
    HttpStatus.NOT_FOUND,
    'ER_EMERGENCY_CENTER_ERROR.EMERGENCY_ROOM_NOT_FOUND',
  )
  @TypedException<ER_EMERGENCY_CENTER_ERROR.EMERGENCY_BED_NOT_FOUND>(
    HttpStatus.NOT_FOUND,
    'ER_EMERGENCY_CENTER_ERROR.EMERGENCY_BED_NOT_FOUND',
  )
  @TypedException<ER_EMERGENCY_CENTER_ERROR.EMERGENCY_ROOM_BED_NOT_AVAILABLE>(
    HttpStatus.BAD_REQUEST,
    'ER_EMERGENCY_CENTER_ERROR.EMERGENCY_ROOM_BED_NOT_AVAILABLE',
  )
  @TypedException<ER_EMERGENCY_CENTER_ERROR.PATIENT_NOT_EXIST>(
    HttpStatus.BAD_REQUEST,
    'ER_EMERGENCY_CENTER_ERROR.PATIENT_NOT_EXIST',
  )
  @TypedException<ER_EMERGENCY_CENTER_ERROR.PATIENT_ALREADY_ASSIGNED>(
    HttpStatus.BAD_REQUEST,
    'ER_EMERGENCY_CENTER_ERROR.PATIENT_ALREADY_ASSIGNED',
  )
  async assignPatientToBed(
    @TypedBody() body: ErEmergencyCenterRequest.AssignPatientToBedDto,
    @TypedParam('emergency_room_id') emergency_room_id: string,
    @TypedParam('emergency_room_bed_num') emergency_room_bed_num: number,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<
    TryCatch<
      'SUCCESS',
      | ER_EMERGENCY_CENTER_ERROR.EMERGENCY_ROOM_NOT_FOUND
      | ER_EMERGENCY_CENTER_ERROR.EMERGENCY_BED_NOT_FOUND
      | ER_EMERGENCY_CENTER_ERROR.EMERGENCY_ROOM_BED_NOT_AVAILABLE
      | ER_EMERGENCY_CENTER_ERROR.PATIENT_NOT_EXIST
      | ER_EMERGENCY_CENTER_ERROR.PATIENT_ALREADY_ASSIGNED
    >
  > {
    const { patient_id } = body;
    const result = await this.erEmergencyCenterService.assignPatientToBed({
      patient_id,
      emergency_room_bed_num,
      emergency_room_id,
      user,
    });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * 환자 병상 이동 API
   *
   * body : [target_emergency_room_id, target_emergency_room_bed_num]
   * - target_emergency_room_id : 이동할 응급실 id
   * - target_emergency_room_bed_num : 이동할 응급실 병상 번호
   *
   * param : [emergency_room_id, emergency_room_bed_num]
   * - emergency_room_id : 응급실 id (param)
   * - emergency_room_bed_num : 응급실 병상 번호 (param)
   *
   * 필수값 : [target_emergency_room_id, target_emergency_room_bed_num, emergency_room_id, emergency_room_bed_num]
   *
   *
   * @author de-novo
   * @tag er_emergency_center
   * @summary 2023-11-15 - 환자 병상 이동 API
   *
   * @security access_token
   * @returns 성공여부
   */
  @TypedRoute.Patch('/emergency-room/:emergency_room_id/beds/:emergency_room_bed_num')
  @UseGuards(ErJwtAccessAuthGuard)
  @TypedException<ER_EMERGENCY_CENTER_ERROR.EMERGENCY_ROOM_NOT_FOUND>(
    HttpStatus.NOT_FOUND,
    'ER_EMERGENCY_CENTER_ERROR.EMERGENCY_ROOM_NOT_FOUND',
  )
  @TypedException<ER_EMERGENCY_CENTER_ERROR.EMERGENCY_BED_NOT_FOUND>(
    HttpStatus.NOT_FOUND,
    'ER_EMERGENCY_CENTER_ERROR.EMERGENCY_BED_NOT_FOUND',
  )
  @TypedException<ER_EMERGENCY_CENTER_ERROR.EMERGENCY_ROOM_BED_NOT_AVAILABLE>(
    HttpStatus.BAD_REQUEST,
    'ER_EMERGENCY_CENTER_ERROR.EMERGENCY_ROOM_BED_NOT_AVAILABLE',
  )
  @TypedException<ER_EMERGENCY_CENTER_ERROR.PATIENT_NOT_EXIST>(
    HttpStatus.BAD_REQUEST,
    'ER_EMERGENCY_CENTER_ERROR.PATIENT_NOT_EXIST',
  )
  async changePatientToBed(
    @TypedBody() body: ErEmergencyCenterRequest.ChangePatientToBedDto,
    @TypedParam('emergency_room_id') emergency_room_id: string,
    @TypedParam('emergency_room_bed_num') emergency_room_bed_num: number,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<
    TryCatch<
      'SUCCESS',
      | ER_EMERGENCY_CENTER_ERROR.EMERGENCY_ROOM_NOT_FOUND
      | ER_EMERGENCY_CENTER_ERROR.EMERGENCY_BED_NOT_FOUND
      | ER_EMERGENCY_CENTER_ERROR.EMERGENCY_ROOM_BED_NOT_AVAILABLE
      | ER_EMERGENCY_CENTER_ERROR.PATIENT_NOT_EXIST
    >
  > {
    const { target_emergency_room_id, target_emergency_room_bed_num } = body;
    const result = await this.erEmergencyCenterService.changePatientToBed({
      target_emergency_room_id,
      target_emergency_room_bed_num,
      emergency_room_bed_num,
      emergency_room_id,
      user,
    });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }
}
