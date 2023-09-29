import { PrismaService } from '@common/prisma/prisma.service';
import { JWT_AUTH_REFRESH_GUARD } from '@config/constant';
import { throwError } from '@config/errors';
import { AUTH_ERROR } from '@config/errors/auth.error';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import typia from 'typia';
import { ErAuth } from '../interface/er.auth.interface';
import { refreshTokenExtractorFromCookeis } from '../util/jwtExtractorFromCookeis';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, JWT_AUTH_REFRESH_GUARD) {
  private readonly logger = new Logger(JwtRefreshStrategy.name);
  constructor(
    readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([refreshTokenExtractorFromCookeis]),
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: ErAuth.RefreshTokenSignPayload): Promise<ErAuth.RefreshTokenSignPayload> {
    this.logger.debug('JwtAccessStrategy.validate');
    const { employee_id, emergency_center_id } = payload;
    const user = await this.prismaService.er_Employee.findFirst({
      where: {
        employee_id,
        hospital: {
          emergency_center: {
            every: {
              emergency_center_id,
            },
          },
        },
      },
    });
    if (user) {
      return payload;
    } else {
      return throwError(typia.random<AUTH_ERROR.REFRESH_TOKEN_FAILURE>());
    }
  }
}
