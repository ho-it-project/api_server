import { TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';

@Controller()
export class EmsAmbulanceController {
  @TypedRoute.Get('/')
  async getAmbulanceCompanyList() {}
}
