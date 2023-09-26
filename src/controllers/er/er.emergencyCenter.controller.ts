import { createResponse } from '@common/interceptor/createResponse';
import { TypedQuery, TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { ErEmergencyCenterService } from '@src/providers/er/er.emergencyCenter.service';
import { ErEmergencyCenterRequest, ErEmergencyCenterResponse, Try } from '@src/types';

@Controller('/er/emergency-center')
export class ErEmergencyCenterController {
  constructor(private readonly erEmergencyCenterService: ErEmergencyCenterService) {}

  @TypedRoute.Get('')
  async getEmergencyCenterList(
    @TypedQuery()
    query: ErEmergencyCenterRequest.GetEmergencyCenterListQuery,
  ): Promise<Try<ErEmergencyCenterResponse.GetEmergencyCenterList>> {
    const result = await this.erEmergencyCenterService.getEmergencyCenterListByQuery(query);
    return createResponse(result);
  }
}
