import { JWT_OPTIONS } from '@config/constant';
import { jwtOption } from '@config/option';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './provider/auth.service';
@Module({
  imports: [JwtModule],
  providers: [
    AuthService,
    {
      provide: JWT_OPTIONS,
      useValue: jwtOption,
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
