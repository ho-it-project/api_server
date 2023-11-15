import { COMMON_AUTH_GUARD } from '@config/constant';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Auth, ErAuth } from '@src/auth/interface';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EmsAuth } from '../interface';
import { accessTokenExtractorFromCookeis } from '../util/jwtExtractorFromCookeis';

@Injectable()
export class CommonJwtStrategy extends PassportStrategy(Strategy, COMMON_AUTH_GUARD) {
  private readonly logger = new Logger(CommonJwtStrategy.name);
  constructor(readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([accessTokenExtractorFromCookeis]),
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: Auth.AccessTokenSignPayload) {
    this.logger.debug('CommonJwtStrategy.validate');
    if ((payload as EmsAuth.AccessTokenSignPayload).ambulance_company_id) {
      return { ...payload, _type: 'EMS' } as EmsAuth.AccessTokenSignPayload & {
        _type: 'EMS';
      };
    }
    if ((payload as ErAuth.AccessTokenSignPayload).emergency_center_id) {
      return { ...payload, _type: 'ER' } as ErAuth.AccessTokenSignPayload & {
        _type: 'ER';
      };
    }

    return payload;
  }
}
