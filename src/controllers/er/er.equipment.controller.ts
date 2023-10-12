import { CurrentUser } from '@common/decorators/CurrentUser';
import { AdminGuard } from '@common/guard/admin.guard';
import { createResponse } from '@common/interceptor/createResponse';
import { ER_EQUIPMENT_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import { ErAuth } from '@src/auth/interface';
import { ErEquipmentService } from '@src/providers/er/er.equipment.service';
import { ErEquipmentRequest } from '@src/types';

@Controller('/er/hospitals/current/equipments')
export class ErEquipmentController {
  constructor(private readonly erEquipmentService: ErEquipmentService) {}

  /**
   * 장비 보유현황을 조회합니다.
   *
   * @author anthony
   * @tag er_equipment
   * @summary 2023-10-12 - 장비보유현황 조회
   *
   * @param user
   * @security access_token
   * @returns 장비보유현황
   */
  @TypedRoute.Get('/')
  @UseGuards(ErJwtAccessAuthGuard)
  async getEquipmentStatus(@CurrentUser() user: ErAuth.AccessTokenSignPayload) {
    const equipmentStatus = await this.erEquipmentService.getEquipmentStatus({ user });
    return createResponse(equipmentStatus);
  }

  /**
   * 장비 보유현황을 업데이트합니다.
   * admin권한이 필요합니다.
   * patch document는 json merge patch의 방식을 따릅니다.
   * 업데이트된 장비의 상태를 반환합니다.
   *
   * @author anthony
   * @tag er_equipment
   * @summary 2023-10-12 - 장비보유현황 업데이트
   *
   * @param patchDocument
   * @param user
   * @security access_token
   * @returns 업데이트된 장비의 상태.
   */
  @TypedRoute.Patch('/')
  @UseGuards(ErJwtAccessAuthGuard, AdminGuard)
  @TypedException<ER_EQUIPMENT_ERROR.EQUIPMENT_NOT_EXIST>(
    ER_EQUIPMENT_ERROR.equipmentNotExist.http_status_code,
    ER_EQUIPMENT_ERROR.equipmentNotExist.message,
  )
  async updateEquipmentStatus(
    @TypedBody() patchDocument: ErEquipmentRequest.UpdateEquipmentStatusDto,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ) {
    const result = await this.erEquipmentService.updateEquipmentStatus({ patchDocument, user });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }
}
