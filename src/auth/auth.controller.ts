import { createResponse } from '@common/interceptor/createResponse';
import { TypedBody, TypedException, TypedRoute } from '@nestia/core';
import { Controller, Res } from '@nestjs/common';
import { AuthResponse, AuthRequest, Try } from '@src/types';
import { AUTH_ERROR } from '@src/types/errors';
import { Response } from 'express';
import { AuthService } from './provider/auth.service';
@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @TypedRoute.Get('/')
  async checkAuthStatus() {
    const a = this.authService.accessTokenSign({
      emergency_center_id: '1',
      employee_id: '1',
      id_card: '1',
      role: 'ADMIN',
    });
    const b = this.authService.accessTokenVerify({ access_token: a });
    console.log(a);
    console.log(b);
    return 'ok';
  }

  @TypedRoute.Post('/login')
  @TypedException<AUTH_ERROR.EMPLOYEE_NOT_FOUND>(401, 'AUTH_ERROR.EMPLOYEE_NOT_FOUND')
  @TypedException<AUTH_ERROR.PASSWORD_INCORRECT>(400, 'AUTH_ERROR.PASSWORD_INCORRECT')
  async login(
    @TypedBody() loginDTO: AuthRequest.LoginDTO,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Try<AuthResponse.Login>> {
    const { access_token, refresh_token, employee } = await this.authService.login(loginDTO);

    response.cookie('refresh_token', refresh_token, {
      sameSite: 'none',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false, //htt
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    response.cookie('access_token', access_token, {
      sameSite: 'none',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false, //htt
      maxAge: 1000 * 60 * 60 * 24,
    });
    return createResponse({
      is_login: true,
      employee,
    });
  }

  @TypedRoute.Post('/logout')
  async logout() {}
}
