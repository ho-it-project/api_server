import { JWT_OPTIONS } from '@config/constant';
import { jwtOption } from '@config/option';
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EmsAuthController } from './controller/ems.auth.controller';
import { ErAuthController } from './controller/er.auth.controller';
import { AuthService } from './provider/common.auth.service';
import { EmsAuthService } from './provider/ems.auth.service';
import { ErAuthService } from './provider/er.auth.service';
import { CommonJwtStrategy } from './strategy/common.jwt.strategy';
import { EmsJwtAccessStrategy } from './strategy/ems.jwt.access.strategy';
import { EmsJwtRefreshStrategy } from './strategy/ems.jwt.refresh.strategy';
import { ErJwtAccessStrategy } from './strategy/er.jwt.access.strategy';
import { ErJwtRefreshStrategy } from './strategy/er.jwt.refresh.strategy';
@Global()
@Module({
  imports: [JwtModule],
  providers: [
    AuthService,
    ErAuthService,
    EmsAuthService,
    {
      provide: JWT_OPTIONS,
      useValue: jwtOption,
    },
    ErJwtAccessStrategy,
    ErJwtRefreshStrategy,
    EmsJwtAccessStrategy,
    EmsJwtRefreshStrategy,
    CommonJwtStrategy,
  ],
  controllers: [ErAuthController, EmsAuthController],
  exports: [ErAuthService, ErJwtAccessStrategy, EmsJwtAccessStrategy, AuthService, CommonJwtStrategy],
})
export class AuthModule {}
