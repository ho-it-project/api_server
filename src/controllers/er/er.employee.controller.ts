import { CurrentUser } from '@common/decorators/CurrentUser';
import { TypedBody, TypedRoute } from '@nestia/core';
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
    @TypedBody() body: EmployeeRequest.createManyDTO,
    @CurrentUser() user: Auth.AccessTokenSignPayload,
  ) {
    const result = await this.erEmployeeService.createManyEmployee({ ...body, user });

    console.log(result);
    return 'Hello World!';
  }
}
