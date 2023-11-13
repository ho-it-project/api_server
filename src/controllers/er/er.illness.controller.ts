import { CurrentUser } from '@common/decorators/CurrentUser';
import { AdminGuard } from '@common/guard/admin.guard';
import { createResponse } from '@common/interceptor/createResponse';
import { isError, throwError } from '@config/errors';
import { TypedBody, TypedParam, TypedQuery, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import { ErAuth } from '@src/auth/interface';
import { ErIllnessService } from '@src/providers/er/er.illness.service';
import { ErIllnessRequest, ErIllnessResponse, Try } from '@src/types';

@Controller('/er')
export class ErIllnessController {
  constructor(private readonly illnessService: ErIllnessService) {}

  /**
   * 질환 조회
   *
   * @author anthony
   * @tag er_Illness
   * @summary 2023-11-01 질환 목록 조회
   *
   * @returns 질환 목록
   */
  @TypedRoute.Get('/illnesses')
  async getIllnesses(): Promise<Try<ErIllnessResponse.GetIllnesses>> {
    const result = await this.illnessService.getIllnesses();
    if (isError(result)) throwError(result);
    return createResponse(result);
  }

  /**
   * 현재 로그인되어있는 유저의 병원의 질환의 진료가능여부를 조회합니다.
   * query로 진료가능 질환, 진료 불가능 질환을 조회할 수 있습니다.
   * `/current/illnesses?status=ACTIVE`: 진료 가능한질환만 조회
   * `/current/illnesses?status=INACTIVE`: 진료 불가능한질환만 조회
   *
   * @author anthony
   * @tag er_Illness
   * @summary 2023-10-16 치료가능질환 조회
   *
   * @param user
   * @param query
   * @security access_token
   * @returns 치료가능질환
   */
  @TypedRoute.Get('/current/illnesses')
  @UseGuards(ErJwtAccessAuthGuard)
  async getCurrentServableIllnessesStatus(
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
    @TypedQuery() query: ErIllnessRequest.GetCurrentServableIllnessesStatusQuery,
  ): Promise<Try<ErIllnessResponse.GetServableIllnessesStatus>> {
    const { hospital_id } = user;
    const result = await this.illnessService.getServableIllnessStatusById({ hospital_id, query });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * 특정 병원의 질환의 진료가능여부를 조회합니다.
   * query로 진료가능 질환, 진료 불가능 질환을 조회할 수 있습니다.
   * `/:er_id/illnesses?status=ACTIVE`: 진료 가능한질환만 조회
   * `/:er_id/illnesses?status=INACTIVE`: 진료 불가능한질환만 조회
   *
   * @author anthony
   * @tag er_Illness
   * @summary 2023-11-01 특정 병원의 치료가능질환 조회
   *
   * @param er_id
   * @param query
   * @returns 요청한 병원의 진료가능질환 목록
   */
  @TypedRoute.Get('/:er_id/illnesses')
  async getSpecificServableIllnessStatus(
    @TypedParam('er_id') er_id: string,
    @TypedQuery() query: ErIllnessRequest.GetSepcificServableIllnessesStatusQuery,
  ) {
    const result = await this.illnessService.getServableIllnessStatusById({ hospital_id: er_id, query });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * 치료가능질환 업데이트
   * admin권한이 필요합니다.
   * patch document는 JSON Merge Patch방식을 사용합니다.
   * 업데이트된 치료가능질환 상태를 반환합니다.
   *
   * @author anthony
   * @tag er_Illness
   * @summary 2023-10-16 치료가능질환 업데이트
   *
   * @param user
   * @param document
   * @security access_token
   * @returns 업데이트된 치료가능질환 상태
   */
  @TypedRoute.Patch('/current/illnesses')
  @UseGuards(ErJwtAccessAuthGuard, AdminGuard)
  async patchServableIllnessStatus(
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
    @TypedBody() document: ErIllnessRequest.UpdateServableIllnessStatusDto,
  ): Promise<Try<ErIllnessResponse.UpdateServableIllnessStatus>> {
    const result = await this.illnessService.updateCurrentServableIllnessStatus({ user, document });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }
}
