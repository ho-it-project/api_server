import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { ER_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedParam, TypedQuery, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import { ErAuth } from '@src/auth/interface';
import { ErDepartmentService } from '@src/providers/er/er.department.service';
import { ErDepartmentRequest, ErDepartmentResponse, TryCatch } from '@src/types';

@Controller('/er')
export class ErDepartmentTemporaryController {
  constructor(private readonly erDepartmentService: ErDepartmentService) {}

  /**
   * 진료과 목록 조회 API
   * 진료과 목록을 조회한다.
   *
   * 의사의 전문분야와 함께 조회한다.
   * @author de-novo
   * @tag er_department
   * @summary 2023-10-30 - 진료과 목록 조회 API
   */
  @TypedRoute.Get('/departments')
  async getDepartmentList() {
    const result = await this.erDepartmentService.getDepartmentList();
    return createResponse(result);
  }

  /**
   * 진료과 조회 API
   * 진료과를 조회한다.
   *
   * include 쿼리를 이용하여,
   * 진료과가 활성화된 병원, 전문분야 등을 조회할수 있다.
   * @author de-novo
   * @tag er_department
   * @summary 2023-10-30 - 진료과 조회 API
   */
  @TypedRoute.Get('/departments/:department_id')
  async getDepartment() {
    const result = await this.erDepartmentService.getDepartmentList();
    return createResponse(result);
  }
  /**
   * 병원 진료과 목록 조회 API
   * 병원 진료과 목록을 조회한다.
   *
   * 응급실 ID를 이용하여, 병원의 진료과 목록을 조회한다.
   *
   * 첫조회시 해당 병원 진료과를 셋팅한다.
   * @author de-novo
   * @tag er_department
   * @summary 2023-10-30 - 진료과 목록 조회 API
   */
  @TypedRoute.Get('/:er_id/departments')
  @TypedException<ER_ERROR.ER_NOT_FOUND>(404, 'ER_NOT_FOUND')
  async getDepartmentListByErId(
    @TypedParam('er_id') er_id: string,
    @TypedQuery() query: ErDepartmentRequest.GetDepartmentListQuery,
  ): Promise<TryCatch<ErDepartmentResponse.GetDepartmentList, ER_ERROR.ER_NOT_FOUND>> {
    const result = await this.erDepartmentService.getErDepartmentListByErIdWithQuery({ er_id, query });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * 병원 진료과 업데이트 API
   *
   * 병원의 진료과를 업데이트한다. (상태변경)
   *
   *
   */
  @TypedRoute.Patch('/:er_id/departments')
  @UseGuards(ErJwtAccessAuthGuard)
  async updateDepartmentListByErId(
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
    @TypedParam('er_id') er_id: string,
    @TypedBody() body: ErDepartmentRequest.UpdateHospitalDepartmentDto,
  ) {
    const { update_departmet_list } = body;
    const result = await this.erDepartmentService.updateHospitalDepartment({
      user,
      er_id,
      update_departmet_list,
    });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }
}
