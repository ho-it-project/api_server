import { PrismaService } from '@common/prisma/prisma.service';
import { JWT_AUTH_ACCESS_GUARD } from '@config/constant';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_ERROR } from '../../types/errors/auth.error';
import { Auth } from '../interface/auth.interface';
import { accessTokenExtractorFromCookeis } from '../util/jwtExtractorFromCookeis';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, JWT_AUTH_ACCESS_GUARD) {
  private readonly logger = new Logger(JwtAccessStrategy.name);
  constructor(
    readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([accessTokenExtractorFromCookeis]),
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: Auth.AccessTokenSignPayload): Promise<Auth.AccessTokenSignPayload> {
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
      throw new UnauthorizedException(AUTH_ERROR.ACCESS_TOKEN_FAILURE);
    }
  }
}
