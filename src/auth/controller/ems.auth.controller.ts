import { CurrentUser } from '@common/decorators/CurrentUser';
import { createResponse } from '@common/interceptor/createResponse';
import { AUTH_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedRoute } from '@nestia/core';
import { Controller, Res, UseGuards } from '@nestjs/common';
import { Try, TryCatch } from '@src/types';
import { EmsAuthRequest } from '@src/types/ems.request.dto';
import { EmsAuthResponse } from '@src/types/ems.response.dto';
import { Response } from 'express';
import { assertPrune } from 'typia/lib/misc';
import { EmsJwtRefreshuthGuard } from '../guard/ems.jwt.refresh.guard';
import { EmsAuth } from '../interface';
import { AuthService } from '../provider/common.auth.service';
import { EmsAuthService } from '../provider/ems.auth.service';

@Controller('/ems/auth')
export class EmsAuthController {
  constructor(
    private readonly emsAuthService: EmsAuthService,
    private readonly authService: AuthService,
  ) {}

  /**
   * 로그인 상태 확인 및 토큰 재발급
   *
   * - 로그인 상태를 확인하고, 토큰을 재발급한다.
   * - refresh_token이 존재하면, access_token을 재발급한다.
   * - refresh_token이 존재하지 않으면, 로그인 상태가 아니므로, is_login: false를 반환한다.
   * - refresh_token이 만료되면, 로그인 상태가 아니므로, is_login: false를 반환한다.
   *
   *
   * @author de-novo
   * @tag ems_auth
   * @summary 2023-09-30 - 로그인 상태 확인 및 토큰 재발급 API
   *
   * @security refresh_token
   * @returns 로그인 상태 확인 및 토큰 재발급
   */
  @TypedRoute.Get('/')
  @UseGuards(EmsJwtRefreshuthGuard)
  async checkAuthStatus(
    @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Try<EmsAuthResponse.CheckAuthStatus>> {
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
      const employee = assertPrune<EmsAuth.AccessTokenSignPayload>(user);
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
   * 로그인 API
   *
   * - 로그인을 한다.
   * ## 로그인 성공시
   * - access_token, refresh_token을 발급한다.
   * - access_token, refresh_token을 쿠키에 저장한다.
   * - employee를 반환한다.
   *
   * ## 로그인 실패시
   * - 로그인 실패시, 에러를 반환한다.
   *    - 400 - 직원 아이디가 존재하지 않음.
   *    - 400 - 비밀번호가 틀림.
   *
   * @author de-novo
   * @tag ems_auth
   * @summary 2023-09-30 - 로그인 API
   * @param {EmsAuthRequest.LoginDTO} loginDto.body.required - 로그인 정보
   * @return 로그인 성공
   */
  @TypedRoute.Post('/login')
  @TypedException<AUTH_ERROR.EMPLOYEE_NOT_FOUND>(400, '직원 아이디가 존재하지 않음.')
  @TypedException<AUTH_ERROR.PASSWORD_INCORRECT>(400, '비밀번호가 틀림.')
  async login(
    @TypedBody() loginDto: EmsAuthRequest.LoginDTO,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TryCatch<EmsAuthResponse.Login, AUTH_ERROR.EMPLOYEE_NOT_FOUND | AUTH_ERROR.PASSWORD_INCORRECT>> {
    const result = await this.emsAuthService.login(loginDto);
    if (isError(result)) {
      return throwError(result);
    }
    const { access_token, refresh_token, employee } = result;
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
  /**
   * 로그아웃
   * - 로그아웃을 한다.
   * - 로그아웃시, refresh_token과 access_token을 쿠키에서 삭제한다.
   * @author de-novo
   * @tag ems_auth
   * @summary 2023-09-30 - 로그아웃 API
   *
   * @security refresh_token
   * @security access_token
   * @return {EmsAuthResponse.Logout} 로그아웃
   */
  @TypedRoute.Post('/logout')
  async logout(@Res({ passthrough: true }) response: Response): Promise<Try<EmsAuthResponse.Logout>> {
    response.clearCookie('refresh_token');
    response.clearCookie('access_token');
    return createResponse({
      is_login: false,
    });
  }
}
