import { PrismaService } from '@common/prisma/prisma.service';
import { JWT_OPTIONS } from '@config/constant';
import { JwtOption } from '@config/option/interface';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthRequest } from '@src/types';
import { AUTH_ERROR } from '@src/types/errors';
import * as bcrypt from 'bcrypt';
import { Auth } from '../interface/auth.interface';
@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(JWT_OPTIONS)
    private readonly jwtOption: JwtOption,
  ) {}

  async login({ emergency_center_id, id_card, password }: AuthRequest.LoginDTO): Promise<Auth.LoginReturn> {
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
      throw new UnauthorizedException({ ...AUTH_ERROR.EMPLOYEE_NOT_FOUND });
    }
    const { employee_id, role } = existEmployee;
    const comparePassword = await this.comparePassword({
      password,
      hash: existEmployee.password,
    });
    if (!comparePassword) {
      throw new UnauthorizedException('Password is incorrect');
    }
    const access_token = this.accessTokenSign({ emergency_center_id, ...existEmployee });
    const refresh_token = this.refreshTokenSign({ emergency_center_id, ...existEmployee });
    return {
      access_token,
      refresh_token,
      employee: {
        emergency_center_id,
        employee_id,
        id_card,
        role,
      },
    };
  }

  async logout() {}

  async hashPassword({ password }: Auth.HashPassword) {
    const hashedPassword = bcrypt.hash(password, Number(this.configService.get('HASH_SALT')));
    return hashedPassword;
  }

  async comparePassword({ password, hash }: Auth.ComparePassword) {
    return await bcrypt.compare(password, hash);
  }

  accessTokenSign({ emergency_center_id, employee_id, id_card, role }: Auth.AccessTokenSignPayload) {
    const access_token = this.jwtService.sign(
      {
        emergency_center_id,
        employee_id,
        id_card,
        role,
      },
      {
        secret: this.jwtOption.access_secret,
        expiresIn: this.jwtOption.access_expires_in,
      },
    );

    return access_token;
  }

  accessTokenVerify({ access_token }: Auth.AccessTokenVerify) {
    try {
      const verify = this.jwtService.verify<Auth.AccessTokenSignPayload>(access_token, {
        secret: this.jwtOption.access_secret,
      });
      return verify;
    } catch (error) {
      return error;
    }
  }

  refreshTokenSign({ emergency_center_id, employee_id, id_card }: Auth.RefreshTokenSignPayload) {
    const refresh_token = this.jwtService.sign(
      {
        emergency_center_id,
        employee_id,
        id_card,
      },
      {
        secret: this.jwtOption.refresh_secret,
        expiresIn: this.jwtOption.refresh_expires_in,
      },
    );

    return refresh_token;
  }

  refreshTokenVerify({ refresh_token }: Auth.RefreshTokenVerify) {
    try {
      const verify = this.jwtService.verify<Auth.RefreshTokenSignPayload>(refresh_token, {
        secret: this.jwtOption.refresh_secret,
      });
      return verify;
    } catch (error) {
      return error;
    }
  }
}
