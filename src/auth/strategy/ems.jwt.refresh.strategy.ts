import { PrismaService } from '@common/prisma/prisma.service';
import { EMS_JWT_AUTH_REFRESH_GUARD } from '@config/constant';
import { throwError } from '@config/errors';
import { AUTH_ERROR } from '@config/errors/auth.error';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import typia from 'typia';
import { assertPrune } from 'typia/lib/misc';
import { EmsAuth } from '../interface';
import { refreshTokenExtractorFromCookeis } from '../util/jwtExtractorFromCookeis';

@Injectable()
export class EmsJwtRefreshStrategy extends PassportStrategy(Strategy, EMS_JWT_AUTH_REFRESH_GUARD) {
  private readonly logger = new Logger(EmsJwtRefreshStrategy.name);
  constructor(
    readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([refreshTokenExtractorFromCookeis]),
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: EmsAuth.RefreshTokenSignPayload): Promise<EmsAuth.AccessTokenSignPayload> {
    this.logger.debug('JwtAccessStrategy.validate');
    const { employee_id, ambulance_company_id } = payload;
    const user = await this.prismaService.ems_Employee.findFirst({
      where: {
        employee_id,
        ambulance_company_id,
      },
    });
    if (user) {
      return assertPrune<EmsAuth.AccessTokenSignPayload>(user);
    } else {
      return throwError(typia.random<AUTH_ERROR.REFRESH_TOKEN_FAILURE>());
    }
  }
}
