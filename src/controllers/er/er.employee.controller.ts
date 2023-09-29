import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { isError, throwError } from '@config/errors';
import { AUTH_ERROR } from '@config/errors/auth.error';
import { TypedBody, TypedException, TypedQuery, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtAccessAuthGuard } from '@src/auth/guard/jwt.access.guard';
import { ErAuth } from '@src/auth/interface/er.auth.interface';
import { ErEmployeeService } from '@src/providers/er/er.employee.service';
import { ErEmployeeRequest, ErEmployeeResponse, Try } from '@src/types';

@Controller('/er/employee')
export class ErEmployeeController {
  constructor(private readonly erEmployeeService: ErEmployeeService) {}

  @TypedRoute.Post('/')
  @UseGuards(JwtAccessAuthGuard)
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  // @TypedException<ER_EMPLOYEE_ERROR.EMPLOYEE_MULTIPLE_ALREADY_EXIST_SWAGGER>(
  //   400,
  //   'ER_EMPLOYEE_ERROR.EMPLOYEE_MULTIPLE_ALREADY_EXIST_RETURN',
  // )
  async createManyEmployee(
    @TypedBody() body: ErEmployeeRequest.CreateManyDTO,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<Try<Prisma.BatchPayload>> {
    const result = await this.erEmployeeService.createManyEmployee({ ...body, user });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  @TypedRoute.Post('/exists')
  @UseGuards(JwtAccessAuthGuard)
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  async checkManyEmployeeExist(
    @TypedBody() body: ErEmployeeRequest.CheckManyExistDTO,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<Try<ErEmployeeResponse.CheckManyEmployeeExist>> {
    const result = await this.erEmployeeService.checkManyEmployeeExist({ ...body, hospital_id: user.hospital_id });

    return createResponse({ exists: result });
  }

  @TypedRoute.Patch('/')
  @UseGuards(JwtAccessAuthGuard)
  @TypedException<AUTH_ERROR.FORBIDDEN>(403, 'AUTH_ERROR.FORBIDDEN')
  // @TypedException<ER_EMPLOYEE_ERROR.EMPLOYEE_NOT_FOUND>(400, 'ER_EMPLOYEE_ERROR.EMPLOYEE_NOT_FOUND_RETURN')
  // @TypedException<ER_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_INVALID>(
  //   400,
  //   'ER_EMPLOYEE_ERROR.EMPLOYEE_PASSWORD_INVALID_RETURN',
  // )
  async updatePassword(
    @TypedBody() body: ErEmployeeRequest.UpdatePasswordDTO,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<Try<ErEmployeeResponse.UpdatePassword>> {
    await this.erEmployeeService.updatePassword({
      ...body,
      id_card: user.id_card,
      hospital_id: user.hospital_id,
    });

    return createResponse({ update_success: true });
  }

  @TypedRoute.Get('/')
  @UseGuards(JwtAccessAuthGuard)
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
