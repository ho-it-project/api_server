import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { AUTH_ERROR, ER_DEPARTMENT_ERROR, ER_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedParam, TypedQuery, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import { ErAuth } from '@src/auth/interface';
import { ErDepartmentService } from '@src/providers/er/er.department.service';
import { ErDepartmentRequest, ErDepartmentResponse, TryCatch } from '@src/types';

@Controller('/er')
export class ErDepartmentController {
  constructor(private readonly erDepartmentService: ErDepartmentService) {}

  /**
   * 진료과 목록 조회 API
   * 진료과 목록을 조회한다.
   *
   * 의사의 전문분야와 함께 조회한다.
   * @author de-novo
   * @tag er_department
   * @summary 2023-10-30 - 진료과 목록 조회 API
   *
   * @returns 진료과 목록
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
   *
   * @returns 진료과
   */
  @TypedRoute.Get('/departments/:department_id')
  @TypedException<ER_DEPARTMENT_ERROR.DEPARTMENT_NOT_EXIST>(404, 'ER_DEPARTMENT_ERROR.DEPARTMENT_NOT_EXIST')
  async getDepartment(
    @TypedParam('department_id') department_id: number,
    @TypedQuery() query: ErDepartmentRequest.GetDepartmetQuery,
  ): Promise<TryCatch<ErDepartmentResponse.GetDepartment, ER_DEPARTMENT_ERROR.DEPARTMENT_NOT_EXIST>> {
    const result = await this.erDepartmentService.getDepartmentByIdWithQuery({
      department_id,
      query,
    });
    if (isError(result)) return throwError(result);

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
   *
   * @returns 병원 진료과 목록
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
   * 상위 진료과가 INACTIVE인 경우, 하위 진료과는 모두 INACTIVE로 변경된다.
   * 상위 진료과가 ACTIVE인 경우, 하위 진료과는 모두 ACTIVE로 변경된다.
   * 하위 진료과가 ACTIVE인 경우, 상위 진료과는 ACTIVE로 변경된다.
   *
   *
   * @author de-novo
   * @tag er_department
   * @summary 2023-10-31 - 병원 진료과 업데이트 API
   *
   * @security access_token
   * @returns 성공여부
   */
  @TypedRoute.Patch('/:er_id/departments')
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  @UseGuards(ErJwtAccessAuthGuard)
  async updateDepartmentListByErId(
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
    @TypedParam('er_id') er_id: string,
    @TypedBody() body: ErDepartmentRequest.UpdateHospitalDepartmentDto,
  ) {
    const { update_department_list } = body;
    const result = await this.erDepartmentService.updateHospitalDepartment({
      user,
      er_id,
      update_department_list,
    });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }
}
