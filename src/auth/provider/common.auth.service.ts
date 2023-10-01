import { JWT_OPTIONS } from '@config/constant';
import { JwtOption } from '@config/option/interface';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Auth, EmsAuth, ErAuth } from '../interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(JWT_OPTIONS)
    private readonly jwtOption: JwtOption,
  ) {}

  accessTokenSign(payload: ErAuth.AccessTokenSignPayload | EmsAuth.AccessTokenSignPayload) {
    const access_token = this.jwtService.sign(payload, {
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
      const verify = this.jwtService.verify<ErAuth.RefreshTokenSignPayload>(refresh_token, {
        secret: this.jwtOption.refresh_secret,
      });
      return verify;
    } catch (error) {
      return error;
    }
  }

  tokenSign(payload: ErAuth.AccessTokenSignPayload | EmsAuth.AccessTokenSignPayload) {
    const access_token = this.accessTokenSign(payload);
    const refresh_token = this.refreshTokenSign(payload);
    return { access_token, refresh_token };
  }
  async hashPassword({ password }: Auth.HashPassword) {
    const hashedPassword = bcrypt.hash(password, Number(this.configService.get('HASH_SALT')));
    return hashedPassword;
  }

  async comparePassword({ password, hash }: Auth.ComparePassword) {
    return await bcrypt.compare(password, hash);
  }
}
