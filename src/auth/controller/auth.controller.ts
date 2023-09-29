import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { isError } from '@config/errors';
import { AUTH_ERROR } from '@config/errors/auth.error';
import { TypedBody, TypedException, TypedRoute } from '@nestia/core';
import { Controller, Res, UseGuards } from '@nestjs/common';
import { ErAuthRequest, ErAuthResponse, Try, TryCatch } from '@src/types';
import { Response } from 'express';
import typia from 'typia';
import { assertPrune } from 'typia/lib/misc';
import { JwtRefreshuthGuard } from '../guard/jwt.refresh.guard';
import { ErAuth } from '../interface/er.auth.interface';
import { AuthService } from '../provider/auth.service';
import { throwError } from './../../config/errors/index';
@Controller('/er/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @TypedRoute.Get('/')
  @UseGuards(JwtRefreshuthGuard)
  @TypedException<AUTH_ERROR.REFRESH_TOKEN_FAILURE>(401, 'AUTH_ERROR.REFRESH_TOKEN_FAILURE')
  async checkAuthStatus(
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Try<ErAuthResponse.CheckAuthStatus>> {
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
      const employee = assertPrune<ErAuth.AccessTokenSignPayload>(user);
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
    @TypedBody() loginDTO: ErAuthRequest.LoginDTO,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TryCatch<ErAuthResponse.Login, AUTH_ERROR.EMPLOYEE_NOT_FOUND | AUTH_ERROR.PASSWORD_INCORRECT>> {
    const loginResult = await this.authService.login(loginDTO);
    if (isError(loginResult)) {
      return throwError(loginResult);
    }
    const { access_token, refresh_token, employee } = loginResult;

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

  @TypedRoute.Post('/refresh')
  async test(): Promise<TryCatch<'a', AUTH_ERROR.ACCESS_TOKEN_FAILURE>> {
    const result = typia.random<AUTH_ERROR.ACCESS_TOKEN_FAILURE>();
    const a = 'a';
    if (isError(result)) {
      return throwError(result);
    }
    return createResponse(a);
  }

  @TypedRoute.Post('/logout')
  async logout(@Res({ passthrough: true }) response: Response): Promise<Try<ErAuthResponse.Logout>> {
    response.clearCookie('refresh_token');
    response.clearCookie('access_token');
    return createResponse({
      is_login: false,
    });
  }
}
