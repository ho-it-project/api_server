import { PrismaService } from '@common/prisma/prisma.service';
import { AUTH_ERROR } from '@config/errors/auth.error';
import { Injectable } from '@nestjs/common';
import { ErAuthRequest } from '@src/types';
import typia from 'typia';
import { assertPrune } from 'typia/lib/misc';
import { ErAuth } from '../interface';
import { AuthService } from './common.auth.service';

@Injectable()
export class ErAuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async login({
    emergency_center_id,
    id_card,
    password,
  }: ErAuthRequest.LoginDTO): Promise<
    ErAuth.LoginReturn | AUTH_ERROR.EMPLOYEE_NOT_FOUND | AUTH_ERROR.PASSWORD_INCORRECT
  > {
    const existEmployee = await this.prismaService.er_Employee.findFirst({
      where: {
        id_card,
        hospital: {
          emergency_center: {
            every: {
              emergency_center_id,
            },
          },
        },
      },
    });
    if (!existEmployee) {
      return typia.random<AUTH_ERROR.EMPLOYEE_NOT_FOUND>();
    }
    const { employee_id, role, hospital_id, employee_name } = existEmployee;
    const comparePassword = await this.authService.comparePassword({
      password,
      hash: existEmployee.password,
    });
    if (!comparePassword) {
      return typia.random<AUTH_ERROR.PASSWORD_INCORRECT>();
    }
    const { access_token, refresh_token } = this.authService.tokenSign(
      assertPrune<ErAuth.AccessTokenSignPayload>({ emergency_center_id, ...existEmployee }),
    );
    return {
      access_token,
      refresh_token,
      employee: {
        hospital_id,
        employee_name,
        emergency_center_id,
        employee_id,
        id_card,
        role,
      },
    };
  }
}
