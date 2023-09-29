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
import { throwError } from '../../config/errors/index';
import { ErJwtRefreshuthGuard } from '../guard/er.jwt.refresh.guard';
import { ErAuth } from '../interface/er.auth.interface';
import { AuthService } from '../provider/auth.service';
@Controller('/er/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * @tag er_auth
   * @summary 2023-09-30 - 로그인 상태 확인 및 토큰 재발급
   * @author de-novo
   *
   * @security refresh_token
   *
   * @returns {ErAuthResponse.CheckAuthStatus} 200 - 로그인 상태 확인 및 토큰 재발급
   */
  @TypedRoute.Get('/')
  @UseGuards(ErJwtRefreshuthGuard)
  @TypedException<AUTH_ERROR.REFRESH_TOKEN_FAILURE>(401, '401 - 토큰 만료')
  async checkAuthStatus(
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TryCatch<ErAuthResponse.CheckAuthStatus, AUTH_ERROR.REFRESH_TOKEN_FAILURE>> {
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

  /**
   * @author de-novo
   * @tag er_auth
   * @summary 2023-09-30 - 로그인
   * @server
   *
   * @param loginDTO - 로그인 정보
   * @return {ErAuthResponse.Login} 200 - 로그인
   * @returns
   */
  @TypedRoute.Post('/login')
  @TypedException<AUTH_ERROR.EMPLOYEE_NOT_FOUND>(401, '직원 아이디가 존재하지 않음.')
  @TypedException<AUTH_ERROR.PASSWORD_INCORRECT>(400, '직원 비밀번호 틀림.')
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
