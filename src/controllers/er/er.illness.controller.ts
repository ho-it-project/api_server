import { CurrentUser } from '@common/decorators/CurrentUser';
import { AdminGuard } from '@common/guard/admin.guard';
import { createResponse } from '@common/interceptor/createResponse';
import { isError, throwError } from '@config/errors';
import { TypedBody, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import { ErAuth } from '@src/auth/interface';
import { ErIllnessService } from '@src/providers/er/er.illness.service';
import { ErIllnessRequest, ErIllnessResponse, Try } from '@src/types';

@Controller('/er/hospitals/current/illness')
export class ErIllnessController {
  constructor(private readonly illnessService: ErIllnessService) {}

  @TypedRoute.Get('/')
  @UseGuards(ErJwtAccessAuthGuard)
  async getServableIllnessStatus(
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<Try<ErIllnessResponse.GetServableIllnessStatus>> {
    const result = await this.illnessService.getServableIllnessStatus({ user });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }

  @TypedRoute.Patch('/')
  @UseGuards(ErJwtAccessAuthGuard, AdminGuard)
  async patchServableIllnessStatus(
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
    @TypedBody() document: ErIllnessRequest.UpdateServableIllnessStatusDto,
  ): Promise<Try<ErIllnessResponse.UpdateServableIllnessStatus>> {
    const result = await this.illnessService.upDateServableIllnessStatus({ user, document });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }
}
