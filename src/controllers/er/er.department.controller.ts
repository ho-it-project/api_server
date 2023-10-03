import { Try } from './../../types/index';
import { createResponse } from '@common/interceptor/createResponse';
import { ErDepartmentRequest, ErDepartmentResponse } from '@src/types';
import { CurrentUser } from '@common/decorators/CurrentUser';
import { TypedBody, TypedException, TypedParam, TypedRoute } from '@nestia/core';
import { Controller, HttpStatus, UseGuards } from '@nestjs/common';
import { ErDepartmentService } from '@src/providers/er/er.department.service';
import { ErAuth } from '@src/auth/interface';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import { isError, throwError, ER_DEPARTMENT_ERROR } from '@config/errors';

@Controller('/er/department')
export class ErDepartmentController {
  constructor(private readonly erDepartmentService: ErDepartmentService) {}

  /**
   * 전체 부서목록 호출
   * 현재 병원의 상태와 관계없이, 전체 부서 목록을 반환한다.
   *
   * @author anthony
   * @tag er_department
   * @summary 2023-10-01 - 전체 부서목록 호출 API
   *
   * @returns {ErDepartmentResponse.GetFullDepartmentListDto}
   */
  @TypedRoute.Get('/full')
  async getFullDepartmentList(): Promise<Try<ErDepartmentResponse.GetFullDepartmentListDto>> {
    const fullDepartmentList = await this.erDepartmentService.getFullDepartmentList();
    return createResponse(fullDepartmentList);
  }

  /**
   * 병원별 진료가능과 조회
   * 현재 진료가능한 과를 조회한다.
   *
   * @author anthony
   * @tag er_department
   * @summary 2023-10-01 - 병원별 진료가능과 호출 API
   *
   * @param user

   * @security access_token
   * @returns {ErDepartmentResponse.GetDepartmentStatusListDto}
   */
  @TypedRoute.Get('/status')
  @UseGuards(ErJwtAccessAuthGuard)
  async getDepartmentList(
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<Try<ErDepartmentResponse.GetDepartmentStatusListDto>> {
    const DepartmentStatusList = await this.erDepartmentService.getDepartmentStatusList({ user });
    return createResponse(DepartmentStatusList);
  }

  /**
   * 병원에 특정 진료과를 진료가능과로 설정
   * 특정 진료과를 진료가능과로 설정합니다
   *
   * @author anthony
   * @tag er_department
   * @summary 2023-10-02 - 진료가능과 설정(추가)
   *
   * @param body
   * @param user
   * @security access_token
   * @returns {ErDepartmentResponse.AddAvailableDepartmentDto}
   */
  @TypedRoute.Post('/status')
  @UseGuards(ErJwtAccessAuthGuard)
  @TypedException<ER_DEPARTMENT_ERROR.DEPARTMENT_NOT_EXIST>(
    ER_DEPARTMENT_ERROR.departmentNotExist.http_status_code,
    ER_DEPARTMENT_ERROR.departmentNotExist.message,
  )
  async addAvailableDepartment(
    @TypedBody()
    body: ErDepartmentRequest.AddAvailableDepartmentRequestDto,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<Try<ErDepartmentResponse.AddAvailableDepartmentDto>> {
    const { department_id } = body;
    const result = await this.erDepartmentService.addAvailableDepartment({ user, department_id });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * 병원에 특정 진료과를 진료 불가능으로 설정
   * 특정 진료과를 진료 불가능으로 설정합니다.
   *
   * @author anthony
   * @tag er_department
   * @summary 2023-10-02 - 진료가능과 설정 해제
   *
   * @param body
   * @param user
   * @security access_token
   * @returns {ErDepartmentResponse.RemoveAvailableDepartmentDto<'NO_CONTENT'>}
   */
  @TypedRoute.Delete('/status/:department_id')
  @UseGuards(ErJwtAccessAuthGuard)
  @TypedException<ER_DEPARTMENT_ERROR.DEPARTMENT_NOT_EXIST>(
    ER_DEPARTMENT_ERROR.departmentNotExist.http_status_code,
    ER_DEPARTMENT_ERROR.departmentNotExist.message,
  )
  async removeAvailableDepartment(
    @TypedParam('department_id')
    department_id: ErDepartmentRequest.RemoveAvailableDepartmentParam,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<Try<ErDepartmentResponse.RemoveAvailableDepartmentDto<'NO_CONTENT'>>> {
    const result = await this.erDepartmentService.removeAvailableDepartment({ user, department_id });
    if (isError(result)) return throwError(result);
    return createResponse({
      statusMessage: result,
      statusCode: HttpStatus[result],
    });
  }
}
