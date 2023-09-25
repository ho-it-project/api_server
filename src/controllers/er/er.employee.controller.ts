import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { TypedBody, TypedQuery, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAccessAuthGuard } from '@src/auth/guard/jwt.access.guard';
import { Auth } from '@src/auth/interface/auth.interface';
import { ErEmployeeService } from '@src/providers/er/er.employee.service';
import { EmployeeRequest } from '@src/types';

@Controller('/er/employee')
export class ErEmployeeController {
  constructor(private readonly erEmployeeService: ErEmployeeService) {}

  @TypedRoute.Post('/')
  @UseGuards(JwtAccessAuthGuard)
  async createManyEmployee(
    @TypedBody() body: EmployeeRequest.CreateManyDTO,
    @CurrentUser() user: Auth.AccessTokenSignPayload,
  ) {
    const result = await this.erEmployeeService.createManyEmployee({ ...body, user });

    return createResponse(result);
  }

  @TypedRoute.Post('/exists')
  @UseGuards(JwtAccessAuthGuard)
  async checkManyEmployeeExist(
    @TypedBody() body: EmployeeRequest.CheckManyExistDTO,
    @CurrentUser() user: Auth.AccessTokenSignPayload,
  ) {
    const result = await this.erEmployeeService.checkManyEmployeeExist({ ...body, hospital_id: user.hospital_id });

    return createResponse({ exists: result });
  }

  @TypedRoute.Patch('/')
  @UseGuards(JwtAccessAuthGuard)
  async updatePassword(
    @TypedBody() body: EmployeeRequest.UpdatePasswordDTO,
    @CurrentUser() user: Auth.AccessTokenSignPayload,
  ) {
    const result = await this.erEmployeeService.updatePassword({
      ...body,
      id_card: user.id_card,
      hospital_id: user.hospital_id,
    });

    return createResponse(result);
  }

  @TypedRoute.Get('/')
  @UseGuards(JwtAccessAuthGuard)
  async getEmployeeList(
    @TypedQuery()
    query: EmployeeRequest.GetEmployeeListQuery,
    @CurrentUser() user: Auth.AccessTokenSignPayload,
  ) {
    const result = await this.erEmployeeService.getEmployeeListByQuery({
      query,
      user,
    });
    console.log(result);
  }
}
