import { PrismaService } from '@common/prisma/prisma.service';
import { EMS_JWT_AUTH_ACCESS_GUARD } from '@config/constant';
import { throwError } from '@config/errors';
import { AUTH_ERROR } from '@config/errors/auth.error';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import typia from 'typia';
import { EmsAuth } from '../interface';

@Injectable()
export class EmsJwtAccessStrategy extends PassportStrategy(Strategy, EMS_JWT_AUTH_ACCESS_GUARD) {
  private readonly logger = new Logger(EmsJwtAccessStrategy.name);
  constructor(
    readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: EmsAuth.AccessTokenSignPayload): Promise<EmsAuth.AccessTokenSignPayload> {
    this.logger.debug('JwtAccessStrategy.validate');
    const { employee_id, ambulance_company_id } = payload;
    const user = await this.prismaService.ems_Employee.findFirst({
      where: {
        employee_id,
        ambulance_company_id,
      },
    });

    if (user) {
      return payload;
    } else {
      return throwError(typia.random<AUTH_ERROR.ACCESS_TOKEN_FAILURE>());
    }
  }
}
