import { CurrentUser } from '@common/decorators/CurrentUser';
import { AdminGuard } from '@common/guard/admin.guard';
import { createResponse } from '@common/interceptor/createResponse';
import { AUTH_ERROR, EMS_EMPLOYEE_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { EmsJwtAccessAuthGuard } from '@src/auth/guard/ems.jwt.access.guard';
import { EmsAuth } from '@src/auth/interface';
import { EmsEmployeeService } from '@src/providers/ems/ems.employee.service';
import { EmsEmployeeRequest } from '@src/types/ems.request.dto';

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
  ) {
    const result = await this.emsEmployeeService.createManyEmployee({
      ...createManyDto,
      user,
    });
    if (isError(result)) {
      return throwError(result);
    }
    return createResponse(result);
  }

  @TypedRoute.Get('/:employee_id')
  async getEmployee() {}

  @TypedRoute.Post('/exists')
  async CheckManyEmployeeExist() {}
}
