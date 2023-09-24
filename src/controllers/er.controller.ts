import { TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { HospitalService } from '../providers/hospital.service';

@Controller('er')
export class ErController {
  constructor(private readonly hospitalService: HospitalService) {}

  @TypedRoute.Get('/')
  async getHello() {
    console.log(await this.hospitalService.getHospitalList());
    return 'Hello World!';
  }
}
