import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { TypedBody, TypedException, TypedRoute } from '@nestia/core';
import { Controller, Res, UseGuards } from '@nestjs/common';
import { AuthRequest, AuthResponse, Try } from '@src/types';
import { AUTH_ERROR } from '@src/types/errors';
import { Response } from 'express';
import { assertPrune } from 'typia/lib/misc';
import { JwtRefreshuthGuard } from './guard/jwt.refresh.guard';
import { Auth } from './interface/auth.interface';
import { AuthService } from './provider/auth.service';
@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @TypedRoute.Get('/')
  @UseGuards(JwtRefreshuthGuard)
  @TypedException<AUTH_ERROR.REFRESH_TOKEN_FAILURE>(401, 'AUTH_ERROR.REFRESH_TOKEN_FAILURE')
  async checkAuthStatus(
    @CurrentUser() user: Auth.AccessTokenSignPayload,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Try<AuthResponse.CheckAuthStatus>> {
    if (user) {
      const { access_token, refresh_token } = this.authService.tokenSign(user);
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
      const employee = assertPrune<Auth.AccessTokenSignPayload>(user);
      return createResponse({
        is_login: true,
        employee,
      });
    } else {
      response.clearCookie('refresh_token');
      response.clearCookie('access_token');
      return createResponse({
        is_login: false,
        employee: null,
      });
    }
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
  async logout(@Res({ passthrough: true }) response: Response): Promise<Try<AuthResponse.Logout>> {
    response.clearCookie('refresh_token');
    response.clearCookie('access_token');
    return createResponse({
      is_login: false,
    });
  }
}
