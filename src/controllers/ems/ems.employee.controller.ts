import { CurrentUser } from '@common/decorators/CurrentUser';
import { AdminGuard } from '@common/guard/admin.guard';
import { createResponse } from '@common/interceptor/createResponse';
import { AUTH_ERROR, EMS_EMPLOYEE_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { EmsJwtAccessAuthGuard } from '@src/auth/guard/ems.jwt.access.guard';
import { EmsAuth } from '@src/auth/interface';
import { EmsEmployeeService } from '@src/providers/ems/ems.employee.service';
import { Try, TryCatch } from '@src/types';
import { EmsEmployeeRequest } from '@src/types/ems.request.dto';
import { EmsEmployeeResponse } from '@src/types/ems.response.dto';

@Controller('/ems/employee')
export class EmsEmployeeController {
  constructor(private readonly emsEmployeeService: EmsEmployeeService) {}

  @TypedRoute.Get('/')
  async getEmployeeList() {}

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
}
