import { JWT_OPTIONS } from '@config/constant';
import { jwtOption } from '@config/option';
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ErAuthController } from './controller/er.auth.controller';
import { AuthService } from './provider/common.auth.service';
import { ErAuthService } from './provider/er.auth.service';
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
    {
      provide: JWT_OPTIONS,
      useValue: jwtOption,
    },
    ErJwtAccessStrategy,
    ErJwtRefreshStrategy,
    EmsJwtAccessStrategy,
    EmsJwtRefreshStrategy,
  ],
  controllers: [ErAuthController],
  exports: [ErAuthService, ErJwtAccessStrategy, EmsJwtAccessStrategy, AuthService],
})
export class AuthModule {}
