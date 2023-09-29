import { PrismaService } from '@common/prisma/prisma.service';
import { JWT_OPTIONS } from '@config/constant';
import { AUTH_ERROR } from '@config/errors/auth.error';
import { JwtOption } from '@config/option/interface';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ErAuthRequest } from '@src/types';
import * as bcrypt from 'bcrypt';
import typia from 'typia';
import { Auth, EmsAuth, ErAuth } from '../interface';

@Injectable()
export class ErAuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(JWT_OPTIONS)
    private readonly jwtOption: JwtOption,
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
    const { employee_id, role, hospital_id } = existEmployee;
    const comparePassword = await this.comparePassword({
      password,
      hash: existEmployee.password,
    });
    if (!comparePassword) {
      return typia.random<AUTH_ERROR.PASSWORD_INCORRECT>();
    }
    const { access_token, refresh_token } = this.tokenSign({ emergency_center_id, ...existEmployee });
    return {
      access_token,
      refresh_token,
      employee: {
        hospital_id,
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

  accessTokenSign(accessTokenPayload: ErAuth.AccessTokenSignPayload | EmsAuth.AccessTokenSignPayload) {
    const access_token = this.jwtService.sign(accessTokenPayload, {
      secret: this.jwtOption.access_secret,
      expiresIn: this.jwtOption.access_expires_in,
    });

    return access_token;
  }

  accessTokenVerify({ access_token }: Auth.AccessTokenVerify) {
    try {
      const verify = this.jwtService.verify<ErAuth.AccessTokenSignPayload | EmsAuth.AccessTokenSignPayload>(
        access_token,
        {
          secret: this.jwtOption.access_secret,
        },
      );
      return verify;
    } catch (error) {
      return error;
    }
  }

  refreshTokenSign(payload: ErAuth.RefreshTokenSignPayload | EmsAuth.RefreshTokenSignPayload) {
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.jwtOption.refresh_secret,
      expiresIn: this.jwtOption.refresh_expires_in,
    });
    return refresh_token;
  }

  refreshTokenVerify({ refresh_token }: Auth.RefreshTokenVerify) {
    try {
      const verify = this.jwtService.verify<ErAuth.RefreshTokenSignPayload | EmsAuth.RefreshTokenSignPayload>(
        refresh_token,
        {
          secret: this.jwtOption.refresh_secret,
        },
      );
      return verify;
    } catch (error) {
      // throw new UnauthorizedException({ ...AUTH_ERROR.REFRESH_TOKEN_INVALID });
      return typia.random<AUTH_ERROR.REFRESH_TOKEN_INVALID>();
    }
  }

  tokenSign(payload: ErAuth.AccessTokenSignPayload | EmsAuth.AccessTokenSignPayload) {
    const access_token = this.accessTokenSign(payload);
    const refresh_token = this.refreshTokenSign(payload);
    return { access_token, refresh_token };
  }
}
