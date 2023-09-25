import { JWT_OPTIONS } from '@config/constant';
import { jwtOption } from '@config/option';
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './provider/auth.service';
import { JwtAccessStrategy } from './strategy/jwt.access.strategy';
import { JwtRefreshStrategy } from './strategy/jwt.refresh.strategy';
@Global()
@Module({
  imports: [JwtModule],
  providers: [
    AuthService,
    {
      provide: JWT_OPTIONS,
      useValue: jwtOption,
    },
    JwtAccessStrategy,
    JwtRefreshStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtAccessStrategy],
})
export class AuthModule {}
