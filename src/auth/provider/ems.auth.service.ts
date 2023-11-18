import { PrismaService } from '@common/prisma/prisma.service';
import { AUTH_ERROR } from '@config/errors';
import { Injectable } from '@nestjs/common';
import { EmsAuthRequest } from '@src/types/ems.request.dto';
import typia from 'typia';
import { assertPrune } from 'typia/lib/misc';
import { EmsAuth } from '../interface';
import { AuthService } from './common.auth.service';

@Injectable()
export class EmsAuthService {
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {}

  async login({
    ambulance_company_name,
    id_card,
    password,
  }: EmsAuthRequest.LoginDTO): Promise<
    EmsAuth.LoginReturn | AUTH_ERROR.EMPLOYEE_NOT_FOUND | AUTH_ERROR.PASSWORD_INCORRECT
  > {
    const existEmployee = await this.prismaService.ems_Employee.findFirst({
      where: {
        id_card,
        ambulance_company: {
          ambulance_company_name,
        },
      },
    });

    if (!existEmployee) {
      return typia.random<AUTH_ERROR.EMPLOYEE_NOT_FOUND>();
    }
    const { employee_id, role, ambulance_company_id, employee_name } = existEmployee;
    const comparePassword = await this.authService.comparePassword({
      password,
      hash: existEmployee.password,
    });
    if (!comparePassword) {
      return typia.random<AUTH_ERROR.PASSWORD_INCORRECT>();
    }
    const { access_token, refresh_token } = this.authService.tokenSign(
      assertPrune<EmsAuth.AccessTokenSignPayload>({ ...existEmployee }),
    );

    return {
      access_token,
      refresh_token,
      employee: {
        employee_name,
        ambulance_company_id,
        employee_id,
        id_card,
        role,
      },
    };
  }
}
