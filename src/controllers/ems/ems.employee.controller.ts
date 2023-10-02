import { CurrentUser } from '@common/decorators/CurrentUser';
import { AdminGuard } from '@common/guard/admin.guard';
import { createResponse } from '@common/interceptor/createResponse';
import { AUTH_ERROR, EMS_EMPLOYEE_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedQuery, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { EmsJwtAccessAuthGuard } from '@src/auth/guard/ems.jwt.access.guard';
import { EmsAuth } from '@src/auth/interface';
import { EmsEmployeeService } from '@src/providers/ems/ems.employee.service';
import { Try, TryCatch } from '@src/types';
import { EmsEmployeeRequest } from '@src/types/ems.request.dto';
import { EmsEmployeeResponse } from '@src/types/ems.response.dto';
import { assertPrune } from 'typia/lib/misc';

@Controller('/ems/employee')
export class EmsEmployeeController {
  constructor(private readonly emsEmployeeService: EmsEmployeeService) {}

  /**
   * 직원 리스트 조회 API
   *
   * 직원 리스트를 조회한다.
   * - access_token을 기반으로 소속 조직(회사) 직원 리스트를 조회한다.
   * - 회사마다 직원을 조회할수 있다
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
   * @tag ems_employee
   * @summary 2023-10-01 - 직원 리스트 조회 API
   *
   * @param query
   * @param user
   * @security access_token
   * @returns {EmsEmployeeResponse.GetEmployeeList} 직원 리스트 및 총 직원 수
   */
  @TypedRoute.Get('/')
  @UseGuards(EmsJwtAccessAuthGuard)
  async getEmployeeList(
    @TypedQuery() query: EmsEmployeeRequest.GetEmployeeListQuery,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
  ): Promise<Try<EmsEmployeeResponse.GetEmployeeList>> {
    const result = await this.emsEmployeeService.getEmployeeList({ query, user });
    const prune = assertPrune<EmsEmployeeResponse.GetEmployeeList>(result);
    return createResponse(prune);
  }

  /**
   * 직원 생성 API
   * 직원들을 생성한다.
   * 한번에 여러명의 직원을 생성할 수 있다.
   *
   * ADMIN 권한이 필요하다.
   *
   * 필수값 : [id_card, name, password, role]
   *
   * - 조직(회사)마다 id_card는 중복될 수 없다.
   * - 따라서, 이 API사용 이전에 중복체크 API를 사용하여 중복을 검사해야한다.
   *
   * @author de-novo
   * @tag ems_employee
   * @summary 2023-10-01 - 직원 생성 API
   *
   *
   * @param createManyDto
   * @param user
   * @security access_token
   * @return {EmsEmployeeResponse.CreateEmployee}
   */
  @TypedRoute.Post('/')
  @UseGuards(EmsJwtAccessAuthGuard, AdminGuard)
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  @TypedException<EMS_EMPLOYEE_ERROR.EMPLOYEE_MULTIPLE_ALREADY_EXIST>(
    400,
    'EMS_EMPLOYEE_ERROR.EMPLOYEE_MULTIPLE_ALREADY_EXIST',
  )
  async createManyEmployee(
    @TypedBody() createManyDto: EmsEmployeeRequest.CreateManyDTO,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
  ): Promise<
    TryCatch<
      EmsEmployeeResponse.CreateManyEmployee,
      AUTH_ERROR.FORBIDDEN | EMS_EMPLOYEE_ERROR.EMPLOYEE_MULTIPLE_ALREADY_EXIST
    >
  > {
    const result = await this.emsEmployeeService.createManyEmployee({
      ...createManyDto,
      user,
    });
    if (isError(result)) {
      return throwError(result);
    }
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
   * @tag ems_employee
   * @summary 2023-10-01 - 직원 중복체크 API
   *
   * @param body
   * @param user
   * @security access_token
   * @returns {EmsEmployeeResponse.CheckManyEmployeeExist} 중복체크 결과
   */
  @TypedRoute.Post('/exists')
  @UseGuards(EmsJwtAccessAuthGuard, AdminGuard)
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  async CheckManyEmployeeExist(
    @TypedBody() body: EmsEmployeeRequest.CheckManyExistDTO,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
  ): Promise<Try<EmsEmployeeResponse.CheckManyEmployeeExist>> {
    const result = await this.emsEmployeeService.checkManyEmployeeExist({
      ...body,
      ambulance_company_id: user.ambulance_company_id,
    });
    return createResponse({ exists: result });
  }

  /**
   * 비밀번호 변경 API
   *
   * 비밀번호를 변경한다.
   * 필수값 : [password, now_password]
   *
   * now_password는 현재 비밀번호를 입력해야한다.
   * password는 변경할 비밀번호를 입력해야한다.
   *
   *
   * @author de-novo
   * @tag ems_employee
   * @summary 2023-10-01 - 비밀번호 변경 API
   *
   * @param updateDto
   * @param user
   * @security access_token
   * @returns {EmsEmployeeResponse.UpdatePassword} 비밀번호 변경 성공 여부
   */

  @TypedRoute.Patch('/')
  @UseGuards(EmsJwtAccessAuthGuard)
  async updatePassword(
    @TypedBody() updateDto: EmsEmployeeRequest.UpdatePasswordDTO,
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
  ): Promise<
    TryCatch<
      EmsEmployeeResponse.UpdatePassword,
      | EMS_EMPLOYEE_ERROR.EMPLOYEE_NOT_FOUND
      | EMS_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_INVALID
      | EMS_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_SAME
    >
  > {
    const result = await this.emsEmployeeService.updatePassword({
      ...updateDto,
      ...user,
    });
    if (isError(result)) {
      return throwError(result);
    }

    return createResponse({ update_success: true });
  }
}
