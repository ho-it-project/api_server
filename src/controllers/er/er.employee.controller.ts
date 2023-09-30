import { CurrentUser } from '@common/decorators/CurrentUser';
import { AdminGuard } from '@common/guard/admin.guard';
import { createResponse } from '@common/interceptor/createResponse';
import { ER_EMPLOYEE_ERROR, isError, throwError } from '@config/errors';
import { AUTH_ERROR } from '@config/errors/auth.error';
import { TypedBody, TypedException, TypedQuery, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import { ErAuth } from '@src/auth/interface/er.auth.interface';
import { ErEmployeeService } from '@src/providers/er/er.employee.service';
import { ErEmployeeRequest, ErEmployeeResponse, Try, TryCatch } from '@src/types';

@Controller('/er/employee')
export class ErEmployeeController {
  constructor(private readonly erEmployeeService: ErEmployeeService) {}

  /**
   * 직원 생성 API
   * 직원들을 생성한다.
   * 한번에 여러명의 직원을 생성할 수 있다.
   *
   * ADMIN 권한이 필요하다.
   * 
   * 필수값 : [id_card, name, password, role]
   *
   * - 병원마다 id_card는 중복될 수 없다.
   * - 따라서, 이 API사용 이전에 중복체크 API를 사용하여 중복을 검사해야한다.
   *
   *
   * @author de-novo
   * @tag er_employee
   * @summary 2023-09-30 - 직원 생성 API
   *
   * @param body
   * @param user
   * @security access_token
   * @returns {ErEmployeeResponse.CreateEmployee}
   */
  @TypedRoute.Post('/')
  @UseGuards(ErJwtAccessAuthGuard)
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  @TypedException<ER_EMPLOYEE_ERROR.EMPLOYEE_MULTIPLE_ALREADY_EXIST>(
    400,
    'ER_EMPLOYEE_ERROR.EMPLOYEE_MULTIPLE_ALREADY_EXIST_RETURN',
  )
  async createManyEmployee(
    @TypedBody() body: ErEmployeeRequest.CreateManyDTO,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<Try<Prisma.BatchPayload>> {
    const result = await this.erEmployeeService.createManyEmployee({ ...body, user });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  /**
   * 직원 중복체크 API
   * 직원들을 중복체크한다.
   * 한번에 여러명의 직원을 중복체크할 수 있다.
   *
   * ADMIN 권한이 필요하다.
   * 
   * 필수값 : [id_card]
   *
   * @author de-novo
   * @tag er_employee
   * @summary 2023-09-30 - 직원 중복체크 API
   *
   * @param body
   * @param user
   * @security access_token
   * @returns {ErEmployeeResponse.CheckManyEmployeeExist} 중복체크 결과
   */
  @TypedRoute.Post('/exists')
  @UseGuards(ErJwtAccessAuthGuard, AdminGuard)
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  async checkManyEmployeeExist(
    @TypedBody() body: ErEmployeeRequest.CheckManyExistDTO,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<Try<ErEmployeeResponse.CheckManyEmployeeExist>> {
    const result = await this.erEmployeeService.checkManyEmployeeExist({ ...body, hospital_id: user.hospital_id });

    return createResponse({ exists: result });
  }

  /**
   * 비밀번호 변경 API
   * 본인의 비밀번호를 변경한다.
   *
   * 필수값 : [password, now_password]
   *
   * 이전과 동일한 비밀번호로 변경할 수 없다.
   * 비밀번호는 8자리 이상이어야한다.
   *
   * @author de-novo
   * @tag er_employee
   * @summary 2023-09-30 - 비밀번호 변경 API
   *
   * @param body
   * @param user
   * @security access_token
   * @returns
   */
  @TypedRoute.Patch('/')
  @UseGuards(ErJwtAccessAuthGuard)
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  @TypedException<ER_EMPLOYEE_ERROR.EMPLOYEE_NOT_FOUND>(400, 'ER_EMPLOYEE_ERROR.EMPLOYEE_NOT_FOUND')
  @TypedException<ER_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_INVALID>(400, 'ER_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_INVALID')
  @TypedException<ER_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_SAME>(400, 'ER_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_SAME')
  async updatePassword(
    @TypedBody() body: ErEmployeeRequest.UpdatePasswordDTO,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<
    TryCatch<
      ErEmployeeResponse.UpdatePassword,
      | AUTH_ERROR.FORBIDDEN
      | ER_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_INVALID
      | ER_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_INVALID
      | ER_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_SAME
    >
  > {
    const result = await this.erEmployeeService.updatePassword({
      ...body,
      id_card: user.id_card,
      hospital_id: user.hospital_id,
    });
    if (isError(result)) return throwError(result);

    return createResponse({ update_success: true });
  }

  /**
   * 직원 리스트 조회 API
   *
   * 직원 리스트를 조회한다.
   * - access_token을 기반으로 소속 병원의 직원 리스트를 조회한다.
   * - 병원마다 직원 리스트를 조회할 수 있다.
   *
   * ## query
   * - page : 조회할 페이지
   *   - default : 1
   * - limit : 한 페이지에 보여줄 직원 수
   *   - default : 10
   * - search_type : 검색 타입
   *   - employee_name | id_card
   * - search : seach_type에 따라 검색
   *   - default : '' - 전체
   * - role : 직원 타입 필터 - 복수 선택 가능
   *
   * @author de-novo
   * @tag er_employee
   * @summary 2023-09-30 - 직원 리스트 조회 API
   *
   * @security access_token
   * @param query
   * @param user
   * @returns {ErEmployeeResponse.GetEmployeeList} 직원 리스트 조회
   */
  @TypedRoute.Get('/')
  @UseGuards(ErJwtAccessAuthGuard, AdminGuard)
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  async getEmployeeList(
    @TypedQuery()
    query: ErEmployeeRequest.GetEmployeeListQuery,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<Try<ErEmployeeResponse.GetEmployeeList>> {
    const result = await this.erEmployeeService.getEmployeeListByQuery({
      query,
      user,
    });
    return createResponse(result);
  }
}
