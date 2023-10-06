import { CurrentUser } from '@common/decorators/CurrentUser';
import { TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { EmsJwtAccessAuthGuard } from '@src/auth/guard/ems.jwt.access.guard';
import { EmsAuth } from '@src/auth/interface';
import { ReqEmsToErService } from '@src/providers/req/req.emsToEr.service';

@Controller('request/ems-to-er')
export class ReqEmsToErController {
  constructor(private readonly reqEmsToErService: ReqEmsToErService) {}

  /**
   * EMS to ER 수용요청 API
   *
   * 외부에서 응급환자 수용 요청 하는 API 입니다.
   * (EMS -> ER)
   *
   * 본 API는 EMS 시스템에서만 호출 가능합니다.
   * EMS 시스템은 본 API를 호출하여 응급환자 수용 요청을 합니다.
   *
   * 요청생성은 현재 담당중인 환자정보를 기반으로 요청을 생성합니다.
   * (patient_status가 PENDING인 환자정보를 기반으로 요청을 생성)
   *
   * @author de-novo
   * @tag req_ems-to-er-(EMS)
   * @summary EMS to Er 수용요청 생성 API
   *
   * @security access_token
   * @param body
   * @return string
   */
  @TypedRoute.Post('/')
  @UseGuards(EmsJwtAccessAuthGuard)
  createEmsToErRequest(@CurrentUser() user: EmsAuth.AccessTokenSignPayload): string {
    this.reqEmsToErService;
    console.log(user);
    return 'Hello World!';
  }
}
